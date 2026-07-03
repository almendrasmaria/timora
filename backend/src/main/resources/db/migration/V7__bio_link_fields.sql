ALTER TABLE businesses
ADD COLUMN bio_link_text VARCHAR(280),
ADD COLUMN bio_show_booking BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN bio_show_location BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN bio_show_whatsapp BOOLEAN NOT NULL DEFAULT true;
