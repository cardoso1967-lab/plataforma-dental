-- 001_initial_schema.sql
-- Migração inicial para a Plataforma Dental

-- 1. Habilitar extensões úteis (como uuid-ossp se não estiver habilitada)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Criar Enums
CREATE TYPE user_role AS ENUM ('admin', 'vendedor', 'suporte', 'tecnico', 'cliente');
CREATE TYPE product_type AS ENUM ('equipamento', 'peca', 'insumo', 'outro');
CREATE TYPE sales_order_status AS ENUM ('pendente', 'aprovado', 'faturado', 'cancelado');
CREATE TYPE service_order_status AS ENUM ('aberta', 'em_analise', 'orcamento_pendente', 'orcamento_aprovado', 'em_atendimento', 'concluida', 'cancelada');
CREATE TYPE quote_status AS ENUM ('rascunho', 'enviado', 'aprovado', 'rejeitado', 'expirado');
CREATE TYPE appointment_status AS ENUM ('agendado', 'confirmado', 'em_andamento', 'concluido', 'cancelado');
CREATE TYPE whatsapp_provider AS ENUM ('zapi', 'edfashion');
CREATE TYPE whatsapp_message_status AS ENUM ('fila', 'enviado', 'entregue', 'lido', 'falha');

-- 3. Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Criar Tabelas

-- profiles: Dados de usuário vinculados ao Supabase Auth
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'cliente',
  name TEXT NOT NULL,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- customers: Clientes (clínicas/dentistas)
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID UNIQUE REFERENCES profiles(id) ON DELETE SET NULL,
  company_name TEXT NOT NULL,
  trade_name TEXT,
  cnpj TEXT,
  cpf TEXT,
  address_street TEXT,
  address_number TEXT,
  address_complement TEXT,
  address_neighborhood TEXT,
  address_city TEXT,
  address_state TEXT,
  address_zip TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- technicians: Técnicos de assistência técnica
