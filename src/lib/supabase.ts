import { googleClient } from '@/lib/google-storage';

// Google Native Database and Gemini API client (replaces previous builder lock-ins)
const supabase = googleClient;

export { supabase, googleClient };
