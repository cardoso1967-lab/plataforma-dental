-- ============================================================
-- SEED: demo_prototype_data.sql
-- Plataforma Dental — Dados de Demonstração do Protótipo
-- ============================================================
-- ATENÇÃO: Este arquivo é destinado exclusivamente à demonstração
-- e apresentação do protótipo. NÃO aplicar em ambiente de produção
-- real com dados de clientes verdadeiros.
--
-- SEGURANÇA:
--   - Sem cláusulas TRUNCATE, DELETE, DROP, ALTER TABLE ou CREATE TABLE.
--   - Sem alteração de RLS, enums ou schema.
--   - Idempotente: usa INSERT ... ON CONFLICT DO NOTHING e WHERE NOT EXISTS.
--   - Não cria usuários auth.users diretamente.
--   - Não expõe segredos ou chaves de API.
--   - WhatsApp permanece desabilitado (sem inserções em whatsapp_messages).
--
-- COMO APLICAR:
--   1. Acesse o painel do Supabase: https://supabase.com
--   2. Vá em SQL Editor > New Query
--   3. Cole o conteúdo deste arquivo
--   4. Clique em Run
--
-- ENUM VALUES CONFIRMADOS (do schema):
--   service_order_status: aberta, em_analise, orcamento_pendente,
--     orcamento_aprovado, em_atendimento, concluida, cancelada,
--     tecnico_atribuido, visita_agendada, aguardando_peca
--   sales_order_status: pendente, aprovado, faturado, cancelado
--   quote_status: rascunho, enviado, aprovado, rejeitado, expirado
--   appointment_status: agendado, confirmado, em_andamento, concluido, cancelado
--   product_type: equipamento, peca, insumo, outro
-- ============================================================

-- ============================================================
-- BLOCO 1: CATEGORIAS DE PRODUTOS (já podem existir pela migração 001)
-- ============================================================
-- As categorias padrão já são criadas pela migração 001_initial_schema.sql.
-- Nenhuma inserção adicional necessária aqui.

-- ============================================================
-- BLOCO 2: PRODUTOS DEMO
-- ============================================================
DO $$
DECLARE
  v_cat_cadeiras UUID;
  v_cat_autoclaves UUID;
  v_cat_compressores UUID;
  v_cat_perifericos UUID;
BEGIN
  SELECT id INTO v_cat_cadeiras FROM product_categories WHERE slug = 'cadeiras-consultorio' LIMIT 1;
  SELECT id INTO v_cat_autoclaves FROM product_categories WHERE slug = 'autoclaves-biosseguranca' LIMIT 1;
  SELECT id INTO v_cat_compressores FROM product_categories WHERE slug = 'compressores-bombas-vacuo' LIMIT 1;
  SELECT id INTO v_cat_perifericos FROM product_categories WHERE slug = 'perifericos-pecas-mao' LIMIT 1;

  -- Cadeira Odontológica Premium
  INSERT INTO products (name, slug, description, price, sku, product_type, stock_quantity, is_active, category_id)
  VALUES (
    'Cadeira Odontológica Premium',
    'cadeira-odontologica-premium',
    'Cadeira odontológica com estofamento em couro sintético, movimento hidráulico e sistema de irrigação integrado. Ideal para consultórios de alto padrão.',
    18500.00,
    'DENT-CADEIRA-PREMIUM',
    'equipamento',
    5,
    true,
    v_cat_cadeiras
  )
  ON CONFLICT (slug) DO NOTHING;

  -- Compressor Odontológico Silencioso
  INSERT INTO products (name, slug, description, price, sku, product_type, stock_quantity, is_active, category_id)
  VALUES (
    'Compressor Odontológico Silencioso',
    'compressor-odontologico-silencioso',
    'Compressor de ar odontológico sem óleo, livre de vibrações, com filtro de partículas e nível de ruído abaixo de 58 dB. Certificado ANVISA.',
    4290.00,
    'DENT-COMP-SILENC',
    'equipamento',
    8,
    true,
    v_cat_compressores
  )
  ON CONFLICT (slug) DO NOTHING;

  -- Autoclave Digital 21L
  INSERT INTO products (name, slug, description, price, sku, product_type, stock_quantity, is_active, category_id)
  VALUES (
    'Autoclave Digital 21L',
    'autoclave-digital-21l',
    'Autoclave digital com display LCD, câmara em aço inoxidável AISI 316L, capacidade de 21 litros, ciclos automáticos e sistema de secagem.',
    5800.00,
    'DENT-AUTO-21L',
    'equipamento',
    6,
    true,
    v_cat_autoclaves
  )
  ON CONFLICT (slug) DO NOTHING;

  -- Fotopolimerizador LED
  INSERT INTO products (name, slug, description, price, sku, product_type, stock_quantity, is_active, category_id)
  VALUES (
    'Fotopolimerizador LED',
    'fotopolimerizador-led',
    'Fotopolimerizador sem fio com potência de 1200 mW/cm², espectro de emissão de 430–490 nm. Compatível com todas as resinas compostas do mercado.',
    890.00,
    'DENT-FOTO-LED',
    'equipamento',
    20,
    true,
    v_cat_perifericos
  )
  ON CONFLICT (slug) DO NOTHING;

  -- Ultrassom Odontológico
  INSERT INTO products (name, slug, description, price, sku, product_type, stock_quantity, is_active, category_id)
  VALUES (
    'Ultrassom Odontológico',
    'ultrassom-odontologico',
    'Aparelho de ultrassom piezoelétrico para raspagem e alisamento radicular, profilaxia e remoção de cálculo. Inclui 5 pontas intercambiáveis.',
    1250.00,
    'DENT-ULTRA-01',
    'equipamento',
    12,
    true,
    v_cat_perifericos
  )
  ON CONFLICT (slug) DO NOTHING;

  -- Bomba de Vácuo Odontológica
  INSERT INTO products (name, slug, description, price, sku, product_type, stock_quantity, is_active, category_id)
  VALUES (
    'Bomba de Vácuo Odontológica',
    'bomba-vacuo-odontologica',
    'Sistema de aspiração central de alta potência com bomba de anel d''água. Suporta até 4 consultórios simultâneos.',
    6200.00,
    'DENT-VACUO-01',
    'equipamento',
    3,
    true,
    v_cat_compressores
  )
  ON CONFLICT (slug) DO NOTHING;
