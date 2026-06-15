-- 006_allow_technicians_read_assigned_customers.sql
-- Permite que os técnicos visualizem os dados dos clientes cujas ordens de serviço estão sob sua responsabilidade.

CREATE POLICY "Tecnicos podem ver clientes das OS atribuídas"
ON public.customers
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    from public.service_orders so
    join public.technicians t on t.id = so.technician_id
    where so.customer_id = customers.id
      and t.profile_id = auth.uid()
  )
);
