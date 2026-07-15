CREATE TABLE clients (
    id BIGSERIAL PRIMARY KEY,
    business_id BIGINT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    first_name VARCHAR(80) NOT NULL,
    last_name VARCHAR(80) NOT NULL,
    phone VARCHAR(32) NOT NULL,
    email VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_clients_business_phone ON clients(business_id, phone);

ALTER TABLE appointments ADD COLUMN client_id BIGINT REFERENCES clients(id) ON DELETE SET NULL;

-- Migrate existing unique clients from appointments into clients table
INSERT INTO clients (business_id, first_name, last_name, phone, email, created_at)
SELECT DISTINCT ON (business_id, client_phone)
    business_id,
    client_first_name,
    client_last_name,
    client_phone,
    client_email,
    CURRENT_TIMESTAMP
FROM appointments
ON CONFLICT DO NOTHING;

-- Map appointments back to the newly created clients
UPDATE appointments a
SET client_id = c.id
FROM clients c
WHERE a.business_id = c.business_id
  AND a.client_phone = c.phone;
