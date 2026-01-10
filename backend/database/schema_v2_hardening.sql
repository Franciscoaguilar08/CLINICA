-- AUDIT REMEDIATION V2: SAFETY & COMPLIANCE HARDENING
-- Justification:
-- 1. Audit Logs: Mandatory for HIPAA/IEC 62304 traceability.
-- 2. Allergies: Critical context for Adverse Drug Event (ADE) risk prediction.
-- 3. Dosage/Freq: High dosage = Higher toxicity risk (Feature for XGBoost).

-- 1. IMMUTABLE AUDIT LOGS (The "Black Box")
CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    actor_id INTEGER, -- Nullable if system action
    action VARCHAR(50) NOT NULL, -- 'VIEW_PATIENT', 'UPDATE_RISK', 'EXPORT_DATA'
    target_entity VARCHAR(50) NOT NULL, -- 'patient', 'risk_assessment'
    target_id INTEGER,
    details JSONB, -- Previous state, IP address, etc.
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. ALLERGIES (Critical Context for Risk)
CREATE TABLE IF NOT EXISTS allergies (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER REFERENCES patients(id) ON DELETE CASCADE,
    allergen VARCHAR(200) NOT NULL, -- 'Penicillin', 'Peanuts'
    severity VARCHAR(20) CHECK (severity IN ('MILD', 'MODERATE', 'SEVERE', 'ANAPHYLAXIS')),
    reaction TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. MEDICATION GRANULARITY (Better Features for ML)
-- If columns don't exist, this prevents errors (Postgres 9.6+)
DO $$
BEGIN
    BEGIN
        ALTER TABLE medications ADD COLUMN dosage VARCHAR(100);
    EXCEPTION
        WHEN duplicate_column THEN RAISE NOTICE 'column dosage already exists in medications.';
    END;
    BEGIN
        ALTER TABLE medications ADD COLUMN frequency VARCHAR(100);
    EXCEPTION
        WHEN duplicate_column THEN RAISE NOTICE 'column frequency already exists in medications.';
    END;
END
$$;

-- 4. PATIENT SAFETY (Unique Identity)
DO $$
BEGIN
    BEGIN
        ALTER TABLE patients ADD COLUMN identifier VARCHAR(50) UNIQUE;
    EXCEPTION
        WHEN duplicate_column THEN RAISE NOTICE 'column identifier already exists in patients.';
    END;
END
$$;