END $$;

-- ============================================================
-- BLOCO 3: PEÇAS DE REPOSIÇÃO DEMO
-- ============================================================
INSERT INTO parts (name, code, price, stock_quantity)
VALUES ('Válvula de Acionamento do Pedal', 'PEC-VALV-001', 85.00, 15)
ON CONFLICT (code) DO NOTHING;

INSERT INTO parts (name, code, price, stock_quantity)
VALUES ('Filtro de Compressor Odontológico', 'PEC-FILTRO-001', 45.00, 30)
ON CONFLICT (code) DO NOTHING;

INSERT INTO parts (name, code, price, stock_quantity)
VALUES ('Mangueira de Alta Pressão 1/4', 'PEC-MANG-001', 120.00, 10)
ON CONFLICT (code) DO NOTHING;

INSERT INTO parts (name, code, price, stock_quantity)
VALUES ('Placa Eletrônica de Comando Autoclave', 'PEC-PLACA-001', 380.00, 5)
ON CONFLICT (code) DO NOTHING;

INSERT INTO parts (name, code, price, stock_quantity)
VALUES ('Kit de Vedação para Autoclave 21L', 'PEC-VEDA-001', 65.00, 20)
ON CONFLICT (code) DO NOTHING;

-- ============================================================
-- BLOCO 4: CLIENTES DEMO ADICIONAIS
-- ============================================================
-- Clínica Sorriso Prime
INSERT INTO customers (
  company_name, trade_name, cnpj,
  address_street, address_number, address_neighborhood, address_city, address_state, address_zip,
  contact_name, email, phone, whatsapp,
  notes
)
SELECT
  'Clínica Sorriso Prime Ltda',
  'Sorriso Prime',
  '12.345.678/0001-90',
  'Rua das Flores',
  '245',
  'Jardim Paulista',
  'São Paulo',
  'SP',
  '01403-001',
  'Dra. Camila Andrade',
  'contato@sorrisoprime.com.br',
  '(11) 3245-8800',
  '(11) 98845-0012',
  'Cliente VIP — clínica de referência na região. 3 consultórios ativos.'
WHERE NOT EXISTS (
  SELECT 1 FROM customers WHERE cnpj = '12.345.678/0001-90'
);

-- Odonto Center Norte
INSERT INTO customers (
  company_name, trade_name, cnpj,
  address_street, address_number, address_neighborhood, address_city, address_state, address_zip,
  contact_name, email, phone, whatsapp
)
SELECT
  'Odonto Center Norte S/A',
  'Odonto Center Norte',
  '23.456.789/0001-01',
  'Av. Padrão Norte',
  '1080',
  'Santana',
  'São Paulo',
  'SP',
  '02401-000',
  'Dr. Roberto Campos',
  'adm@odontocenternorte.com.br',
  '(11) 2985-3300',
  '(11) 97733-5500'
WHERE NOT EXISTS (
  SELECT 1 FROM customers WHERE cnpj = '23.456.789/0001-01'
);

-- Instituto Dental Vida
INSERT INTO customers (
  company_name, trade_name, cnpj,
  address_street, address_number, address_neighborhood, address_city, address_state, address_zip,
  contact_name, email, phone
)
SELECT
  'Instituto Dental Vida Eireli',
  'Dental Vida',
  '34.567.890/0001-12',
  'Rua Consolação',
  '3400',
  'Consolação',
  'São Paulo',
  'SP',
  '01302-002',
  'Dra. Fernanda Lima',
  'contato@dentalvida.com.br',
  '(11) 3122-4400'
WHERE NOT EXISTS (
  SELECT 1 FROM customers WHERE cnpj = '34.567.890/0001-12'
);

