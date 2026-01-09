-- Bloque 6: Usuarios y Seguridad
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) CHECK (role IN ('medico', 'admin')) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bloque 4: Datos de Pacientes
CREATE TABLE IF NOT EXISTS patients (
  id SERIAL PRIMARY KEY,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  age INTEGER NOT NULL,
  gender VARCHAR(50),
  insurance VARCHAR(100), -- Cobertura (PAMI, OSDE, etc)
  primary_condition VARCHAR(100), -- Patología principal
  system_type VARCHAR(50), -- Opcional, flexibilizado
  social_vulnerability INTEGER DEFAULT 1,
  social_factors JSONB DEFAULT '[]',
  admission_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER REFERENCES users(id) -- Quién creó al paciente
);

-- Bloque 4: Diagnósticos
CREATE TABLE IF NOT EXISTS diagnostics (
  id SERIAL PRIMARY KEY,
  patient_id INTEGER REFERENCES patients(id) ON DELETE CASCADE,
  type VARCHAR(100) NOT NULL, -- diabetes, HTA, IC, EPOC
  start_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bloque 4: Eventos Clínicos
CREATE TABLE IF NOT EXISTS clinical_events (
  id SERIAL PRIMARY KEY,
  patient_id INTEGER REFERENCES patients(id) ON DELETE CASCADE,
  type VARCHAR(50) CHECK (type IN ('consulta', 'guardia', 'internacion')) NOT NULL,
  date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bloque 4: Mediciones Clínicas [NEW]
CREATE TABLE IF NOT EXISTS clinical_measurements (
  id SERIAL PRIMARY KEY,
  patient_id INTEGER REFERENCES patients(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- peso, creatinina, tension_arterial, etc
  value DECIMAL(10, 2) NOT NULL,
  unit VARCHAR(20),
  date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bloque 4: Medicación
CREATE TABLE IF NOT EXISTS medications (
  id SERIAL PRIMARY KEY,
  patient_id INTEGER REFERENCES patients(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bloque 4: Riesgo (Solo lectura/guardado)
CREATE TABLE IF NOT EXISTS risk_assessments (
  id SERIAL PRIMARY KEY,
  patient_id INTEGER REFERENCES patients(id) ON DELETE CASCADE,
  score DECIMAL(5, 2),
  category VARCHAR(50) NOT NULL,
  source VARCHAR(100), -- 'REALTIME_AI'
  summary TEXT,
  drivers JSONB DEFAULT '[]',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