CREATE TABLE technicians (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID UNIQUE REFERENCES profiles(id) ON DELETE SET NULL,
  specialties TEXT[] DEFAULT '{}'::TEXT[] NOT NULL,
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- product_categories: Categorias de produtos
CREATE TABLE product_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- products: Produtos para venda
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID REFERENCES product_categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  sku TEXT UNIQUE,
  product_type product_type NOT NULL DEFAULT 'equipamento',
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- product_images: Imagens dos produtos
CREATE TABLE product_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT FALSE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- sales_orders: Pedidos de venda
CREATE TABLE sales_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  seller_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  status sales_order_status NOT NULL DEFAULT 'pendente',
  total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- sales_order_items: Itens do pedido de venda
CREATE TABLE sales_order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sales_order_id UUID NOT NULL REFERENCES sales_orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- client_equipment: Equipamentos dos clientes registrados para suporte
CREATE TABLE client_equipment (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  brand TEXT,
  model TEXT,
  serial_number TEXT,
  installation_date DATE,
  last_maintenance_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- service_orders: Ordens de Serviço (OS)
CREATE TABLE service_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  equipment_id UUID REFERENCES client_equipment(id) ON DELETE SET NULL,
  technician_id UUID REFERENCES technicians(id) ON DELETE SET NULL,
  status service_order_status NOT NULL DEFAULT 'aberta',
  priority TEXT NOT NULL DEFAULT 'media', -- 'baixa', 'media', 'alta', 'urgente'
  description TEXT NOT NULL,
  reported_issues TEXT,
  scheduled_date TIMESTAMP WITH TIME ZONE,
  completion_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- service_order_status_history: Histórico de alteração de status da OS
CREATE TABLE service_order_status_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  service_order_id UUID NOT NULL REFERENCES service_orders(id) ON DELETE CASCADE,
  status service_order_status NOT NULL,
  changed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- service_order_notes: Notas internas ou públicas na OS
CREATE TABLE service_order_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  service_order_id UUID NOT NULL REFERENCES service_orders(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  note TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT TRUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- service_order_photos: Fotos enviadas durante o serviço
CREATE TABLE service_order_photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  service_order_id UUID NOT NULL REFERENCES service_orders(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  description TEXT,
  uploaded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- parts: Peças de reposição em estoque
CREATE TABLE parts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  code TEXT UNIQUE,
  price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- service_order_parts: Peças utilizadas em uma OS
CREATE TABLE service_order_parts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  service_order_id UUID NOT NULL REFERENCES service_orders(id) ON DELETE CASCADE,
  part_id UUID NOT NULL REFERENCES parts(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- service_quotes: Orçamentos vinculados a uma OS
CREATE TABLE service_quotes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  service_order_id UUID NOT NULL REFERENCES service_orders(id) ON DELETE CASCADE,
  status quote_status NOT NULL DEFAULT 'rascunho',
  total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  valid_until TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- service_quote_items: Itens do orçamento da OS
CREATE TABLE service_quote_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  service_quote_id UUID NOT NULL REFERENCES service_quotes(id) ON DELETE CASCADE,
  part_id UUID REFERENCES parts(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- appointments: Agenda de visitas técnicas
CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  technician_id UUID NOT NULL REFERENCES technicians(id) ON DELETE CASCADE,
  service_order_id UUID REFERENCES service_orders(id) ON DELETE CASCADE,
  status appointment_status NOT NULL DEFAULT 'agendado',
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- whatsapp_templates: Modelos de mensagens prontas para WhatsApp
CREATE TABLE whatsapp_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  content TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'pt-BR',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- whatsapp_messages: Histórico e fila de envio do WhatsApp
CREATE TABLE whatsapp_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider whatsapp_provider NOT NULL DEFAULT 'zapi',
  recipient_phone TEXT NOT NULL,
  message_text TEXT NOT NULL,
  status whatsapp_message_status NOT NULL DEFAULT 'fila',
  external_id TEXT,
  sent_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- automation_logs: Logs de automações (ex: disparos de alertas)
CREATE TABLE automation_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type TEXT NOT NULL,
  status TEXT NOT NULL,
  message TEXT,
  payload JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- audit_logs: Trilha de auditoria do sistema
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID,
  profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  changes JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 5. Vincular Triggers de updated_at para todas as tabelas aplicáveis
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER update_technicians_updated_at BEFORE UPDATE ON technicians FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER update_product_categories_updated_at BEFORE UPDATE ON product_categories FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER update_sales_orders_updated_at BEFORE UPDATE ON sales_orders FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER update_client_equipment_updated_at BEFORE UPDATE ON client_equipment FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER update_service_orders_updated_at BEFORE UPDATE ON service_orders FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER update_parts_updated_at BEFORE UPDATE ON parts FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER update_service_quotes_updated_at BEFORE UPDATE ON service_quotes FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER update_whatsapp_templates_updated_at BEFORE UPDATE ON whatsapp_templates FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER update_whatsapp_messages_updated_at BEFORE UPDATE ON whatsapp_messages FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 6. Criar Índices Principais para Melhoria de Performance
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_customers_profile_id ON customers(profile_id);
CREATE INDEX idx_technicians_profile_id ON technicians(profile_id);
CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_sales_orders_customer_id ON sales_orders(customer_id);
CREATE INDEX idx_sales_orders_status ON sales_orders(status);
CREATE INDEX idx_client_equipment_customer_id ON client_equipment(customer_id);
CREATE INDEX idx_service_orders_customer_id ON service_orders(customer_id);
CREATE INDEX idx_service_orders_technician_id ON service_orders(technician_id);
CREATE INDEX idx_service_orders_status ON service_orders(status);
CREATE INDEX idx_appointments_technician_id ON appointments(technician_id);
CREATE INDEX idx_appointments_start_time ON appointments(start_time);
CREATE INDEX idx_whatsapp_messages_status ON whatsapp_messages(status);

-- 7. Funções de Auxílio para Políticas RLS (SECURITY DEFINER)
-- Essas funções rodam com permissões do criador (ignoram RLS para evitar recursão infinita na tabela profiles)

CREATE OR REPLACE FUNCTION check_is_admin()
RETURNS BOOLEAN SECURITY DEFINER AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION check_is_vendedor()
RETURNS BOOLEAN SECURITY DEFINER AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'vendedor'
  );
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION check_is_soporte()
RETURNS BOOLEAN SECURITY DEFINER AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'suporte'
  );
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION check_is_tecnico()
RETURNS BOOLEAN SECURITY DEFINER AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'tecnico'
  );
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION check_is_cliente()
RETURNS BOOLEAN SECURITY DEFINER AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'cliente'
  );
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_my_customer_id()
RETURNS UUID SECURITY DEFINER AS $$
BEGIN
  RETURN (
    SELECT id FROM customers 
    WHERE profile_id = auth.uid() 
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_my_technician_id()
RETURNS UUID SECURITY DEFINER AS $$
BEGIN
  RETURN (
    SELECT id FROM technicians 
    WHERE profile_id = auth.uid() 
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql;

-- 8. Ativar RLS em Todas as Tabelas
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE technicians ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_order_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_order_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_order_parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_quote_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- 9. Definir Políticas de Acesso RLS

-- PROFILES
CREATE POLICY "Qualquer um pode ler perfis para associação" ON profiles
  FOR SELECT USING (true);
CREATE POLICY "Usuário atual ou Admin pode atualizar perfil" ON profiles
  FOR UPDATE USING (id = auth.uid() OR check_is_admin());
CREATE POLICY "Admin pode gerenciar perfis" ON profiles
  FOR ALL USING (check_is_admin());

-- CUSTOMERS
CREATE POLICY "Admin, vendedor e suporte podem ler clientes" ON customers
  FOR SELECT USING (check_is_admin() OR check_is_vendedor() OR check_is_soporte());
CREATE POLICY "Cliente lê seu próprio registro" ON customers
  FOR SELECT USING (profile_id = auth.uid());
CREATE POLICY "Admin, vendedor e suporte gerenciam clientes" ON customers
  FOR ALL USING (check_is_admin() OR check_is_vendedor() OR check_is_soporte());
CREATE POLICY "Cliente atualiza seus próprios dados" ON customers
  FOR UPDATE USING (profile_id = auth.uid());

-- TECHNICIANS
CREATE POLICY "Apenas staff e técnicos podem ver técnicos" ON technicians
  FOR SELECT USING (check_is_admin() OR check_is_soporte() OR check_is_tecnico());
CREATE POLICY "Admin e suporte gerenciam técnicos" ON technicians
  FOR ALL USING (check_is_admin() OR check_is_soporte());

-- PRODUCT CATEGORIES & PRODUCTS & IMAGES
CREATE POLICY "Público pode ler categorias" ON product_categories FOR SELECT USING (true);
CREATE POLICY "Vendas gerencia categorias" ON product_categories FOR ALL USING (check_is_admin() OR check_is_vendedor());

CREATE POLICY "Público pode ler produtos" ON products FOR SELECT USING (is_active = true OR check_is_admin() OR check_is_vendedor());
CREATE POLICY "Vendas gerencia produtos" ON products FOR ALL USING (check_is_admin() OR check_is_vendedor());

CREATE POLICY "Público pode ler imagens" ON product_images FOR SELECT USING (true);
CREATE POLICY "Vendas gerencia imagens" ON product_images FOR ALL USING (check_is_admin() OR check_is_vendedor());

-- SALES ORDERS
CREATE POLICY "Vendas acessam pedidos" ON sales_orders
  FOR SELECT USING (check_is_admin() OR check_is_vendedor());
CREATE POLICY "Cliente vê seus próprios pedidos" ON sales_orders
  FOR SELECT USING (customer_id = get_my_customer_id());
CREATE POLICY "Cliente cria seus próprios pedidos" ON sales_orders
  FOR INSERT WITH CHECK (customer_id = get_my_customer_id() AND check_is_cliente());
CREATE POLICY "Vendas gerenciam pedidos" ON sales_orders
  FOR ALL USING (check_is_admin() OR check_is_vendedor());

-- SALES ORDER ITEMS
CREATE POLICY "Acesso aos itens conforme pedido" ON sales_order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM sales_orders 
      WHERE sales_orders.id = sales_order_items.sales_order_id 
      AND (check_is_admin() OR check_is_vendedor() OR sales_orders.customer_id = get_my_customer_id())
    )
  );
CREATE POLICY "Inserção pelo cliente ou vendas" ON sales_order_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM sales_orders 
      WHERE sales_orders.id = sales_order_items.sales_order_id 
      AND (check_is_admin() OR check_is_vendedor() OR sales_orders.customer_id = get_my_customer_id())
    )
  );
