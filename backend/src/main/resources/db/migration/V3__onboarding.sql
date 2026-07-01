ALTER TABLE businesses
    ADD COLUMN category            VARCHAR(32),
    ADD COLUMN whatsapp            VARCHAR(32),
    ADD COLUMN instagram           VARCHAR(80),
    ADD COLUMN brand_color         VARCHAR(32),
    ADD COLUMN onboarding_step     INTEGER     NOT NULL DEFAULT 1,
    ADD COLUMN onboarding_completed BOOLEAN    NOT NULL DEFAULT FALSE;

CREATE TABLE branches (
    id          BIGSERIAL PRIMARY KEY,
    business_id BIGINT       NOT NULL REFERENCES businesses (id) ON DELETE CASCADE,
    name        VARCHAR(120) NOT NULL,
    address     VARCHAR(255) NOT NULL,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE professionals (
    id          BIGSERIAL PRIMARY KEY,
    business_id BIGINT       NOT NULL REFERENCES businesses (id) ON DELETE CASCADE,
    first_name  VARCHAR(80)  NOT NULL,
    last_name   VARCHAR(80)  NOT NULL,
    email       VARCHAR(255),
    role_label  VARCHAR(80),
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE services (
    id               BIGSERIAL PRIMARY KEY,
    business_id      BIGINT        NOT NULL REFERENCES businesses (id) ON DELETE CASCADE,
    name             VARCHAR(120)  NOT NULL,
    duration_minutes INTEGER       NOT NULL DEFAULT 60,
    price            NUMERIC(12, 2),
    deposit_amount   NUMERIC(12, 2),
    created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE TABLE payment_methods (
    id          BIGSERIAL PRIMARY KEY,
    business_id BIGINT      NOT NULL REFERENCES businesses (id) ON DELETE CASCADE,
    type        VARCHAR(32) NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_branches_business_id ON branches (business_id);
CREATE INDEX idx_professionals_business_id ON professionals (business_id);
CREATE INDEX idx_services_business_id ON services (business_id);
CREATE INDEX idx_payment_methods_business_id ON payment_methods (business_id);
