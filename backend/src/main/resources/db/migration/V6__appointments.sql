CREATE TABLE appointments (
    id                BIGSERIAL PRIMARY KEY,
    business_id       BIGINT       NOT NULL REFERENCES businesses (id) ON DELETE CASCADE,
    service_id        BIGINT       NOT NULL REFERENCES services (id),
    professional_id   BIGINT       NOT NULL REFERENCES professionals (id),
    branch_id         BIGINT       REFERENCES branches (id),
    client_first_name VARCHAR(80)  NOT NULL,
    client_last_name  VARCHAR(80)  NOT NULL,
    client_phone      VARCHAR(32)  NOT NULL,
    client_email      VARCHAR(255),
    notes             TEXT,
    starts_at         TIMESTAMPTZ  NOT NULL,
    ends_at           TIMESTAMPTZ  NOT NULL,
    price             NUMERIC(12, 2),
    status            VARCHAR(32)  NOT NULL DEFAULT 'CONFIRMED',
    created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_appointments_business_starts_at ON appointments (business_id, starts_at);
CREATE INDEX idx_appointments_business_status ON appointments (business_id, status);
