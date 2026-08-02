# Guia de Deploy Manual Supabase: User Access

Siga estas instruções estritamente executando um bloco por vez no SQL Editor do Supabase em Produção.
**NÃO EXECUTE TODOS OS BLOCOS DE UMA VEZ.**
Pare imediatamente se algum erro SQL ocorrer.
Não utilize `supabase db push`, `migration repair` ou reset de banco de dados.

---

## 1. Snapshot Inicial Read-Only

Execute para conferir o estado atual do banco (deve acusar falhas/ausências onde a nova funcionalidade entrará):

```sql
SELECT enum_range(NULL::public.user_role) AS user_roles;

SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' AND column_name IN ('role', 'is_active');
```

---

## 2. Adição de Enums (Migração 010 Parcial)

Execute este bloco para injetar os novos perfis. (Separado pois o Postgres não permite rodar DDL de alteração de ENUM na mesma transação com funções que o utilizam).

```sql
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'manager';
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'technician';
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'standard_user';
```

---

## 3. Confirmação Read-Only dos Enums

Execute para confirmar que a adição teve sucesso.

```sql
SELECT enum_range(NULL::public.user_role) AS user_roles;
```

---

## 4. Restante da Migração 010 (Gestão e RLS Base)

Copie e execute o restante do código da Migração 010. Note que omitimos os ALTER TYPE realizados anteriormente.

```sql
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
DROP POLICY IF EXISTS "Admin, vendedor e suporte podem ler clientes" ON public.customers;
DROP POLICY IF EXISTS "Admin, vendedor e suporte gerenciam clientes" ON public.customers;

CREATE POLICY "Leitura de clientes por funcionarios e proprio cliente" ON public.customers
  FOR SELECT USING (
    check_is_admin() OR 
    check_is_manager() OR 
    check_is_standard_user() OR 
    check_is_vendedor() OR 
    check_is_soporte() OR 
    profile_id = auth.uid()
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
DROP POLICY IF EXISTS "Apenas staff e técnicos podem ver técnicos" ON public.technicians;
DROP POLICY IF EXISTS "Admin e suporte gerenciam técnicos" ON public.technicians;

CREATE POLICY "Leitura de tecnicos por admin, manager e tecnico" ON public.technicians
  FOR SELECT USING (
    check_is_admin() OR 
    check_is_manager() OR 
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
DROP POLICY IF EXISTS "Staff gerencia peças" ON public.parts;

CREATE POLICY "Gerenciamento de pecas por admin e manager" ON public.parts
  FOR ALL USING (
    check_is_admin() OR 
    check_is_manager() OR 
    check_is_soporte()
  );

-- APPOINTMENTS (Agenda)
DROP POLICY IF EXISTS "Staff gerencia compromissos" ON public.appointments;
DROP POLICY IF EXISTS "Ver agenda de compromissos" ON public.appointments;

CREATE POLICY "Leitura de agenda por funcionarios e proprio tecnico" ON public.appointments
  FOR SELECT USING (
    check_is_admin() OR 
    check_is_manager() OR 
    check_is_standard_user() OR 
    check_is_soporte() OR 
    technician_id = get_my_technician_id()
  );

CREATE POLICY "Gerenciamento de agenda por admin e manager" ON public.appointments
  FOR ALL USING (
    check_is_admin() OR 
    check_is_manager() OR 
    check_is_soporte()
  );
```

---

## 5. Migração 011 (Correção de RLS baseada na 010)

```sql
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
```

---

## 6. Migração 012 (Hardening e Proteção de Ativos)

```sql
-- 1. Redefinir `handle_new_user` para não aceitar role e is_active dos metadados publicamente.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
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
```

---

## 7. Migração 013 (Finalize User Authorization)

```sql
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
```

---

## 8. Verificação Final (Read-Only)

Execute para auditar a segurança final estabelecida. Confirme que todos os valores estão corretos e que o estado obedece às premissas.

```sql
-- 1. Confirmar contagens de perfis e estado
SELECT role, is_active, COUNT(id) 
FROM public.profiles 
GROUP BY role, is_active;

-- 2. Confirmar se os helpers adotaram SECURITY DEFINER e search_path correto
SELECT 
  p.proname AS function_name, 
  p.prosecdef AS is_security_definer,
  p.proconfig AS configuration
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public' 
  AND (p.proname LIKE 'check_is_%' OR p.proname LIKE 'get_my_%' OR p.proname = 'handle_new_user');

-- 3. Listar todas as Políticas RLS
SELECT tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

---

## 9. Instruções de Verificação (Por Role)

Recomendamos utilizar perfis de teste ou simular acessos via API/portal da seguinte maneira:

- **Admin & Manager:** Devem acessar e ter permissões globais sobre os registros. Somente administradores (com is_active = true) continuam permitindo o gerenciamento em si.
- **Technician:** Só pode visualizar seus próprios registros na tabela de agendamentos e visualizar na tabela de clientes aqueles atrelados à sua OS. Não pode deletar.
- **Standard User:** Pode consultar ordens de serviço (`service_orders`), mas o acesso de leitura, alteração ou criação a informações financeiras restritas (`sales_orders`) deve falhar (remoção validada em 013).
- **Suporte & Vendedor:** Acesso focado mantido para os tickets, ordens de serviço e cotações da plataforma.
- **Cliente (Ativo):** Consegue logar no portal, ver seu perfil, criar ordens de serviço para ele mesmo e acompanhar agendamentos associados a ele.
- **Usuário Inativo (Qualquer Role):** Não consegue ler o banco de dados. Teste tentando fazer login e chamando a tabela de perfis para a qual ele teria acesso anteriormente (agora bloqueado via RLS/check_is_active e check_is_*).
