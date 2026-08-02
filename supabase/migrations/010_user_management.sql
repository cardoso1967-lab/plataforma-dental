-- Migration: 010_user_management
-- Adicionar novas roles de acesso e coluna de status à tabela profiles, atualizando RLS e triggers.

-- 1. Estender o ENUM user_role com suporte a novos perfis
-- No PostgreSQL, adicionamos valores novos a enums utilizando ALTER TYPE ... ADD VALUE.
-- Usamos IF NOT EXISTS para tornar a migração idempotente.
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'manager';
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'technician';
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'standard_user';

-- 2. Adicionar coluna is_active na tabela profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE NOT NULL;

-- 3. Atualizar/criar funções auxiliares para verificação de RLS
CREATE OR REPLACE FUNCTION public.check_is_manager()
RETURNS BOOLEAN SECURITY DEFINER AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'manager'::public.user_role
  );
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.check_is_standard_user()
RETURNS BOOLEAN SECURITY DEFINER AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'standard_user'::public.user_role
  );
END;
$$ LANGUAGE plpgsql;

-- Atualizar check_is_tecnico para suportar tanto 'tecnico' quanto 'technician'
CREATE OR REPLACE FUNCTION public.check_is_tecnico()
RETURNS BOOLEAN SECURITY DEFINER AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND (role = 'tecnico'::public.user_role OR role = 'technician'::public.user_role)
  );
END;
$$ LANGUAGE plpgsql;

-- 4. Atualizar o gatilho handle_new_user() na criação de usuários no auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_role public.user_role;
  v_name TEXT;
  v_phone TEXT;
BEGIN
  -- Definir papel com fallback para 'cliente'
  v_role := COALESCE((new.raw_user_meta_data->>'role')::public.user_role, 'cliente'::public.user_role);

  -- Definir o nome a partir de metadados ou do e-mail
  v_name := COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1));

  -- Definir o telefone
  v_phone := new.raw_user_meta_data->>'phone';

  -- Inserir ou atualizar na tabela de perfis
  INSERT INTO public.profiles (id, role, name, phone, is_active)
  VALUES (
    new.id,
    v_role,
    v_name,
    v_phone,
    COALESCE((new.raw_user_meta_data->>'is_active')::BOOLEAN, TRUE)
  )
  ON CONFLICT (id) DO UPDATE
  SET
    role = EXCLUDED.role,
    name = EXCLUDED.name,
    phone = EXCLUDED.phone,
    is_active = COALESCE(EXCLUDED.is_active, public.profiles.is_active);

  -- Se for cliente, criar automaticamente na tabela de clientes
  IF v_role = 'cliente'::public.user_role THEN
    INSERT INTO public.customers (profile_id, company_name)
    VALUES (new.id, v_name)
    ON CONFLICT (profile_id) DO NOTHING;
  -- Se for técnico/technician, criar automaticamente na tabela de técnicos
  ELSIF v_role = 'tecnico'::public.user_role OR v_role = 'technician'::public.user_role THEN
    IF NOT EXISTS (SELECT 1 FROM public.technicians WHERE profile_id = new.id) THEN
      INSERT INTO public.technicians (profile_id)
      VALUES (new.id);
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Atualizar políticas RLS das Tabelas para Suportar Novos Perfis

-- CUSTOMERS (Clientes)
-- Preservar acesso do portal de cliente (profile_id = auth.uid()) e acesso de staff.
-- Técnicos podem ler apenas clientes vinculados às OS atribuídas ao seu registro de técnico.
DROP POLICY IF EXISTS "Admin, vendedor e suporte podem ler clientes" ON public.customers;
DROP POLICY IF EXISTS "Admin, vendedor e suporte gerenciam clientes" ON public.customers;
DROP POLICY IF EXISTS "Leitura de clientes por funcionarios e proprio cliente" ON public.customers;
DROP POLICY IF EXISTS "Escrita de clientes por funcionarios" ON public.customers;
DROP POLICY IF EXISTS "Atualizacao de clientes por funcionarios ou proprio cliente" ON public.customers;
DROP POLICY IF EXISTS "Exclusao de clientes apenas por admin e manager" ON public.customers;

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

CREATE POLICY "Escrita de clientes por funcionarios" ON public.customers
  FOR INSERT WITH CHECK (
    check_is_admin() OR
    check_is_manager() OR
    check_is_standard_user() OR
    check_is_vendedor() OR
    check_is_soporte()
  );

