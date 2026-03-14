// =============================================
// Supabase Client Configuration
// =============================================
// Creates and exports a Supabase client instance
// that we use throughout the backend to read/write
// data to our Postgres database.
// =============================================

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('your_')) {
    console.warn('⚠️  Supabase credentials not configured yet. Database features will not work.');
    console.warn('   Set SUPABASE_URL and SUPABASE_ANON_KEY in your .env file.');
}

const supabase = (supabaseUrl && supabaseKey && !supabaseUrl.includes('your_'))
    ? createClient(supabaseUrl, supabaseKey)
    : null;

module.exports = supabase;
