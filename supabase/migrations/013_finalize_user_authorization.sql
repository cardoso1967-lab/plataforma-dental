-- Migration: 013_finalize_user_authorization
-- Finalize authorization rules: enforce search_path on security definers and remove financial access from standard_user.

-- 1. Redefinir `handle_new_user` com search_path seguro
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SET search_path = public
AS $$
DECLARE
  v_name TEXT;
  v_phone TEXT;
BEGIN
  v_name := COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1));
  v_phone := new.raw_user_meta_data->>'phone';

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

  INSERT INTO public.customers (profile_id, company_name)
  VALUES (new.id, v_name)
  ON CONFLICT (profile_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 2. Redefinir funções de autorização (check_is_*) com search_path seguro
CREATE OR REPLACE FUNCTION public.check_is_admin()
RETURNS BOOLEAN
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin' AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.check_is_manager()
RETURNS BOOLEAN
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'manager' AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.check_is_tecnico()
RETURNS BOOLEAN
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND (role = 'tecnico'::public.user_role OR role = 'technician'::public.user_role) AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.check_is_standard_user()
RETURNS BOOLEAN
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'standard_user' AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.check_is_vendedor()
RETURNS BOOLEAN
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'vendedor' AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.check_is_soporte()
RETURNS BOOLEAN
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'suporte' AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.check_is_cliente()
RETURNS BOOLEAN
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'cliente' AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.check_is_active()
RETURNS BOOLEAN
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 3. Redefinir helpers de identificação com search_path seguro
CREATE OR REPLACE FUNCTION public.get_my_customer_id()
RETURNS UUID
SET search_path = public
AS $$
BEGIN
  RETURN (
    SELECT c.id FROM public.customers c
    JOIN public.profiles p ON c.profile_id = p.id
    WHERE c.profile_id = auth.uid() AND p.is_active = true
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_my_technician_id()
RETURNS UUID
SET search_path = public
AS $$
BEGIN
  RETURN (
    SELECT t.id FROM public.technicians t
    JOIN public.profiles p ON t.profile_id = p.id
    WHERE t.profile_id = auth.uid() AND p.is_active = true
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 4. Remover acesso de 'standard_user' aos pedidos de venda (dados financeiros)
DROP POLICY IF EXISTS "Leitura de pedidos de venda por funcionarios e proprio cliente" ON public.sales_orders;
DROP POLICY IF EXISTS "Insercao de pedidos de venda por funcionarios e proprio cliente" ON public.sales_orders;
DROP POLICY IF EXISTS "Atualizacao de pedidos de venda por funcionarios e proprio cliente" ON public.sales_orders;

CREATE POLICY "Leitura de pedidos de venda por funcionarios e proprio cliente" ON public.sales_orders
  FOR SELECT USING (
    check_is_admin() OR 
    check_is_manager() OR 
    check_is_vendedor() OR 
    customer_id = get_my_customer_id()
  );

CREATE POLICY "Insercao de pedidos de venda por funcionarios e proprio cliente" ON public.sales_orders
  FOR INSERT WITH CHECK (
    check_is_admin() OR 
    check_is_manager() OR 
    check_is_vendedor() OR 
    (customer_id = get_my_customer_id() AND check_is_cliente())
  );

CREATE POLICY "Atualizacao de pedidos de venda por funcionarios e proprio cliente" ON public.sales_orders
  FOR UPDATE USING (
    check_is_admin() OR 
    check_is_manager() OR 
    check_is_vendedor() OR 
    customer_id = get_my_customer_id()
  );
