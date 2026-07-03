ALTER TABLE businesses
ADD COLUMN logo_url VARCHAR(255),
ADD COLUMN show_whatsapp_to_clients BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN reminder_template VARCHAR(500);