CREATE POLICY "Vendas gerenciam itens" ON sales_order_items
  FOR ALL USING (check_is_admin() OR check_is_vendedor());

-- CLIENT EQUIPMENT
CREATE POLICY "Staff e cliente vêem equipamentos" ON client_equipment
  FOR SELECT USING (check_is_admin() OR check_is_soporte() OR check_is_tecnico() OR customer_id = get_my_customer_id());
CREATE POLICY "Staff gerencia equipamentos" ON client_equipment
  FOR ALL USING (check_is_admin() OR check_is_soporte());
CREATE POLICY "Cliente adiciona seu próprio equipamento" ON client_equipment
  FOR INSERT WITH CHECK (customer_id = get_my_customer_id() AND check_is_cliente());

-- SERVICE ORDERS
CREATE POLICY "Visualização de ordens de serviço" ON service_orders
  FOR SELECT USING (
    check_is_admin() OR 
    check_is_soporte() OR 
    technician_id = get_my_technician_id() OR 
    customer_id = get_my_customer_id()
  );
CREATE POLICY "Staff gerencia ordens de serviço" ON service_orders
  FOR ALL USING (check_is_admin() OR check_is_soporte());
CREATE POLICY "Técnico atualiza ordens atribuídas" ON service_orders
  FOR UPDATE USING (technician_id = get_my_technician_id() AND check_is_tecnico());
