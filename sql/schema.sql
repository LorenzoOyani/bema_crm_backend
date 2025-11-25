-- Basic schema for Phase 0

-- subscribers: core contact info
CREATE TABLE IF NOT EXISTS subscriber (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255),
  email VARCHAR(255) UNIQUE NOT NULL,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- custom_fields: defines flexible global fields (e.g. BC_field_enrollment_status)
CREATE TABLE IF NOT EXISTS custom_fields (
  id SERIAL PRIMARY KEY,
  field_name VARCHAR(255) UNIQUE NOT NULL,
  field_type VARCHAR(50) NOT NULL DEFAULT 'text',
  default_value TEXT
);



-- subscriber_custom_field_values: EAV values for each subscriber
CREATE TABLE IF NOT EXISTS subscriber_custom_field_values (
  id SERIAL PRIMARY KEY,
  subscriber_id INTEGER NOT NULL REFERENCES subscriber(id) ON DELETE CASCADE,
  field_id INTEGER NOT NULL REFERENCES custom_fields(id) ON DELETE CASCADE,
  field_value TEXT,
  UNIQUE (subscriber_id, field_id)
);

-- subscriber_campaign_participation: which campaign + group a subscriber is in
CREATE TABLE IF NOT EXISTS subscriber_campaign_participation (
  id SERIAL PRIMARY KEY,
  subscriber_id INTEGER NOT NULL REFERENCES subscriber(id) ON DELETE CASCADE,
  campaign_id VARCHAR(100) NOT NULL,
  campaign_group VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (subscriber_id, campaign_id)
);


CREATE TABLE IF NOT EXISTS email_logs (
  id SERIAL PRIMARY KEY,
  subscriber_id INTEGER REFERENCES subscriber(id) ON DELETE SET NULL,
  campaign_id VARCHAR(100),
  template_name VARCHAR(255),
  sent_at TIMESTAMP DEFAULT NOW(),
  status VARCHAR(50),
  raw_response JSONB
);



INSERT INTO custom_fields (field_name, field_type, default_value)
VALUES
  ('BC_field_enrollment_status', 'text', 'none'),
  ('BC_field_contrib_sum', 'int', '0'),
  ('BC_field_ref_verified', 'text', 'no'),
  ('BC_field_ref_level', 'int', '0')
ON CONFLICT (field_name) DO NOTHING;

-- flow_logs: debug table for n8n Flow-to-Flow PoC
CREATE TABLE IF NOT EXISTS flow_logs (
  id SERIAL PRIMARY KEY,
  payload JSONB NOT NULL,
  note VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);


CREATE TABLE IF NOT EXISTS email_templates (
  id SERIAL PRIMARY KEY,
  template_name VARCHAR(255) NOT NULL UNIQUE,
  subject_template TEXT NOT NULL,
  html_template TEXT NOT NULL,
  text_template TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
)