CREATE POLICY "Atualizacao de clientes por funcionarios ou proprio cliente" ON public.customers
  FOR UPDATE USING (
    check_is_admin() OR
    check_is_manager() OR
    check_is_standard_user() OR
    check_is_vendedor() OR
    check_is_soporte() OR
    profile_id = auth.uid()
  );

CREATE POLICY "Exclusao de clientes apenas por admin e manager" ON public.customers
  FOR DELETE USING (
    check_is_admin() OR
    check_is_manager()
  );

-- TECHNICIANS (Técnicos)
-- Restaurar acesso de leitura para suporte (existia em 001) e manter acesso de técnicos ao próprio registro.
DROP POLICY IF EXISTS "Apenas staff e técnicos podem ver técnicos" ON public.technicians;
DROP POLICY IF EXISTS "Admin e suporte gerenciam técnicos" ON public.technicians;
DROP POLICY IF EXISTS "Leitura de tecnicos por admin, manager e tecnico" ON public.technicians;
DROP POLICY IF EXISTS "Gerenciamento de tecnicos por admin e manager" ON public.technicians;

CREATE POLICY "Leitura de tecnicos por admin, manager, suporte e tecnico" ON public.technicians
  FOR SELECT USING (
    check_is_admin() OR
    check_is_manager() OR
    check_is_soporte() OR
    check_is_tecnico()
  );

CREATE POLICY "Gerenciamento de tecnicos por admin e manager" ON public.technicians
  FOR ALL USING (
    check_is_admin() OR
    check_is_manager()
  );

-- PRODUCTS (Produtos)
DROP POLICY IF EXISTS "Vendas gerencia produtos" ON public.products;
DROP POLICY IF EXISTS "Público pode ler produtos" ON public.products;
DROP POLICY IF EXISTS "Leitura de produtos para todos usuarios ativos" ON public.products;
DROP POLICY IF EXISTS "Gerenciamento de produtos por admin e manager" ON public.products;

CREATE POLICY "Leitura de produtos para todos usuarios ativos" ON public.products
  FOR SELECT USING (
    is_active = true OR
    check_is_admin() OR
    check_is_manager() OR
    check_is_standard_user() OR
    check_is_vendedor()
  );

CREATE POLICY "Gerenciamento de produtos por admin e manager" ON public.products
  FOR ALL USING (
    check_is_admin() OR
    check_is_manager() OR
    check_is_vendedor()
  );

-- PRODUCT CATEGORIES & IMAGES
DROP POLICY IF EXISTS "Vendas gerencia categorias" ON public.product_categories;
DROP POLICY IF EXISTS "Vendas gerencia imagens" ON public.product_images;
DROP POLICY IF EXISTS "Gerenciamento de categorias por admin e manager" ON public.product_categories;
DROP POLICY IF EXISTS "Gerenciamento de imagens por admin e manager" ON public.product_images;

CREATE POLICY "Gerenciamento de categorias por admin e manager" ON public.product_categories
  FOR ALL USING (
    check_is_admin() OR
    check_is_manager() OR
    check_is_vendedor()
  );

CREATE POLICY "Gerenciamento de imagens por admin e manager" ON public.product_images
  FOR ALL USING (
    check_is_admin() OR
    check_is_manager() OR
    check_is_vendedor()
  );

-- SALES ORDERS (Pedidos de Venda)
DROP POLICY IF EXISTS "Vendas acessam pedidos" ON public.sales_orders;
DROP POLICY IF EXISTS "Vendas gerenciam pedidos" ON public.sales_orders;
DROP POLICY IF EXISTS "Leitura de pedidos de venda por funcionarios e proprio cliente" ON public.sales_orders;
DROP POLICY IF EXISTS "Insercao de pedidos de venda por funcionarios e proprio cliente" ON public.sales_orders;
DROP POLICY IF EXISTS "Atualizacao de pedidos de venda por funcionarios e proprio cliente" ON public.sales_orders;
DROP POLICY IF EXISTS "Exclusao de pedidos de venda apenas por admin e manager" ON public.sales_orders;

CREATE POLICY "Leitura de pedidos de venda por funcionarios e proprio cliente" ON public.sales_orders
  FOR SELECT USING (
    check_is_admin() OR
    check_is_manager() OR
    check_is_standard_user() OR
    check_is_vendedor() OR
    customer_id = get_my_customer_id()
  );

CREATE POLICY "Insercao de pedidos de venda por funcionarios e proprio cliente" ON public.sales_orders
  FOR INSERT WITH CHECK (
    check_is_admin() OR
    check_is_manager() OR
    check_is_standard_user() OR
    check_is_vendedor() OR
    (customer_id = get_my_customer_id() AND check_is_cliente())
  );

