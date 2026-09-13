// Google Native Client & Storage Adapter
// Direct, resilient interface to server SQLite DB & Google Gemini endpoints

export interface QueryResult<T> {
  data: T | null;
  error: Error | null;
}

type FilterValue = string | number | boolean | null | undefined;

interface TableFilter {
  field: string;
  op: 'eq' | 'is';
  val: FilterValue;
}

export const getStoredAuthSession = (): {
  user?: { id: string; email?: string; [key: string]: unknown };
  session?: { access_token: string; expires_at?: string };
} | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('myf_google_auth');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const getAuthHeaders = (): Record<string, string> => {
  const s = getStoredAuthSession();
  const token = s?.session?.access_token;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

class GoogleTableQuery<T = Record<string, unknown>> {
  private tableName: string;
  private filters: TableFilter[] = [];
  private orderConfig?: { field: string; ascending: boolean };
  private limitCount?: number;

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  select(_columns = '*') {
    return this;
  }

  eq(field: string, val: FilterValue) {
    this.filters.push({ field, op: 'eq', val });
    return this;
  }

  is(field: string, val: FilterValue) {
    this.filters.push({ field, op: 'is', val });
    return this;
  }

  order(field: string, { ascending = true } = {}) {
    this.orderConfig = { field, ascending };
    return this;
  }

  limit(count: number) {
    this.limitCount = count;
    return this;
  }

  private getLocalStorageItems(): Record<string, unknown>[] {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(`myf_${this.tableName}`);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  private setLocalStorageItems(items: Record<string, unknown>[]) {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(`myf_${this.tableName}`, JSON.stringify(items));
    } catch (e) {
      console.warn('Storage write skipped', e);
    }
  }

  async maybeSingle(): Promise<{ data: T | null; error: Error | null }> {
    const res = await this.execute();
    const item = Array.isArray(res.data) && res.data.length > 0 ? res.data[0] : null;
    return { data: item as T, error: res.error };
  }

  async single(): Promise<{ data: T | null; error: Error | null }> {
    return this.maybeSingle();
  }

  async then<TResult1 = QueryResult<T[]>, TResult2 = never>(
    onfulfilled?: ((value: QueryResult<T[]>) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    try {
      const res = await this.execute();
      if (onfulfilled) {
        return onfulfilled(res as QueryResult<T[]>);
      }
      return res as unknown as TResult1;
    } catch (err) {
      if (onrejected) {
        return onrejected(err);
      }
      throw err;
    }
  }

  private async execute(): Promise<QueryResult<T[]>> {
    try {
      let items: Record<string, unknown>[] = [];
      let apiEndpoint = '';

      if (this.tableName === 'agent_runs') apiEndpoint = '/api/runs';
      else if (this.tableName === 'saved_opportunities') apiEndpoint = '/api/pipeline';
      else if (this.tableName === 'final_reports') apiEndpoint = '/api/reports';
      else if (this.tableName === 'agent_schedules') apiEndpoint = '/api/schedules';
      else if (this.tableName === 'profiles') apiEndpoint = '/api/auth/profile';

      if (apiEndpoint) {
        try {
          const userFilter = this.filters.find((f) => f.field === 'user_id' || f.field === 'id');
          let url = apiEndpoint;
          if (userFilter?.val && apiEndpoint !== '/api/auth/profile') {
            url += `?userId=${encodeURIComponent(String(userFilter.val))}`;
          }

          let resp = await fetch(url, { headers: getAuthHeaders() });
          if (resp.status === 401 && apiEndpoint === '/api/runs') {
            resp = await fetch('/api/demo/runs');
          }
          if (resp.ok) {
            const json = await resp.json();
            if (this.tableName === 'profiles') {
              items = json.profile ? [json.profile] : [];
            } else if (Array.isArray(json)) {
              items = json;
            } else if (json && Array.isArray(json.runs)) {
              items = json.runs;
            } else if (json && Array.isArray(json.items)) {
              items = json.items;
            } else {
              items = this.getLocalStorageItems();
            }
            this.setLocalStorageItems(items);
          } else {
            items = this.getLocalStorageItems();
          }
        } catch {
          items = this.getLocalStorageItems();
        }
      } else {
        items = this.getLocalStorageItems();
      }

      // Apply client-side filters
      let result = items.filter((item) => {
        return this.filters.every((f) => {
          if (f.op === 'eq') return String(item[f.field]) === String(f.val);
          if (f.op === 'is') return f.val === null ? item[f.field] == null : item[f.field] === f.val;
          return true;
        });
      });

      if (this.orderConfig) {
        const { field, ascending } = this.orderConfig;
        result.sort((a, b) => {
          const valA = String(a[field] || '');
          const valB = String(b[field] || '');
          return ascending ? (valA > valB ? 1 : -1) : valA < valB ? 1 : -1;
        });
      }

      if (this.limitCount) {
        result = result.slice(0, this.limitCount);
      }

      return { data: result as unknown as T[], error: null };
    } catch (err) {
      return { data: null, error: err as Error };
    }
  }

  async insert(payload: Record<string, unknown>) {
    const list = this.getLocalStorageItems();
    const item = {
      id: payload.id || `rec_${Math.random().toString(36).slice(2, 10)}`,
      ...payload,
      created_at: payload.created_at || new Date().toISOString(),
    };
    list.unshift(item);
    this.setLocalStorageItems(list);

    // Sync to real server database
    try {
      if (this.tableName === 'saved_opportunities') {
        const res = await fetch('/api/pipeline', {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(item),
        });
        if (res.ok) {
          const saved = await res.json();
          return {
            select: () => ({
              maybeSingle: async () => ({ data: saved as unknown as T, error: null }),
              single: async () => ({ data: saved as unknown as T, error: null }),
            }),
            data: saved,
            error: null,
          };
        }
      } else if (this.tableName === 'agent_runs') {
        await fetch('/api/runs', {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(item),
        });
      } else if (this.tableName === 'profiles') {
        await fetch('/api/auth/profile', {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify(item),
        });
      }
    } catch {
      // offline buffer preserved
    }

    return {
      select: () => ({
        maybeSingle: async () => ({ data: item as unknown as T, error: null }),
        single: async () => ({ data: item as unknown as T, error: null }),
      }),
      data: item,
      error: null,
    };
  }

  async upsert(payload: Record<string, unknown> | Record<string, unknown>[]) {
    const list = this.getLocalStorageItems();
    const items = Array.isArray(payload) ? payload : [payload];
    items.forEach((item) => {
      const idx = list.findIndex((x) => x.id === item.id || (item.agent_id && x.agent_id === item.agent_id));
      if (idx >= 0) {
        list[idx] = { ...list[idx], ...item };
      } else {
        list.push({ id: item.id || `rec_${Math.random().toString(36).slice(2, 10)}`, ...item });
      }
    });
    this.setLocalStorageItems(list);

    try {
      if (this.tableName === 'agent_schedules') {
        await fetch('/api/schedules', {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            entries: Array.isArray(payload)
              ? Object.fromEntries(payload.map((p) => [String(p.agent_id), String(p.cadence)]))
              : { [String(payload.agent_id)]: String(payload.cadence) },
          }),
        });
      } else if (this.tableName === 'profiles') {
        const item = Array.isArray(payload) ? payload[0] : payload;
        await fetch('/api/auth/profile', {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify(item),
        });
      }
    } catch {
      // offline buffer preserved
    }

    return { data: items, error: null };
  }

  async update(patch: Record<string, unknown>) {
    const list = this.getLocalStorageItems();
    list.forEach((item) => {
      const match = this.filters.every((f) => {
        if (f.op === 'eq') return String(item[f.field]) === String(f.val);
        return true;
      });
      if (match) {
        Object.assign(item, patch);
      }
    });
    this.setLocalStorageItems(list);

    try {
      const idFilter = this.filters.find((f) => f.field === 'id');
      if (idFilter && this.tableName === 'saved_opportunities') {
        await fetch(`/api/pipeline/${idFilter.val}`, {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify(patch),
        });
      } else if (idFilter && this.tableName === 'final_reports' && patch.completed_steps) {
        await fetch(`/api/reports/${idFilter.val}/steps`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({ completed: patch.completed_steps }),
        });
      } else if (this.tableName === 'profiles') {
        await fetch('/api/auth/profile', {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify(patch),
        });
      }
    } catch {
      // offline buffer preserved
    }

    return {
      eq: (field: string, val: FilterValue) => {
        this.filters.push({ field, op: 'eq', val });
        return this.update(patch);
      },
      is: (field: string, val: FilterValue) => {
        this.filters.push({ field, op: 'is', val });
        return this.update(patch);
      },
      select: (_cols?: string) => ({
        then: (fn: (res: { data: Record<string, unknown>[]; error: null }) => unknown) => fn({ data: list, error: null }),
      }),
      data: list,
      error: null,
    };
  }

  async delete() {
    return {
      eq: async (field: string, val: FilterValue) => {
        const list = this.getLocalStorageItems().filter((item) => String(item[field]) !== String(val));
        this.setLocalStorageItems(list);
        if (field === 'id' && this.tableName === 'saved_opportunities') {
          try {
            await fetch(`/api/pipeline/${val}`, { method: 'DELETE', headers: getAuthHeaders() });
          } catch {
            /* offline */
          }
        } else if (field === 'id' && this.tableName === 'final_reports') {
          try {
            await fetch(`/api/reports/${val}`, { method: 'DELETE', headers: getAuthHeaders() });
          } catch {
            /* offline */
          }
        }
        return { error: null };
      },
    };
  }
}

