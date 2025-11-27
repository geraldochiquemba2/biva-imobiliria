-- Add price_per_hour column to properties table for Coworking pricing
ALTER TABLE properties ADD COLUMN IF NOT EXISTS price_per_hour DECIMAL(15, 2);