CREATE POLICY "Cliente cria solicitação de serviço" ON service_orders
  FOR INSERT WITH CHECK (customer_id = get_my_customer_id() AND check_is_cliente());

-- SERVICE ORDER STATUS HISTORY
CREATE POLICY "Ver histórico da OS" ON service_order_status_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM service_orders 
      WHERE service_orders.id = service_order_status_history.service_order_id 
      AND (check_is_admin() OR check_is_soporte() OR service_orders.technician_id = get_my_technician_id() OR service_orders.customer_id = get_my_customer_id())
    )
  );
CREATE POLICY "Gravar no histórico" ON service_order_status_history
  FOR INSERT WITH CHECK (
    check_is_admin() OR check_is_soporte() OR 
    EXISTS (
      SELECT 1 FROM service_orders 
      WHERE service_orders.id = service_order_status_history.service_order_id 
      AND service_orders.technician_id = get_my_technician_id()
    )
  );

-- SERVICE ORDER NOTES
CREATE POLICY "Ver notas da OS" ON service_order_notes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM service_orders 
      WHERE service_orders.id = service_order_notes.service_order_id 
      AND (
        check_is_admin() OR 
        check_is_soporte() OR 
        service_orders.technician_id = get_my_technician_id() OR 
        (service_orders.customer_id = get_my_customer_id() AND service_order_notes.is_internal = false)
      )
    )
  );
