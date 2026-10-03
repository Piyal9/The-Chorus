// ===================================================
// THE CHORUS - SUPABASE CONFIGURATION
// ===================================================

const SUPABASE_URL = 'https://jbrtywpervnlhqntsqwq.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_e_Ysu3CVb4P-0-orwuYr9w_AMflCNtt';

let supabaseClient = null;

if (typeof window !== 'undefined' && typeof window.supabase !== 'undefined' && SUPABASE_URL && SUPABASE_ANON_KEY) {
    try {
        supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log('⚡ Supabase Client initialized successfully');
    } catch (err) {
        console.error('⚠️ Failed to initialize Supabase client:', err);
    }
} else {
    console.warn('⚠️ Supabase library not loaded yet or credentials missing');
}

window.supabaseClient = supabaseClient;