-- Clínica Dental Avançada
INSERT INTO customers (
  company_name, trade_name, cnpj,
  address_street, address_number, address_neighborhood, address_city, address_state, address_zip,
  contact_name, email, phone
)
SELECT
  'Clínica Dental Avançada Ltda',
  'Dental Avançada',
  '45.678.901/0001-23',
  'Av. Brigadeiro Faria Lima',
  '2170',
  'Itaim Bibi',
  'São Paulo',
  'SP',
  '01451-000',
  'Dr. André Mota',
  'financeiro@dentalavancada.com.br',
  '(11) 3040-7700'
WHERE NOT EXISTS (
  SELECT 1 FROM customers WHERE cnpj = '45.678.901/0001-23'
);

-- ============================================================
-- BLOCO 5: VINCULAR cliente@dental.com AO SEU CUSTOMER
-- Se o trigger criou o registro de customer com company_name = 'cliente'
-- (ou o e-mail como nome), atualizar para um nome real de clínica.
-- ============================================================
DO $$
DECLARE
  v_cliente_profile_id UUID;
BEGIN
  SELECT id INTO v_cliente_profile_id
  FROM profiles
  WHERE id IN (SELECT id FROM auth.users WHERE email = 'cliente@dental.com')
  LIMIT 1;

  IF v_cliente_profile_id IS NOT NULL THEN
    UPDATE customers
    SET
      company_name = CASE
        WHEN company_name IN ('cliente', 'cliente@dental.com') THEN 'Clínica Sorriso Prime Ltda'
        ELSE company_name
      END,
      trade_name = COALESCE(trade_name, 'Sorriso Prime'),
      contact_name = COALESCE(contact_name, 'Dra. Camila Andrade'),
      email = COALESCE(email, 'contato@sorrisoprime.com.br'),
      phone = COALESCE(phone, '(11) 3245-8800'),
      address_city = COALESCE(address_city, 'São Paulo'),
      address_state = COALESCE(address_state, 'SP'),
      notes = COALESCE(notes, 'Cliente de demonstração vinculado ao usuário cliente@dental.com.')
    WHERE profile_id = v_cliente_profile_id;
  END IF;
END $$;

-- ============================================================
-- BLOCO 6: EQUIPAMENTOS DO CLIENTE (cliente@dental.com)
-- ============================================================
DO $$
DECLARE
  v_cliente_customer_id UUID;
BEGIN
  SELECT c.id INTO v_cliente_customer_id
  FROM customers c
  JOIN profiles p ON p.id = c.profile_id
  JOIN auth.users u ON u.id = p.id
  WHERE u.email = 'cliente@dental.com'
  LIMIT 1;

  IF v_cliente_customer_id IS NOT NULL THEN

    -- Cadeira Odontológica Premium
    INSERT INTO client_equipment (
      customer_id, name, brand, model, serial_number,
      installation_date, last_maintenance_date, notes
    )
    SELECT
      v_cliente_customer_id,
      'Cadeira Odontológica Premium',
      'DentalMax',
      'DM-3500',
      'EQ-CLD-0001',
      '2022-03-15',
      '2024-09-10',
      'Consultório 1 — uso diário. Última manutenção preventiva realizada com sucesso.'
    WHERE NOT EXISTS (
      SELECT 1 FROM client_equipment
      WHERE customer_id = v_cliente_customer_id AND serial_number = 'EQ-CLD-0001'
    );

    -- Compressor Odontológico Silencioso
    INSERT INTO client_equipment (
      customer_id, name, brand, model, serial_number,
      installation_date, last_maintenance_date, notes
    )
    SELECT
      v_cliente_customer_id,
      'Compressor Odontológico Silencioso',
      'AirDent',
      'AD-100S',
      'EQ-CLD-0002',
      '2022-03-15',
      '2024-09-10',
      'Serve os 2 consultórios simultaneamente. Filtro de ar trocado na última revisão.'
    WHERE NOT EXISTS (
      SELECT 1 FROM client_equipment
      WHERE customer_id = v_cliente_customer_id AND serial_number = 'EQ-CLD-0002'
    );

    -- Autoclave Digital 21L
    INSERT INTO client_equipment (
      customer_id, name, brand, model, serial_number,
      installation_date, last_maintenance_date, notes
    )
    SELECT
      v_cliente_customer_id,
      'Autoclave Digital 21L',
      'SterilPro',
      'SP-21D',
      'EQ-CLD-0003',
      '2023-01-20',
      NULL,
      'Apresentando falha na finalização do ciclo de esterilização — OS aberta.'
    WHERE NOT EXISTS (
      SELECT 1 FROM client_equipment
      WHERE customer_id = v_cliente_customer_id AND serial_number = 'EQ-CLD-0003'
    );

    -- Fotopolimerizador LED
    INSERT INTO client_equipment (
      customer_id, name, brand, model, serial_number,
      installation_date, notes
    )
    SELECT
      v_cliente_customer_id,
      'Fotopolimerizador LED',
      'PhotoDent',
      'PD-1200W',
      'EQ-CLD-0004',
      '2023-06-10',
      'Equipamento em boas condições de uso.'
    WHERE NOT EXISTS (
      SELECT 1 FROM client_equipment
      WHERE customer_id = v_cliente_customer_id AND serial_number = 'EQ-CLD-0004'
    );

  END IF;
