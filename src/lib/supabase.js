import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://wmuvnhjakaraqrddlyhg.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndtdXZuaGpha2FyYXFyZGRseWhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5NzQzNzAsImV4cCI6MjA4NjU1MDM3MH0.eSIQyMGE9aTPOYPXSJUUT0yvbO8Le5acCogwGfG63GU'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
