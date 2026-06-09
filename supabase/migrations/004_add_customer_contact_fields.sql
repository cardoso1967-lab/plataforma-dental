-- Migration: 004_add_customer_contact_fields
-- Add contact fields to customers table if they do not exist

ALTER TABLE IF EXISTS public.customers
  ADD COLUMN IF NOT EXISTS contact_name text,
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS whatsapp text,
  ADD COLUMN IF NOT EXISTS notes text;