END $$;

-- ============================================================
-- BLOCO 7: EQUIPAMENTOS PARA OUTROS CLIENTES DEMO
-- ============================================================
DO $$
DECLARE
  v_sorriso_id UUID;
  v_odonto_id UUID;
BEGIN
  SELECT id INTO v_sorriso_id FROM customers WHERE cnpj = '12.345.678/0001-90' LIMIT 1;
  SELECT id INTO v_odonto_id FROM customers WHERE cnpj = '23.456.789/0001-01' LIMIT 1;

  IF v_sorriso_id IS NOT NULL THEN
    INSERT INTO client_equipment (customer_id, name, brand, model, serial_number, installation_date, notes)
    SELECT v_sorriso_id, 'Cadeira Odontológica Premium', 'DentalMax', 'DM-3500', 'EQ-SP-0001', '2021-08-10', 'Consultório 1'
    WHERE NOT EXISTS (SELECT 1 FROM client_equipment WHERE serial_number = 'EQ-SP-0001');

    INSERT INTO client_equipment (customer_id, name, brand, model, serial_number, installation_date, notes)
    SELECT v_sorriso_id, 'Cadeira Odontológica Premium', 'DentalMax', 'DM-3500', 'EQ-SP-0002', '2021-08-10', 'Consultório 2'
    WHERE NOT EXISTS (SELECT 1 FROM client_equipment WHERE serial_number = 'EQ-SP-0002');

    INSERT INTO client_equipment (customer_id, name, brand, model, serial_number, installation_date, notes)
    SELECT v_sorriso_id, 'Autoclave Digital 21L', 'SterilPro', 'SP-21D', 'EQ-SP-0003', '2021-09-01', 'Central de esterilização'
    WHERE NOT EXISTS (SELECT 1 FROM client_equipment WHERE serial_number = 'EQ-SP-0003');
  END IF;

  IF v_odonto_id IS NOT NULL THEN
    INSERT INTO client_equipment (customer_id, name, brand, model, serial_number, installation_date, notes)
    SELECT v_odonto_id, 'Compressor Odontológico Silencioso', 'AirDent', 'AD-100S', 'EQ-ON-0001', '2023-02-14', 'Sala de compressores'
    WHERE NOT EXISTS (SELECT 1 FROM client_equipment WHERE serial_number = 'EQ-ON-0001');
  END IF;
END $$;

-- ============================================================
-- BLOCO 8: PEDIDOS DE VENDA (sales_orders)
-- ============================================================
DO $$
DECLARE
  v_cliente_customer_id UUID;
  v_sorriso_id UUID;
  v_odonto_id UUID;
  v_vida_id UUID;
  v_prod_cadeira_id UUID;
  v_prod_compressor_id UUID;
  v_prod_autoclave_id UUID;
  v_prod_foto_id UUID;
  v_prod_ultra_id UUID;
  v_so1_id UUID;
  v_so2_id UUID;
  v_so3_id UUID;
