import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Lazily initialized — createClient is only called at request time, not during build.
// This prevents build failures when env vars are not available in CI/build environments.
let _client: SupabaseClient | null = null;

function getClient(): SupabaseClient {
    if (_client) return _client;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
        throw new Error('Supabase credentials not found in environment! Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
    }

    _client = createClient(supabaseUrl, supabaseKey, {
        auth: { persistSession: false },
    });

    return _client;
}

export const supabase = new Proxy({} as SupabaseClient, {
    get(_target, prop) {
        return (getClient() as unknown as Record<string | symbol, unknown>)[prop];
    },
});
