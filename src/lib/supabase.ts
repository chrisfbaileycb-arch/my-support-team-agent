import { createClient } from '@supabase/supabase-js';


// Initialize database client
const supabaseUrl = 'https://dyiddkrmykzkvxhdmavd.databasepad.com';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IjU3YmQ4MjU5LWNjNTUtNGJlNy1iNTE0LTczYWE1ZjU5MjY4ZSJ9.eyJwcm9qZWN0SWQiOiJkeWlkZGtybXlremt2eGhkbWF2ZCIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzg3NTQ3MjAyLCJleHAiOjIxMDI5MDcyMDIsImlzcyI6ImZhbW91cy5kYXRhYmFzZXBhZCIsImF1ZCI6ImZhbW91cy5jbGllbnRzIn0.Au8xULUbesNtM27semsxQGXbvFSZnuyhgS9N5d6yA7M';
const supabase = createClient(supabaseUrl, supabaseKey);


export { supabase };