BEGIN
  -- Clientes
  SELECT c.id INTO v_cliente_customer_id
  FROM customers c JOIN profiles p ON p.id = c.profile_id
  JOIN auth.users u ON u.id = p.id WHERE u.email = 'cliente@dental.com' LIMIT 1;

  SELECT id INTO v_sorriso_id FROM customers WHERE cnpj = '12.345.678/0001-90' LIMIT 1;
  SELECT id INTO v_odonto_id FROM customers WHERE cnpj = '23.456.789/0001-01' LIMIT 1;
  SELECT id INTO v_vida_id FROM customers WHERE cnpj = '34.567.890/0001-12' LIMIT 1;

  -- Produtos
  SELECT id INTO v_prod_cadeira_id FROM products WHERE sku = 'DENT-CADEIRA-PREMIUM' LIMIT 1;
  SELECT id INTO v_prod_compressor_id FROM products WHERE sku = 'DENT-COMP-SILENC' LIMIT 1;
  SELECT id INTO v_prod_autoclave_id FROM products WHERE sku = 'DENT-AUTO-21L' LIMIT 1;
  SELECT id INTO v_prod_foto_id FROM products WHERE sku = 'DENT-FOTO-LED' LIMIT 1;
  SELECT id INTO v_prod_ultra_id FROM products WHERE sku = 'DENT-ULTRA-01' LIMIT 1;

  -- Pedido 1: Concluído / Faturado — Clínica Sorriso Prime
  IF v_sorriso_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM sales_orders WHERE notes = 'DEMO-PV-001'
  ) THEN
    INSERT INTO sales_orders (customer_id, status, total_amount, notes)
    VALUES (v_sorriso_id, 'faturado', 23680.00, 'DEMO-PV-001')
    RETURNING id INTO v_so1_id;

    IF v_prod_cadeira_id IS NOT NULL THEN
      INSERT INTO sales_order_items (sales_order_id, product_id, quantity, unit_price)
      VALUES (v_so1_id, v_prod_cadeira_id, 1, 18500.00);
    END IF;
    IF v_prod_foto_id IS NOT NULL THEN
      INSERT INTO sales_order_items (sales_order_id, product_id, quantity, unit_price)
      VALUES (v_so1_id, v_prod_foto_id, 2, 890.00);
    END IF;
    IF v_prod_ultra_id IS NOT NULL THEN
      INSERT INTO sales_order_items (sales_order_id, product_id, quantity, unit_price)
      VALUES (v_so1_id, v_prod_ultra_id, 1, 1250.00);
    END IF;
  END IF;

  -- Pedido 2: Aprovado / Em andamento — Odonto Center Norte
  IF v_odonto_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM sales_orders WHERE notes = 'DEMO-PV-002'
  ) THEN
    INSERT INTO sales_orders (customer_id, status, total_amount, notes)
    VALUES (v_odonto_id, 'aprovado', 5800.00, 'DEMO-PV-002')
    RETURNING id INTO v_so2_id;

    IF v_prod_autoclave_id IS NOT NULL THEN
      INSERT INTO sales_order_items (sales_order_id, product_id, quantity, unit_price)
      VALUES (v_so2_id, v_prod_autoclave_id, 1, 5800.00);
    END IF;
  END IF;

  -- Pedido 3: Pendente — cliente@dental.com (portal do cliente)
  IF v_cliente_customer_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM sales_orders WHERE notes = 'DEMO-PV-003'
  ) THEN
    INSERT INTO sales_orders (customer_id, status, total_amount, notes)
    VALUES (v_cliente_customer_id, 'pendente', 4290.00, 'DEMO-PV-003')
    RETURNING id INTO v_so3_id;

    IF v_prod_compressor_id IS NOT NULL THEN
      INSERT INTO sales_order_items (sales_order_id, product_id, quantity, unit_price)
      VALUES (v_so3_id, v_prod_compressor_id, 1, 4290.00);
    END IF;
  END IF;

  -- Pedido 4: Faturado — Instituto Dental Vida
  IF v_vida_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM sales_orders WHERE notes = 'DEMO-PV-004'
  ) THEN
    INSERT INTO sales_orders (customer_id, status, total_amount, notes)
    VALUES (v_vida_id, 'faturado', 2140.00, 'DEMO-PV-004')
    RETURNING id INTO v_so1_id; -- reuso da variável

    IF v_prod_foto_id IS NOT NULL THEN
      INSERT INTO sales_order_items (sales_order_id, product_id, quantity, unit_price)
      VALUES (v_so1_id, v_prod_foto_id, 1, 890.00);
    END IF;
    IF v_prod_ultra_id IS NOT NULL THEN
      INSERT INTO sales_order_items (sales_order_id, product_id, quantity, unit_price)
      VALUES (v_so1_id, v_prod_ultra_id, 1, 1250.00);
    END IF;
  END IF;
END $$;

-- ============================================================
-- BLOCO 9: ORDENS DE SERVIÇO (service_orders)
-- ============================================================
DO $$
DECLARE
  v_tecnico_id UUID;
  v_cliente_customer_id UUID;
  v_sorriso_id UUID;
  v_odonto_id UUID;
  v_vida_id UUID;
  v_avancada_id UUID;
  v_eq_autoclave_id UUID;
  v_eq_compressor_id UUID;
  v_eq_cadeira_id UUID;
  v_eq_sorriso_cadeira_id UUID;
  v_eq_odonto_comp_id UUID;
  v_os1_id UUID;
  v_os2_id UUID;
  v_os3_id UUID;
  v_os4_id UUID;
  v_os5_id UUID;
  v_os6_id UUID;
  v_part_valv_id UUID;
  v_part_filtro_id UUID;
  v_part_placa_id UUID;
  v_part_veda_id UUID;
  v_quote_id UUID;
