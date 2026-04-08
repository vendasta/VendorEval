CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users
CREATE TABLE IF NOT EXISTS users (
    id         SERIAL PRIMARY KEY,
    name       VARCHAR(100) NOT NULL,
    email      VARCHAR(255) UNIQUE NOT NULL,
    password   VARCHAR(255) NOT NULL,
    company    VARCHAR(100),
    role       VARCHAR(20) DEFAULT 'user',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Evaluation sessions
CREATE TABLE IF NOT EXISTS evaluations (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id          INT REFERENCES users(id),
    title            VARCHAR(255) NOT NULL,
    status           VARCHAR(30) DEFAULT 'pending',
    -- pending | extracting | scoring | completed | failed
    requirements_text TEXT,
    requirements_file VARCHAR(255),
    vendor_count     INT DEFAULT 0,
    winner_vendor_id UUID,
    created_at       TIMESTAMP DEFAULT NOW(),
    completed_at     TIMESTAMP
);

-- Individual vendor proposals
CREATE TABLE IF NOT EXISTS vendors (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    evaluation_id     UUID REFERENCES evaluations(id),
    name              VARCHAR(255) NOT NULL,
    file_name         VARCHAR(255),
    raw_text          TEXT,
    -- Extracted fields
    total_cost        DECIMAL(15,2),
    currency          VARCHAR(10) DEFAULT 'INR',
    timeline_weeks    INT,
    payment_terms     TEXT,
    sla_uptime        VARCHAR(50),
    sla_response_time VARCHAR(50),
    warranty_months   INT,
    support_type      VARCHAR(100),
    -- Scores (0-100)
    overall_score     DECIMAL(5,2),
    cost_score        DECIMAL(5,2),
    timeline_score    DECIMAL(5,2),
    quality_score     DECIMAL(5,2),
    risk_score        DECIMAL(5,2),
    sla_score         DECIMAL(5,2),
    -- AI outputs
    summary           TEXT,
    strengths         JSONB,
    weaknesses        JSONB,
    red_flags         JSONB,
    hidden_costs      JSONB,
    extracted_data    JSONB,
    created_at        TIMESTAMP DEFAULT NOW()
);

-- Red flags per vendor
CREATE TABLE IF NOT EXISTS red_flags (
    id            SERIAL PRIMARY KEY,
    vendor_id     UUID REFERENCES vendors(id),
    severity      VARCHAR(20), -- critical | high | medium | low
    category      VARCHAR(50), -- pricing | legal | timeline | sla | compliance
    description   TEXT,
    clause_text   TEXT,
    page_reference VARCHAR(50)
);

-- AI recommendation per evaluation
CREATE TABLE IF NOT EXISTS recommendations (
    id                SERIAL PRIMARY KEY,
    evaluation_id     UUID REFERENCES evaluations(id),
    recommended_vendor_id UUID REFERENCES vendors(id),
    reasoning         TEXT,
    confidence_score  DECIMAL(5,2),
    alternatives      JSONB,
    risks             JSONB,
    negotiation_tips  JSONB,
    created_at        TIMESTAMP DEFAULT NOW()
);

-- Chat history per evaluation
CREATE TABLE IF NOT EXISTS chat_messages (
    id            SERIAL PRIMARY KEY,
    evaluation_id UUID REFERENCES evaluations(id),
    role          VARCHAR(20), -- user | assistant
    content       TEXT,
    created_at    TIMESTAMP DEFAULT NOW()
);

-- Demo users
INSERT INTO users (name, email, password, company, role) VALUES
  ('Demo Procurement Manager', 'demo@vendoreval.ai',
   '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
   'Acme Corp', 'demo'),
  ('Admin', 'admin@vendoreval.ai',
   '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
   'VendorEval', 'admin')
ON CONFLICT (email) DO NOTHING;
