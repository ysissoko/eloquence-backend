import { createClient } from '@supabase/supabase-js';

// Configure Supabase client
const supabaseUrl: string = process.env.SUPABASE_URL!;
const supabaseKey: string = process.env.SUPABASE_KEY!;

export default createClient(supabaseUrl, supabaseKey);
