-- ============================================================
-- Migration: Implement remaining PDF sections (5,7,8,11,15,16)
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================================

-- Section 5: Past Dental Treatment
CREATE TABLE IF NOT EXISTS past_dental_treatments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    treatment TEXT NOT NULL,
    tooth_number INT,
    treated_by TEXT,
    treated_date DATE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE past_dental_treatments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for authenticated" ON past_dental_treatments FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Section 7: Investigations
CREATE TABLE IF NOT EXISTS investigations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    investigation_type TEXT NOT NULL, -- 'dental' or 'blood'
    investigation_name TEXT NOT NULL, -- e.g. 'IOPAR', 'CBC'
    result TEXT,
    notes TEXT,
    investigation_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE investigations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for authenticated" ON investigations FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Section 8: Diagnosis
CREATE TABLE IF NOT EXISTS diagnoses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    diagnosis TEXT NOT NULL,
    since TEXT,
    comment TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE diagnoses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for authenticated" ON diagnoses FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Section 11: Consent Forms
CREATE TABLE IF NOT EXISTS consent_forms (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    treatment TEXT NOT NULL,
    consent_text TEXT,
    patient_signature BOOLEAN DEFAULT FALSE,
    signed_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE consent_forms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for authenticated" ON consent_forms FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Section 15: Accounting
CREATE TABLE IF NOT EXISTS accounting (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    category TEXT NOT NULL, -- Staff Salary, Electricity Bill, Lab Bill, etc.
    description TEXT,
    amount NUMERIC(10,2) NOT NULL DEFAULT 0,
    expense_date DATE DEFAULT CURRENT_DATE,
    remark TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE accounting ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for authenticated" ON accounting FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Add physician_name and on_medication to patients if not exists
DO $$ BEGIN
    ALTER TABLE patients ADD COLUMN IF NOT EXISTS physician_name TEXT;
    ALTER TABLE patients ADD COLUMN IF NOT EXISTS on_medication TEXT;
    ALTER TABLE patients ADD COLUMN IF NOT EXISTS first_name TEXT;
    ALTER TABLE patients ADD COLUMN IF NOT EXISTS middle_name TEXT;
    ALTER TABLE patients ADD COLUMN IF NOT EXISTS last_name TEXT;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