CREATE POLICY "Atualizacao de pedidos de venda por funcionarios e proprio cliente" ON public.sales_orders
  FOR UPDATE USING (
    check_is_admin() OR
    check_is_manager() OR
    check_is_standard_user() OR
    check_is_vendedor() OR
    customer_id = get_my_customer_id()
  );

CREATE POLICY "Exclusao de pedidos de venda apenas por admin e manager" ON public.sales_orders
  FOR DELETE USING (
    check_is_admin() OR
    check_is_manager()
  );

-- SERVICE ORDERS (Ordens de Serviço)
DROP POLICY IF EXISTS "Visualização de ordens de serviço" ON public.service_orders;
DROP POLICY IF EXISTS "Staff gerencia ordens de serviço" ON public.service_orders;
DROP POLICY IF EXISTS "Técnico atualiza ordens atribuídas" ON public.service_orders;
DROP POLICY IF EXISTS "Leitura de OS por funcionarios, proprio tecnico e cliente" ON public.service_orders;
DROP POLICY IF EXISTS "Gerenciamento completo de OS por admin e manager" ON public.service_orders;
DROP POLICY IF EXISTS "Insercao de OS por standard_user e cliente" ON public.service_orders;
DROP POLICY IF EXISTS "Atualizacao de OS por funcionarios, tecnico atribuido ou cliente" ON public.service_orders;

CREATE POLICY "Leitura de OS por funcionarios, proprio tecnico e cliente" ON public.service_orders
  FOR SELECT USING (
    check_is_admin() OR
    check_is_manager() OR
    check_is_standard_user() OR
    check_is_soporte() OR
    technician_id = get_my_technician_id() OR
    customer_id = get_my_customer_id()
  );

CREATE POLICY "Gerenciamento completo de OS por admin e manager" ON public.service_orders
  FOR ALL USING (
    check_is_admin() OR
    check_is_manager() OR
    check_is_soporte()
  );

CREATE POLICY "Insercao de OS por standard_user e cliente" ON public.service_orders
  FOR INSERT WITH CHECK (
    check_is_admin() OR
    check_is_manager() OR
    check_is_standard_user() OR
    check_is_soporte() OR
    (customer_id = get_my_customer_id() AND check_is_cliente())
  );

CREATE POLICY "Atualizacao de OS por funcionarios, tecnico atribuido ou cliente" ON public.service_orders
  FOR UPDATE USING (
    check_is_admin() OR
    check_is_manager() OR
    check_is_standard_user() OR
    check_is_soporte() OR
    (technician_id = get_my_technician_id() AND check_is_tecnico()) OR
    (customer_id = get_my_customer_id() AND check_is_cliente())
  );

-- PARTS (Peças)
-- Restaurar acesso de leitura de técnicos a peças (existia em 001 como "Acesso de leitura das peças").
DROP POLICY IF EXISTS "Staff gerencia peças" ON public.parts;
DROP POLICY IF EXISTS "Gerenciamento de pecas por admin e manager" ON public.parts;
DROP POLICY IF EXISTS "Leitura de pecas por tecnico" ON public.parts;

CREATE POLICY "Leitura de pecas por tecnico e staff" ON public.parts
  FOR SELECT USING (
    check_is_admin() OR
    check_is_manager() OR
    check_is_soporte() OR
    check_is_tecnico() OR
    check_is_vendedor()
  );

CREATE POLICY "Gerenciamento de pecas por admin e manager" ON public.parts
  FOR ALL USING (
    check_is_admin() OR
    check_is_manager() OR
    check_is_soporte()
  );

-- APPOINTMENTS (Agenda)
-- Restaurar acesso de gerenciamento para suporte (existia em 001).
DROP POLICY IF EXISTS "Staff gerencia compromissos" ON public.appointments;
DROP POLICY IF EXISTS "Ver agenda de compromissos" ON public.appointments;
DROP POLICY IF EXISTS "Leitura de agenda por funcionarios e proprio tecnico" ON public.appointments;
DROP POLICY IF EXISTS "Gerenciamento de agenda por admin e manager" ON public.appointments;

CREATE POLICY "Leitura de agenda por funcionarios e proprio tecnico" ON public.appointments
  FOR SELECT USING (
    check_is_admin() OR
    check_is_manager() OR
    check_is_standard_user() OR
    check_is_soporte() OR
    technician_id = get_my_technician_id()
  );

CREATE POLICY "Gerenciamento de agenda por admin, manager e suporte" ON public.appointments
  FOR ALL USING (
    check_is_admin() OR
    check_is_manager() OR
    check_is_soporte()
  );
