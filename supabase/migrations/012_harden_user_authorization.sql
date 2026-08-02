-- Migration: 012_harden_user_authorization
-- Forward-only migration to fix security gaps: privilege escalation via metadata and active state enforcement.

-- 1. Redefinir `handle_new_user` para não aceitar role e is_active dos metadados publicamente.
-- Cadastros públicos sempre recebem 'cliente' e 'is_active = true'.
-- A criação administrativa do auth (server-side) agora depende de uma atualização posterior 
-- na tabela profiles (já existente em actions.ts) para definir os cargos corretos e o status de ativação.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_name TEXT;
  v_phone TEXT;
BEGIN
  -- Definir o nome a partir de metadados ou do e-mail
  v_name := COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1));
  
  -- Definir o telefone
  v_phone := new.raw_user_meta_data->>'phone';

  -- Inserir ignorando role e is_active dos metadados para evitar escalação de privilégios.
  -- O acesso administrativo via server-side atualizará isso logo em seguida no fluxo de convite.
  INSERT INTO public.profiles (id, role, name, phone, is_active)
  VALUES (
    new.id, 
    'cliente'::public.user_role, 
    v_name, 
    v_phone, 
    TRUE
  )
  ON CONFLICT (id) DO UPDATE 
  SET 
    name = EXCLUDED.name, 
    phone = EXCLUDED.phone;
    -- Não permitimos mais a sobrescrita do role ou is_active pelo trigger no ON CONFLICT,
    -- pois isso poderia permitir que um usuário bloqueado mudasse seu status via Auth API.

  -- Se for criado pelo trigger inicial (agora sempre cliente), criar na tabela de clientes
  INSERT INTO public.customers (profile_id, company_name)
  VALUES (new.id, v_name)
  ON CONFLICT (profile_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 2. Atualizar política da tabela profiles para exigir que o usuário esteja ativo
DROP POLICY IF EXISTS "Usuário atual ou Admin pode atualizar perfil" ON public.profiles;

CREATE POLICY "Usuário atual ou Admin pode atualizar perfil" ON public.profiles
  FOR UPDATE USING (
    (id = auth.uid() AND is_active = true) OR check_is_admin()
  );


-- 3. Função auxiliar para RLS de self-service que garante que o usuário está ativo
CREATE OR REPLACE FUNCTION public.check_is_active()
RETURNS BOOLEAN SECURITY DEFINER AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND is_active = true
  );
END;
$$ LANGUAGE plpgsql;


-- 4. Atualizar os Helpers de Autorização (check_is_*) para exigir is_active = true

CREATE OR REPLACE FUNCTION public.check_is_admin()
RETURNS BOOLEAN SECURITY DEFINER AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin' AND is_active = true
  );
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.check_is_manager()
RETURNS BOOLEAN SECURITY DEFINER AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'manager' AND is_active = true
  );
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.check_is_tecnico()
RETURNS BOOLEAN SECURITY DEFINER AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND (role = 'tecnico'::public.user_role OR role = 'technician'::public.user_role) AND is_active = true
  );
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.check_is_standard_user()
RETURNS BOOLEAN SECURITY DEFINER AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'standard_user' AND is_active = true
  );
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.check_is_vendedor()
RETURNS BOOLEAN SECURITY DEFINER AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'vendedor' AND is_active = true
  );
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.check_is_soporte()
RETURNS BOOLEAN SECURITY DEFINER AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'suporte' AND is_active = true
  );
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.check_is_cliente()
RETURNS BOOLEAN SECURITY DEFINER AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'cliente' AND is_active = true
  );
END;
$$ LANGUAGE plpgsql;


-- 5. Atualizar Own-Record Clauses: Helpers que retornam IDs
-- Trazemos a proteção is_active para a base destas funções

CREATE OR REPLACE FUNCTION public.get_my_customer_id()
RETURNS UUID SECURITY DEFINER AS $$
BEGIN
  RETURN (
    SELECT c.id FROM public.customers c
    JOIN public.profiles p ON c.profile_id = p.id
    WHERE c.profile_id = auth.uid() AND p.is_active = true
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.get_my_technician_id()
RETURNS UUID SECURITY DEFINER AS $$
BEGIN
  RETURN (
    SELECT t.id FROM public.technicians t
    JOIN public.profiles p ON t.profile_id = p.id
    WHERE t.profile_id = auth.uid() AND p.is_active = true
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql;


-- 6. Atualizar Own-Record Clauses Diretas nas Tabelas
-- Tabela: customers (Modificadas nas migrações 010 e 011)
DROP POLICY IF EXISTS "Leitura de clientes por funcionarios e proprio cliente" ON public.customers;
CREATE POLICY "Leitura de clientes por funcionarios e proprio cliente" ON public.customers
  FOR SELECT USING (
    check_is_admin() OR
    check_is_manager() OR
    check_is_standard_user() OR
    check_is_vendedor() OR
    check_is_soporte() OR
    (profile_id = auth.uid() AND check_is_active()) OR
    (check_is_tecnico() AND EXISTS (
      SELECT 1 FROM public.service_orders so
      WHERE so.customer_id = customers.id
        AND so.technician_id = get_my_technician_id()
    ))
  );

DROP POLICY IF EXISTS "Atualizacao de clientes por funcionarios ou proprio cliente" ON public.customers;
CREATE POLICY "Atualizacao de clientes por funcionarios ou proprio cliente" ON public.customers
  FOR UPDATE USING (
    check_is_admin() OR 
    check_is_manager() OR 
    check_is_standard_user() OR 
    check_is_vendedor() OR 
    check_is_soporte() OR 
    (profile_id = auth.uid() AND check_is_active())
  );
