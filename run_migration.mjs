// Run database migration for remaining PDF sections
// Usage: node run_migration.mjs

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    'https://wmuvnhjakaraqrddlyhg.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndtdXZuaGpha2FyYXFyZGRseWhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5NzQzNzAsImV4cCI6MjA4NjU1MDM3MH0.eSIQyMGE9aTPOYPXSJUUT0yvbO8Le5acCogwGfG63GU'
)

// Test each table by trying to select from it
const tables = ['past_dental_treatments', 'investigations', 'diagnoses', 'consent_forms', 'accounting']

for (const table of tables) {
    const { data, error } = await supabase.from(table).select('id').limit(1)
    if (error) {
        console.log(`❌ ${table}: ${error.message}`)
    } else {
        console.log(`✅ ${table}: exists`)
    }
}

// Test patients columns
const { data: patData, error: patError } = await supabase.from('patients').select('id, physician_name, on_medication').limit(1)
if (patError) {
    console.log(`❌ patients columns: ${patError.message}`)
} else {
    console.log(`✅ patients: physician_name, on_medication columns exist`)
}
