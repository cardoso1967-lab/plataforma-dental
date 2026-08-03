-- Migration: Add category to service_order_notes for permanent message history

-- Add category column with default 'geral' to preserve existing notes
ALTER TABLE service_order_notes ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'geral' NOT NULL;

-- Create an index to make filtering by category faster
CREATE INDEX IF NOT EXISTS idx_service_order_notes_category ON service_order_notes(category);

-- Update RLS policies to ensure everyone can insert and view notes with categories correctly.
-- Append-only constraints: Only SELECT and INSERT are allowed. No UPDATE or DELETE.

DROP POLICY IF EXISTS "Admins podem gerenciar todas as notas" ON service_order_notes;
DROP POLICY IF EXISTS "Admins podem inserir e ver todas as notas" ON service_order_notes;
CREATE POLICY "Admins podem inserir e ver todas as notas"
ON service_order_notes FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

CREATE POLICY "Admins podem inserir notas"
ON service_order_notes FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

DROP POLICY IF EXISTS "Técnicos podem ver e inserir notas de suas OS" ON service_order_notes;
CREATE POLICY "Técnicos podem ver notas de suas OS"
ON service_order_notes FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM service_orders
    JOIN technicians ON service_orders.technician_id = technicians.id
    WHERE service_orders.id = service_order_notes.service_order_id
    AND technicians.profile_id = auth.uid()
  )
);

CREATE POLICY "Técnicos podem inserir notas em suas OS"
ON service_order_notes FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM service_orders
    JOIN technicians ON service_orders.technician_id = technicians.id
    WHERE service_orders.id = service_order_notes.service_order_id
    AND technicians.profile_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Clientes podem ver notas públicas de suas OS" ON service_order_notes;
CREATE POLICY "Clientes podem ver notas públicas de suas OS"
ON service_order_notes FOR SELECT
USING (
  is_internal = false AND 
  EXISTS (
    SELECT 1 FROM service_orders
    JOIN customers ON service_orders.customer_id = customers.id
    WHERE service_orders.id = service_order_notes.service_order_id
    AND customers.profile_id = auth.uid()
  )
);