CREATE POLICY "Inserir notas na OS" ON service_order_notes
  FOR INSERT WITH CHECK (
    check_is_admin() OR check_is_soporte() OR 
    EXISTS (
      SELECT 1 FROM service_orders 
      WHERE service_orders.id = service_order_notes.service_order_id 
      AND (service_orders.technician_id = get_my_technician_id() OR service_orders.customer_id = get_my_customer_id())
    )
  );

-- SERVICE ORDER PHOTOS
CREATE POLICY "Ver fotos da OS" ON service_order_photos
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM service_orders 
      WHERE service_orders.id = service_order_photos.service_order_id 
      AND (check_is_admin() OR check_is_soporte() OR service_orders.technician_id = get_my_technician_id() OR service_orders.customer_id = get_my_customer_id())
    )
  );
CREATE POLICY "Inserir fotos na OS" ON service_order_photos
  FOR INSERT WITH CHECK (
    check_is_admin() OR check_is_soporte() OR 
    EXISTS (
      SELECT 1 FROM service_orders 
      WHERE service_orders.id = service_order_photos.service_order_id 
      AND (service_orders.technician_id = get_my_technician_id() OR service_orders.customer_id = get_my_customer_id())
    )
  );

-- PARTS
CREATE POLICY "Acesso de leitura das peças" ON parts
  FOR SELECT USING (check_is_admin() OR check_is_soporte() OR check_is_tecnico() OR check_is_vendedor());
CREATE POLICY "Staff gerencia peças" ON parts
  FOR ALL USING (check_is_admin() OR check_is_soporte());

-- SERVICE ORDER PARTS
CREATE POLICY "Ver peças da OS" ON service_order_parts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM service_orders 
      WHERE service_orders.id = service_order_parts.service_order_id 
      AND (check_is_admin() OR check_is_soporte() OR service_orders.technician_id = get_my_technician_id() OR service_orders.customer_id = get_my_customer_id())
    )
  );
CREATE POLICY "Técnico e staff gerenciam peças na OS" ON service_order_parts
  FOR ALL USING (
    check_is_admin() OR check_is_soporte() OR 
    EXISTS (
      SELECT 1 FROM service_orders 
      WHERE service_orders.id = service_order_parts.service_order_id 
      AND service_orders.technician_id = get_my_technician_id()
    )
  );

-- SERVICE QUOTES
CREATE POLICY "Ver orçamentos da OS" ON service_quotes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM service_orders 
      WHERE service_orders.id = service_quotes.service_order_id 
      AND (check_is_admin() OR check_is_soporte() OR service_orders.technician_id = get_my_technician_id() OR service_orders.customer_id = get_my_customer_id())
    )
  );
CREATE POLICY "Técnico e staff criam/editam orçamentos" ON service_quotes
  FOR ALL USING (
    check_is_admin() OR check_is_soporte() OR 
    EXISTS (
      SELECT 1 FROM service_orders 
      WHERE service_orders.id = service_quotes.service_order_id 
      AND service_orders.technician_id = get_my_technician_id()
    )
  );
CREATE POLICY "Cliente aprova ou rejeita orçamento" ON service_quotes
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM service_orders 
      WHERE service_orders.id = service_quotes.service_order_id 
      AND service_orders.customer_id = get_my_customer_id()
    )
  ) WITH CHECK (
    status IN ('aprovado', 'rejeitado')
  );

-- SERVICE QUOTE ITEMS
CREATE POLICY "Ver itens de orçamento de OS" ON service_quote_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM service_quotes
      JOIN service_orders ON service_orders.id = service_quotes.service_order_id
      WHERE service_quotes.id = service_quote_items.service_quote_id
      AND (check_is_admin() OR check_is_soporte() OR service_orders.technician_id = get_my_technician_id() OR service_orders.customer_id = get_my_customer_id())
    )
  );
CREATE POLICY "Gerenciar itens de orçamento de OS" ON service_quote_items
  FOR ALL USING (
    check_is_admin() OR check_is_soporte() OR 
    EXISTS (
      SELECT 1 FROM service_quotes
      JOIN service_orders ON service_orders.id = service_quotes.service_order_id
      WHERE service_quotes.id = service_quote_items.service_quote_id
      AND service_orders.technician_id = get_my_technician_id()
    )
  );