BEGIN
  -- Técnico
  SELECT t.id INTO v_tecnico_id
  FROM technicians t JOIN profiles p ON p.id = t.profile_id
  JOIN auth.users u ON u.id = p.id WHERE u.email = 'tecnico@dental.com' LIMIT 1;

  -- Clientes
  SELECT c.id INTO v_cliente_customer_id
  FROM customers c JOIN profiles p ON p.id = c.profile_id
  JOIN auth.users u ON u.id = p.id WHERE u.email = 'cliente@dental.com' LIMIT 1;

  SELECT id INTO v_sorriso_id FROM customers WHERE cnpj = '12.345.678/0001-90' LIMIT 1;
  SELECT id INTO v_odonto_id FROM customers WHERE cnpj = '23.456.789/0001-01' LIMIT 1;
  SELECT id INTO v_vida_id FROM customers WHERE cnpj = '34.567.890/0001-12' LIMIT 1;
  SELECT id INTO v_avancada_id FROM customers WHERE cnpj = '45.678.901/0001-23' LIMIT 1;

  -- Equipamentos
  IF v_cliente_customer_id IS NOT NULL THEN
    SELECT id INTO v_eq_autoclave_id FROM client_equipment
    WHERE customer_id = v_cliente_customer_id AND serial_number = 'EQ-CLD-0003' LIMIT 1;
    SELECT id INTO v_eq_compressor_id FROM client_equipment
    WHERE customer_id = v_cliente_customer_id AND serial_number = 'EQ-CLD-0002' LIMIT 1;
    SELECT id INTO v_eq_cadeira_id FROM client_equipment
    WHERE customer_id = v_cliente_customer_id AND serial_number = 'EQ-CLD-0001' LIMIT 1;
  END IF;

  IF v_sorriso_id IS NOT NULL THEN
    SELECT id INTO v_eq_sorriso_cadeira_id FROM client_equipment
    WHERE customer_id = v_sorriso_id AND serial_number = 'EQ-SP-0001' LIMIT 1;
  END IF;

  IF v_odonto_id IS NOT NULL THEN
    SELECT id INTO v_eq_odonto_comp_id FROM client_equipment
    WHERE customer_id = v_odonto_id AND serial_number = 'EQ-ON-0001' LIMIT 1;
  END IF;

  -- Peças
  SELECT id INTO v_part_valv_id FROM parts WHERE code = 'PEC-VALV-001' LIMIT 1;
  SELECT id INTO v_part_filtro_id FROM parts WHERE code = 'PEC-FILTRO-001' LIMIT 1;
  SELECT id INTO v_part_placa_id FROM parts WHERE code = 'PEC-PLACA-001' LIMIT 1;
  SELECT id INTO v_part_veda_id FROM parts WHERE code = 'PEC-VEDA-001' LIMIT 1;

  -- OS 1: URGENTE — Autoclave não completa ciclo (cliente@dental.com → visível no portal do cliente)
  IF v_cliente_customer_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM service_orders WHERE reported_issues = 'DEMO-OS-001'
  ) THEN
    INSERT INTO service_orders (
      customer_id, equipment_id, technician_id,
      status, priority, description, reported_issues,
      scheduled_date
    )
    VALUES (
      v_cliente_customer_id, v_eq_autoclave_id, v_tecnico_id,
      'tecnico_atribuido', 'urgente',
      'Autoclave não completa ciclo de esterilização',
      'DEMO-OS-001',
      now() + interval '1 day'
    )
    RETURNING id INTO v_os1_id;

    -- Histórico de status
    INSERT INTO service_order_status_history (service_order_id, status, notes)
    VALUES (v_os1_id, 'aberta', 'OS criada pelo cliente via portal.');
    INSERT INTO service_order_status_history (service_order_id, status, notes)
    VALUES (v_os1_id, 'tecnico_atribuido', 'Técnico designado para atendimento urgente.');

    -- Nota pública para cliente ver
    INSERT INTO service_order_notes (service_order_id, note, is_internal)
    VALUES (v_os1_id, 'Técnico verificou o problema remotamente. Visita agendada para amanhã. Possível falha na placa eletrônica de comando.', false);
  END IF;

  -- OS 2: EM ATENDIMENTO — Compressor com ruído elevado (tecnico@dental.com)
  IF v_cliente_customer_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM service_orders WHERE reported_issues = 'DEMO-OS-002'
  ) THEN
    INSERT INTO service_orders (
      customer_id, equipment_id, technician_id,
      status, priority, description, reported_issues,
      scheduled_date
    )
    VALUES (
      v_cliente_customer_id, v_eq_compressor_id, v_tecnico_id,
      'em_atendimento', 'alta',
      'Compressor com ruído elevado e perda de pressão',
      'DEMO-OS-002',
      current_date::timestamp with time zone
    )
    RETURNING id INTO v_os2_id;

    INSERT INTO service_order_status_history (service_order_id, status, notes)
    VALUES (v_os2_id, 'aberta', 'OS criada pelo administrador.');
    INSERT INTO service_order_status_history (service_order_id, status, notes)
    VALUES (v_os2_id, 'em_atendimento', 'Técnico iniciou atendimento no local.');

    INSERT INTO service_order_notes (service_order_id, note, is_internal)
    VALUES (v_os2_id, 'Técnico no local. Identificado desgaste no filtro interno e folga na válvula de escape.', false);

    -- Peças usadas
    IF v_part_filtro_id IS NOT NULL THEN
      INSERT INTO service_order_parts (service_order_id, part_id, quantity, unit_price)
      VALUES (v_os2_id, v_part_filtro_id, 1, 45.00);
    END IF;
    IF v_part_valv_id IS NOT NULL THEN
      INSERT INTO service_order_parts (service_order_id, part_id, quantity, unit_price)
      VALUES (v_os2_id, v_part_valv_id, 1, 85.00);
    END IF;
  END IF;

  -- OS 3: VISITA AGENDADA PARA HOJE — Manutenção preventiva (Clínica Sorriso Prime)
  IF v_sorriso_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM service_orders WHERE reported_issues = 'DEMO-OS-003'
  ) THEN
    INSERT INTO service_orders (
      customer_id, equipment_id, technician_id,
      status, priority, description, reported_issues,
      scheduled_date
    )
    VALUES (
      v_sorriso_id, v_eq_sorriso_cadeira_id, v_tecnico_id,
      'visita_agendada', 'media',
      'Manutenção preventiva trimestral — revisão geral dos sistemas',
      'DEMO-OS-003',
      current_date::timestamp with time zone + interval '9 hours'
    )
    RETURNING id INTO v_os3_id;

    INSERT INTO service_order_status_history (service_order_id, status, notes)
    VALUES (v_os3_id, 'aberta', 'Solicitação de manutenção preventiva agendada.');
    INSERT INTO service_order_status_history (service_order_id, status, notes)
    VALUES (v_os3_id, 'visita_agendada', 'Visita confirmada para hoje.');
  END IF;

  -- OS 4: AGUARDANDO PEÇA — Troca de filtro do compressor (Odonto Center Norte)
  IF v_odonto_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM service_orders WHERE reported_issues = 'DEMO-OS-004'
  ) THEN
    INSERT INTO service_orders (
      customer_id, equipment_id, technician_id,
      status, priority, description, reported_issues
    )
    VALUES (
      v_odonto_id, v_eq_odonto_comp_id, v_tecnico_id,
      'aguardando_peca', 'alta',
      'Troca de filtro do compressor — peça em trânsito',
      'DEMO-OS-004'
    )
    RETURNING id INTO v_os4_id;

    INSERT INTO service_order_status_history (service_order_id, status, notes)
    VALUES (v_os4_id, 'aberta', 'OS criada pelo admin.');
    INSERT INTO service_order_status_history (service_order_id, status, notes)
    VALUES (v_os4_id, 'aguardando_peca', 'Peça solicitada ao estoque. Prazo de entrega: 3 dias úteis.');

    INSERT INTO service_order_notes (service_order_id, note, is_internal)
    VALUES (v_os4_id, 'Filtro PEC-FILTRO-001 solicitado. Aguardando chegada da peça para concluir o serviço.', true);
  END IF;

  -- OS 5: CONCLUÍDA — Cadeira odontológica com falha no pedal (Instituto Dental Vida)
  IF v_vida_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM service_orders WHERE reported_issues = 'DEMO-OS-005'
  ) THEN
    INSERT INTO service_orders (
      customer_id, technician_id,
      status, priority, description, reported_issues,
      completion_date
    )
    VALUES (
      v_vida_id, v_tecnico_id,
      'concluida', 'media',
      'Cadeira odontológica com falha no pedal de acionamento',
      'DEMO-OS-005',
      now() - interval '5 days'
    )
    RETURNING id INTO v_os5_id;

    INSERT INTO service_order_status_history (service_order_id, status, notes)
    VALUES (v_os5_id, 'aberta', 'Falha reportada pela clínica.');
    INSERT INTO service_order_status_history (service_order_id, status, notes)
    VALUES (v_os5_id, 'em_atendimento', 'Técnico realizou atendimento no local.');
    INSERT INTO service_order_status_history (service_order_id, status, notes)
    VALUES (v_os5_id, 'concluida', 'Válvula de acionamento substituída. Sistema testado e aprovado.');

    INSERT INTO service_order_notes (service_order_id, note, is_internal)
    VALUES (v_os5_id, 'Problema resolvido com troca da válvula de acionamento do pedal.', false);

    IF v_part_valv_id IS NOT NULL THEN
      INSERT INTO service_order_parts (service_order_id, part_id, quantity, unit_price)
      VALUES (v_os5_id, v_part_valv_id, 1, 85.00);
    END IF;
  END IF;

  -- OS 6: EM ANÁLISE — Autoclave com vazamento de vapor (Clínica Dental Avançada)
  IF v_avancada_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM service_orders WHERE reported_issues = 'DEMO-OS-006'
  ) THEN
    INSERT INTO service_orders (
      customer_id, status, priority, description, reported_issues
    )
    VALUES (
      v_avancada_id,
      'orcamento_pendente', 'alta',
      'Autoclave com vazamento de vapor e alarme de pressão ativo',
      'DEMO-OS-006'
    )
    RETURNING id INTO v_os6_id;

    INSERT INTO service_order_status_history (service_order_id, status, notes)
    VALUES (v_os6_id, 'aberta', 'Chamado de emergência da Clínica Dental Avançada.');
    INSERT INTO service_order_status_history (service_order_id, status, notes)
    VALUES (v_os6_id, 'em_analise', 'Técnico realizou diagnóstico remoto por telefone.');
    INSERT INTO service_order_status_history (service_order_id, status, notes)
    VALUES (v_os6_id, 'orcamento_pendente', 'Orçamento elaborado e enviado ao cliente para aprovação.');

    -- Orçamento da OS
    INSERT INTO service_quotes (service_order_id, status, total_amount, valid_until, notes)
    VALUES (
      v_os6_id, 'enviado', 445.00,
      now() + interval '15 days',
      'Troca do kit de vedação e placa eletrônica de controle. Peças em estoque.'
    )
    RETURNING id INTO v_quote_id;

    IF v_quote_id IS NOT NULL THEN
      INSERT INTO service_quote_items (service_quote_id, part_id, description, quantity, unit_price)
      VALUES (v_quote_id, v_part_veda_id, 'Kit de Vedação para Autoclave 21L', 1, 65.00);

      INSERT INTO service_quote_items (service_quote_id, part_id, description, quantity, unit_price)
      VALUES (v_quote_id, v_part_placa_id, 'Placa Eletrônica de Comando Autoclave', 1, 380.00);
    END IF;
  END IF;

  -- Atualizar especialidades do técnico de demonstração se estiver vazia
  IF v_tecnico_id IS NOT NULL THEN
    UPDATE technicians
    SET specialties = ARRAY['Cadeiras Odontológicas', 'Compressores', 'Autoclaves', 'Fotopolimerizadores']
    WHERE id = v_tecnico_id AND (specialties IS NULL OR array_length(specialties, 1) IS NULL OR array_length(specialties, 1) = 0);
  END IF;
