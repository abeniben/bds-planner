import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://nzptrkfsjzkmfkrjnqsu.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im56cHRya2ZzanprbWZrcmpucXN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1MTYyNjAsImV4cCI6MjA3MDA5MjI2MH0.6XYrmpvh2Nq4Ey0BFdtM1voUPsjCDhkylajtr06tHqY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);