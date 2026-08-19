import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabasePublishableKey = process.env.REACT_APP_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabasePublishableKey) {
    // Mantém a falha legível durante o desenvolvimento, sem colocar chaves no código-fonte.
    // O build continua possível; as telas protegidas informarão a configuração ausente.
    // eslint-disable-next-line no-console
    console.warn('Supabase não configurado. Defina REACT_APP_SUPABASE_URL e REACT_APP_SUPABASE_PUBLISHABLE_KEY.');
}

export const supabase = createClient(
    supabaseUrl || 'https://placeholder.supabase.co',
    supabasePublishableKey || 'sb_publishable_placeholder',
    {
        auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true,
        },
    },
);

export function isSupabaseConfigured() {
    return Boolean(supabaseUrl && supabasePublishableKey);
}