// Function invocations powered natively by Google Gemini Express backend
class GoogleFunctions {
  async invoke(functionName: string, { body }: { body: Record<string, unknown> }) {
    try {
      let endpoint = '';
      const session = getStoredAuthSession();
      const hasToken = Boolean(session?.session?.access_token);

      if (functionName === 'run-agent') {
        endpoint = hasToken ? '/api/agent/run' : '/api/demo/agent/run';
      } else if (functionName === 'axis-report') {
        endpoint = '/api/reports/generate';
      } else if (functionName === 'run-schedules') {
        endpoint = '/api/runs/trigger';
      } else {
        endpoint = `/api/${functionName}`;
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) {
        return { data: null, error: new Error(data.error || `Server request failed with status ${res.status}`) };
      }

      return { data, error: null };
    } catch (err) {
      return { data: null, error: err as Error };
    }
  }
}

interface AuthSession {
  access_token: string;
  expires_at?: string;
  user?: { id: string; email?: string; [key: string]: unknown };
}

// Google Native Auth Client
class GoogleAuth {
  private authListeners: Array<(event: string, session: AuthSession | null) => void> = [];

  private getSessionFromStorage(): { user?: { id: string; email?: string }; session?: AuthSession } | null {
    return getStoredAuthSession();
  }

  private saveSession(user: { id: string; email?: string }, session: AuthSession) {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem('myf_google_auth', JSON.stringify({ user, session }));
    } catch (e) {
      console.warn('Storage save failed', e);
    }
  }

  async getSession() {
    const s = this.getSessionFromStorage();
    return { data: { session: s?.session || null }, error: null };
  }

  async getUser() {
    const s = this.getSessionFromStorage();
    return { data: { user: s?.user || null }, error: null };
  }

  async signUp({ email, password, options }: { email: string; password?: string; options?: { data?: Record<string, unknown> } }) {
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          name: options?.data?.display_name,
          phone: options?.data?.phone,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { data: null, error: new Error(data.error || 'Signup failed') };
      }
      this.saveSession(data.user, data.session);
      this.notify('SIGNED_IN', data.session);
      return { data, error: null };
    } catch (err) {
      return { data: null, error: err as Error };
    }
  }

  async signInWithPassword({ email, password }: { email: string; password?: string }) {
    try {
      const res = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { data: null, error: new Error(data.error || 'Invalid credentials') };
      }
      this.saveSession(data.user, data.session);
      this.notify('SIGNED_IN', data.session);
      return { data, error: null };
    } catch (err) {
      return { data: null, error: err as Error };
    }
  }

  async signOut() {
    const token = getStoredAuthSession()?.session?.access_token;
    if (token) {
      try {
        await fetch('/api/auth/signout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });
      } catch {
        // ignore network error on signout
      }
    }
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('myf_google_auth');
      } catch (e) {
        console.warn('Storage signout error', e);
      }
    }
    this.notify('SIGNED_OUT', null);
    return { error: null };
  }

  onAuthStateChange(callback: (event: string, session: AuthSession | null) => void) {
    this.authListeners.push(callback);
    return {
      data: {
        subscription: {
          unsubscribe: () => {
            this.authListeners = this.authListeners.filter((cb) => cb !== callback);
          },
        },
      },
    };
  }

  private notify(event: string, session: AuthSession | null) {
    this.authListeners.forEach((cb) => {
      try {
        cb(event, session);
      } catch (e) {
        console.warn('Auth callback error', e);
      }
    });
  }
}

class GoogleNativeClient {
  auth = new GoogleAuth();
  functions = new GoogleFunctions();

  from(tableName: string) {
    return new GoogleTableQuery(tableName);
  }
}

export const googleClient = new GoogleNativeClient();
export const supabase = googleClient;