END $$;

-- ============================================================
-- BLOCO 10: AGENDAMENTOS (appointments)
-- ============================================================
DO $$
DECLARE
  v_tecnico_id UUID;
  v_os2_id UUID;
  v_os3_id UUID;
  v_os1_id UUID;
BEGIN
  SELECT t.id INTO v_tecnico_id
  FROM technicians t JOIN profiles p ON p.id = t.profile_id
  JOIN auth.users u ON u.id = p.id WHERE u.email = 'tecnico@dental.com' LIMIT 1;

  SELECT id INTO v_os2_id FROM service_orders WHERE reported_issues = 'DEMO-OS-002' LIMIT 1;
  SELECT id INTO v_os3_id FROM service_orders WHERE reported_issues = 'DEMO-OS-003' LIMIT 1;
  SELECT id INTO v_os1_id FROM service_orders WHERE reported_issues = 'DEMO-OS-001' LIMIT 1;

  IF v_tecnico_id IS NOT NULL THEN

    -- Agendamento HOJE — OS em atendimento (compressor)
    IF v_os2_id IS NOT NULL AND NOT EXISTS (
      SELECT 1 FROM appointments WHERE service_order_id = v_os2_id
    ) THEN
      INSERT INTO appointments (technician_id, service_order_id, status, start_time, end_time, notes)
      VALUES (
        v_tecnico_id, v_os2_id, 'em_andamento',
        current_date::timestamp with time zone + interval '8 hours',
        current_date::timestamp with time zone + interval '11 hours',
        'Atendimento de compressor em andamento — cliente Sorriso Prime (Consultório 1).'
      );
    END IF;

    -- Agendamento HOJE — Manutenção preventiva trimestral
    IF v_os3_id IS NOT NULL AND NOT EXISTS (
      SELECT 1 FROM appointments WHERE service_order_id = v_os3_id
    ) THEN
      INSERT INTO appointments (technician_id, service_order_id, status, start_time, end_time, notes)
      VALUES (
        v_tecnico_id, v_os3_id, 'confirmado',
        current_date::timestamp with time zone + interval '14 hours',
        current_date::timestamp with time zone + interval '17 hours',
        'Manutenção preventiva — revisão geral dos equipamentos da Clínica Sorriso Prime.'
      );
    END IF;

    -- Agendamento AMANHÃ — Visita técnica urgente (autoclave cliente@dental.com)
    IF v_os1_id IS NOT NULL AND NOT EXISTS (
      SELECT 1 FROM appointments WHERE service_order_id = v_os1_id
    ) THEN
      INSERT INTO appointments (technician_id, service_order_id, status, start_time, end_time, notes)
      VALUES (
        v_tecnico_id, v_os1_id, 'agendado',
        (current_date + interval '1 day')::timestamp with time zone + interval '9 hours',
        (current_date + interval '1 day')::timestamp with time zone + interval '12 hours',
        'Visita urgente — autoclave não completa ciclo. Levar placa eletrônica de comando reserva.'
      );
    END IF;

  END IF;
END $$;

-- ============================================================
-- FIM DO SEED DEMO
-- ============================================================
-- Resumo dos dados inseridos (quando executado em base limpa):
--
-- products:           6 registros (cadeira, compressor, autoclave, fotopolimerizador, ultrassom, bomba de vácuo)
-- parts:              5 registros (válvula, filtro, mangueira, placa eletrônica, kit vedação)
-- customers:          4 registros demo (Sorriso Prime, Odonto Center Norte, Dental Vida, Dental Avançada)
-- client_equipment:   7 registros (4 do cliente@dental.com, 3 de outros clientes demo)
-- sales_orders:       4 registros (1 faturado, 1 aprovado, 1 pendente para cliente@dental.com, 1 faturado)
-- sales_order_items:  até 8 itens
-- service_orders:     6 registros (distribuídos por status: urgente, em_atendimento, visita_agendada, aguardando_peca, concluida, orcamento_pendente)
-- service_order_status_history: 13 registros históricos
-- service_order_notes: 5 notas
-- service_order_parts: 3 registros de peças usadas
-- service_quotes:     1 orçamento enviado
-- service_quote_items: 2 itens de orçamento
-- appointments:       3 agendamentos (2 hoje, 1 amanhã)
-- ============================================================