-- APPOINTMENTS
CREATE POLICY "Ver agenda de compromissos" ON appointments
  FOR SELECT USING (check_is_admin() OR check_is_soporte() OR technician_id = get_my_technician_id());
CREATE POLICY "Staff gerencia compromissos" ON appointments
  FOR ALL USING (check_is_admin() OR check_is_soporte());
CREATE POLICY "Técnico atualiza status de seu compromisso" ON appointments
  FOR UPDATE USING (technician_id = get_my_technician_id() AND check_is_tecnico());

-- SYSTEM LOGS AND WHATSAPP (Apenas administradores acessam diretamente)
CREATE POLICY "Apenas admin acessa templates WhatsApp" ON whatsapp_templates FOR ALL USING (check_is_admin());
CREATE POLICY "Apenas admin acessa fila WhatsApp" ON whatsapp_messages FOR ALL USING (check_is_admin());
CREATE POLICY "Apenas admin acessa logs de automação" ON automation_logs FOR ALL USING (check_is_admin());
CREATE POLICY "Apenas admin acessa logs de auditoria" ON audit_logs FOR ALL USING (check_is_admin());

-- 10. Inserts Iniciais de Categorias e Templates do WhatsApp

-- Categorias padrão de produtos odontológicos
INSERT INTO product_categories (name, slug, description) VALUES
('Cadeiras Consultório', 'cadeiras-consultorio', 'Cadeiras odontológicas ergonômicas, sistemas integrados e periféricos.'),
('Autoclaves e Biossegurança', 'autoclaves-biosseguranca', 'Equipamentos para esterilização, termodesinfecção e limpeza de instrumentais.'),
('Imagem e Diagnóstico', 'imagem-diagnostico', 'Raios-X intraoral, sensores digitais, câmeras intraorais e negatoscópios.'),
('Periféricos e Peças de Mão', 'perifericos-pecas-mao', 'Canetas de alta rotação, micromotores, contra-ângulos e ultrassons.'),
('Compressores e Bombas de Vácuo', 'compressores-bombas-vacuo', 'Compressores isentos de óleo e sistemas de aspiração de alta potência.'),
('Peças de Reposição', 'pecas-reposicao', 'Mangueiras, válvulas, lâmpadas, filtros e peças técnicas gerais.');

-- Modelos de templates iniciais de mensagens no WhatsApp
INSERT INTO whatsapp_templates (name, content, language) VALUES
('boas_vindas_cliente', 'Olá {{nome}}! Seja bem-vindo à Plataforma Dental. Seu cadastro foi realizado com sucesso. Acompanhe seus pedidos e ordens de serviço por aqui.', 'pt-BR'),
('pedido_criado', 'Olá! Seu pedido de venda #{{numero_pedido}} no valor total de R$ {{total}} foi recebido e está pendente de processamento. Agradecemos a preferência.', 'pt-BR'),
('os_criada', 'Olá! A sua Ordem de Serviço #{{numero_os}} para o equipamento {{equipamento}} foi aberta com sucesso. Em breve um técnico será designado.', 'pt-BR'),
('os_atualizada', 'Prezado cliente, o status da sua Ordem de Serviço #{{numero_os}} foi alterado para: *{{status}}*. Acompanhe em tempo real na plataforma.', 'pt-BR'),
('orcamento_os', 'Prezado cliente, o orçamento para conserto do equipamento {{equipamento}} na OS #{{numero_os}} está pronto. Valor: R$ {{total}}. Acesse a plataforma para visualizar e aprovar.', 'pt-BR'),
('visita_agendada', 'Olá! Confirmamos a visita do técnico {{tecnico}} para o dia {{data}} entre {{hora_inicio}} e {{hora_fim}} para atendimento da OS #{{numero_os}}.', 'pt-BR');
