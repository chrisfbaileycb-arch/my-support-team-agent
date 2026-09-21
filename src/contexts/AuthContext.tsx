import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import {
  auth,
  db,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  firebaseSignOut,
  doc,
  setDoc,
} from '@/lib/firebase';

export interface Profile {
  id: string;
  email: string | null;
  display_name: string | null;
  phone: string | null;
  covenant_accepted_at: string | null;
}

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (args: { email: string; password: string; name?: string; phone?: string }) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  acceptCovenant: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const user = session?.user ?? null;

  const loadProfile = useCallback(async (u: User | null) => {
    if (!u) {
      setProfile(null);
      return;
    }
    const { data } = await supabase.from('profiles').select('*').eq('id', u.id).maybeSingle();
    if (data) {
      setProfile(data as Profile);
      return;
    }
    // First sign-in on this device: create the member row.
    const meta = (u.user_metadata || {}) as Record<string, string>;
    const row = {
      id: u.id,
      email: u.email ?? null,
      display_name: meta.display_name ?? null,
      phone: meta.phone ?? null,
      covenant_accepted_at: meta.covenant_accepted_at ?? null,
    };
    const { data: created } = await supabase.from('profiles').insert(row).select().maybeSingle();
    setProfile((created as Profile) ?? (row as Profile));
  }, []);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return;
      setSession(data.session ?? null);
      await loadProfile(data.session?.user ?? null);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      loadProfile(s?.user ?? null);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [loadProfile]);

  const signUp = useCallback(
    async ({ email, password, name, phone }: { email: string; password: string; name?: string; phone?: string }) => {
      const acceptedAt = new Date().toISOString();
      
      // Attempt Firebase auth signup
      try {
        const fbCred = await createUserWithEmailAndPassword(auth, email, password);
        if (fbCred.user) {
          // Sync user profile to Firestore
          await setDoc(doc(db, 'profiles', fbCred.user.uid), {
            id: fbCred.user.uid,
            email,
            display_name: name || null,
            phone: phone || null,
            covenant_accepted_at: acceptedAt,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        }
      } catch (fbErr) {
        console.info('Firebase auth pass:', (fbErr as Error).message);
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { display_name: name ?? '', phone: phone ?? '', covenant_accepted_at: acceptedAt } },
      });
      if (error) throw new Error(error.message);
      if (data.user) {
        await supabase.from('profiles').upsert({
          id: data.user.id,
          email,
          display_name: name ?? null,
          phone: phone ?? null,
          covenant_accepted_at: acceptedAt,
        });
        await loadProfile(data.user);
      }
    },
    [loadProfile]
  );

  const signIn = useCallback(
    async (email: string, password: string) => {
      // Sign into Firebase Auth if possible
      try {
        await signInWithEmailAndPassword(auth, email, password);
      } catch (fbErr) {
        console.info('Firebase signin info:', (fbErr as Error).message);
      }

      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw new Error(error.message);
      await loadProfile(data.user ?? null);
    },
    [loadProfile]
  );

  const signOut = useCallback(async () => {
    try {
      await firebaseSignOut(auth);
    } catch {
      /* ignore */
    }
    await supabase.auth.signOut();
    setProfile(null);
    setSession(null);
  }, []);

  const acceptCovenant = useCallback(async () => {
    if (!user) return;
    const at = new Date().toISOString();
    await supabase.from('profiles').update({ covenant_accepted_at: at, updated_at: at }).eq('id', user.id);
    setProfile((p) => (p ? { ...p, covenant_accepted_at: at } : p));
  }, [user]);

  const refreshProfile = useCallback(async () => loadProfile(user), [loadProfile, user]);

  const value = useMemo(
    () => ({ user, session, profile, loading, signUp, signIn, signOut, acceptCovenant, refreshProfile }),
    [user, session, profile, loading, signUp, signIn, signOut, acceptCovenant, refreshProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
