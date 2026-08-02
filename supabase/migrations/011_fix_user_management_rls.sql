-- Migration: 011_fix_user_management_rls
-- Forward-only migration to fix RLS regressions introduced in migration 010.

-- 1. CUSTOMERS: Allow technicians to read only clients assigned to their linked technician.
DROP POLICY IF EXISTS "Leitura de clientes por funcionarios e proprio cliente" ON public.customers;

CREATE POLICY "Leitura de clientes por funcionarios e proprio cliente" ON public.customers
  FOR SELECT USING (
    check_is_admin() OR
    check_is_manager() OR
    check_is_standard_user() OR
    check_is_vendedor() OR
    check_is_soporte() OR
    profile_id = auth.uid() OR
    -- Técnico lê apenas clientes cujas OS estão atribuídas ao seu registro de técnico
    (check_is_tecnico() AND EXISTS (
      SELECT 1 FROM public.service_orders so
      WHERE so.customer_id = customers.id
        AND so.technician_id = get_my_technician_id()
    ))
  );

-- 2. TECHNICIANS: Restore access for 'suporte' to read technicians.
DROP POLICY IF EXISTS "Leitura de tecnicos por admin, manager e tecnico" ON public.technicians;
DROP POLICY IF EXISTS "Leitura de tecnicos por admin, manager, suporte e tecnico" ON public.technicians;

CREATE POLICY "Leitura de tecnicos por admin, manager, suporte e tecnico" ON public.technicians
  FOR SELECT USING (
    check_is_admin() OR
    check_is_manager() OR
    check_is_soporte() OR
    check_is_tecnico()
  );

-- 3. PARTS: Preserve the required replacement-part access for technicians and staff.
DROP POLICY IF EXISTS "Leitura de pecas por tecnico e staff" ON public.parts;

CREATE POLICY "Leitura de pecas por tecnico e staff" ON public.parts
  FOR SELECT USING (
    check_is_admin() OR
    check_is_manager() OR
    check_is_soporte() OR
    check_is_tecnico() OR
    check_is_vendedor()
  );

-- 4. APPOINTMENTS: Fix policy name to reflect that suporte also has management access (restored access).
DROP POLICY IF EXISTS "Gerenciamento de agenda por admin e manager" ON public.appointments;
DROP POLICY IF EXISTS "Gerenciamento de agenda por admin, manager e suporte" ON public.appointments;

CREATE POLICY "Gerenciamento de agenda por admin, manager e suporte" ON public.appointments
  FOR ALL USING (
    check_is_admin() OR
    check_is_manager() OR
    check_is_soporte()
  );
