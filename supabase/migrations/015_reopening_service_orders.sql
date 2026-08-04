-- 015_reopening_service_orders.sql
-- Add fields to service_orders for signatures, billing, and strict closed_at tracking
ALTER TABLE service_orders ADD COLUMN IF NOT EXISTS customer_signature_url TEXT;
ALTER TABLE service_orders ADD COLUMN IF NOT EXISTS is_billed BOOLEAN DEFAULT FALSE;
ALTER TABLE service_orders ADD COLUMN IF NOT EXISTS closed_at TIMESTAMP WITH TIME ZONE;

-- Create service_order_reopening_requests table
CREATE TABLE IF NOT EXISTS service_order_reopening_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  service_order_id UUID NOT NULL REFERENCES service_orders(id) ON DELETE CASCADE,
  technician_id UUID NOT NULL REFERENCES technicians(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'aprovada', 'rejeitada')),
  manager_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  manager_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Ensure only one pending request per OS
CREATE UNIQUE INDEX IF NOT EXISTS idx_reopening_request_pending 
  ON service_order_reopening_requests (service_order_id) 
  WHERE status = 'pendente';

-- Create service_order_reopening_audit table (append-only)
CREATE TABLE IF NOT EXISTS service_order_reopening_audit (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  service_order_id UUID NOT NULL REFERENCES service_orders(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('solicitacao_criada', 'aprovada', 'rejeitada', 'reabertura_direta', 'reabertura_automatica')),
  actor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  mandatory_reason TEXT NOT NULL,
  previous_status service_order_status NOT NULL,
  resulting_status service_order_status NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- RLS para service_order_reopening_requests
ALTER TABLE service_order_reopening_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins e Suporte gerenciam reopening_requests"
  ON service_order_reopening_requests
  FOR ALL
  USING (check_is_admin() OR check_is_soporte())
  WITH CHECK (check_is_admin() OR check_is_soporte());

CREATE POLICY "Tecnicos gerenciam suas proprias solicitacoes"
  ON service_order_reopening_requests
  FOR ALL
  USING (technician_id = get_my_technician_id())
  WITH CHECK (technician_id = get_my_technician_id());

-- RLS para service_order_reopening_audit
ALTER TABLE service_order_reopening_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins leem auditoria"
  ON service_order_reopening_audit
  FOR SELECT
  USING (check_is_admin() OR check_is_soporte());

CREATE POLICY "Todos podem inserir na auditoria via API internamente"
  ON service_order_reopening_audit
  FOR INSERT
  WITH CHECK (true);

-- Functions to enforce rules at DB level
CREATE OR REPLACE FUNCTION request_reopening(
  p_service_order_id UUID,
  p_reason TEXT
) RETURNS JSON AS $$
DECLARE
  v_os service_orders%ROWTYPE;
  v_tech_id UUID;
  v_hours_passed NUMERIC;
  v_previous_status service_order_status;
BEGIN
  -- Get current OS
  SELECT * INTO v_os FROM service_orders WHERE id = p_service_order_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Ordem de serviço não encontrada.';
  END IF;

  -- Ensure it's closed
  IF v_os.status != 'concluida' AND v_os.status != 'cancelada' THEN
    RAISE EXCEPTION 'Apenas OS finalizadas podem ser reabertas.';
  END IF;

  -- Check technician
  v_tech_id := get_my_technician_id();
  IF v_os.technician_id != v_tech_id THEN
    RAISE EXCEPTION 'Você não é o técnico atribuído a esta OS.';
  END IF;

  -- Check if signed or billed
  IF v_os.customer_signature_url IS NOT NULL THEN
    RAISE EXCEPTION 'Não é possível reabrir OS assinada pelo cliente.';
  END IF;

  IF v_os.is_billed = TRUE THEN
    RAISE EXCEPTION 'Não é possível reabrir OS já faturada.';
  END IF;

  -- Check time window
  IF v_os.closed_at IS NULL THEN
    -- Requires manager approval
    v_hours_passed := 999;
  ELSE
    v_hours_passed := EXTRACT(EPOCH FROM (NOW() - v_os.closed_at))/3600;
  END IF;

  IF v_hours_passed <= 2 THEN
    -- Auto-reopen
    -- Find previous editable status
    SELECT status INTO v_previous_status FROM service_order_status_history 
    WHERE service_order_id = p_service_order_id 
      AND status NOT IN ('concluida', 'cancelada')
    ORDER BY created_at DESC LIMIT 1;
    
    IF v_previous_status IS NULL THEN
      v_previous_status := 'em_atendimento';
    END IF;

    UPDATE service_orders SET status = v_previous_status, closed_at = NULL WHERE id = p_service_order_id;
    
    INSERT INTO service_order_reopening_audit (
      service_order_id, event_type, actor_id, mandatory_reason, previous_status, resulting_status
    ) VALUES (
      p_service_order_id, 'reabertura_automatica', auth.uid(), p_reason, v_os.status, v_previous_status
    );

    RETURN json_build_object('success', true, 'action', 'reopened', 'new_status', v_previous_status);
  ELSE
    -- Require request
    -- Verify no pending request
    IF EXISTS (SELECT 1 FROM service_order_reopening_requests WHERE service_order_id = p_service_order_id AND status = 'pendente') THEN
      RAISE EXCEPTION 'Já existe uma solicitação de reabertura pendente.';
    END IF;

    INSERT INTO service_order_reopening_requests (
      service_order_id, technician_id, reason
    ) VALUES (
      p_service_order_id, v_tech_id, p_reason
    );

    INSERT INTO service_order_reopening_audit (
      service_order_id, event_type, actor_id, mandatory_reason, previous_status, resulting_status
    ) VALUES (
      p_service_order_id, 'solicitacao_criada', auth.uid(), p_reason, v_os.status, v_os.status
    );

    RETURN json_build_object('success', true, 'action', 'requested');
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


CREATE OR REPLACE FUNCTION process_reopening_request(
  p_request_id UUID,
  p_action TEXT, -- 'approve' or 'reject'
  p_reason TEXT
) RETURNS JSON AS $$
DECLARE
  v_req service_order_reopening_requests%ROWTYPE;
  v_os service_orders%ROWTYPE;
  v_previous_status service_order_status;
BEGIN
  IF NOT (check_is_admin() OR check_is_soporte()) THEN
    RAISE EXCEPTION 'Acesso negado. Apenas gerentes podem processar solicitações.';
  END IF;

  SELECT * INTO v_req FROM service_order_reopening_requests WHERE id = p_request_id AND status = 'pendente';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Solicitação não encontrada ou já processada.';
  END IF;

  SELECT * INTO v_os FROM service_orders WHERE id = v_req.service_order_id;

  IF p_action = 'approve' THEN
    -- Find previous editable status
    SELECT status INTO v_previous_status FROM service_order_status_history 
    WHERE service_order_id = v_os.id 
      AND status NOT IN ('concluida', 'cancelada')
    ORDER BY created_at DESC LIMIT 1;
    
    IF v_previous_status IS NULL THEN
      v_previous_status := 'em_atendimento';
    END IF;

    UPDATE service_orders 
    SET status = v_previous_status, closed_at = NULL, customer_signature_url = NULL 
    WHERE id = v_os.id;

    UPDATE service_order_reopening_requests 
    SET status = 'aprovada', manager_id = auth.uid(), manager_reason = p_reason, updated_at = NOW() 
    WHERE id = p_request_id;

    INSERT INTO service_order_reopening_audit (
      service_order_id, event_type, actor_id, mandatory_reason, previous_status, resulting_status
    ) VALUES (
      v_os.id, 'aprovada', auth.uid(), p_reason, v_os.status, v_previous_status
    );

    RETURN json_build_object('success', true, 'action', 'approved', 'new_status', v_previous_status);
  ELSIF p_action = 'reject' THEN
    IF p_reason IS NULL OR trim(p_reason) = '' THEN
      RAISE EXCEPTION 'Motivo é obrigatório para rejeição.';
    END IF;

    UPDATE service_order_reopening_requests 
    SET status = 'rejeitada', manager_id = auth.uid(), manager_reason = p_reason, updated_at = NOW() 
    WHERE id = p_request_id;

    INSERT INTO service_order_reopening_audit (
      service_order_id, event_type, actor_id, mandatory_reason, previous_status, resulting_status
    ) VALUES (
      v_os.id, 'rejeitada', auth.uid(), p_reason, v_os.status, v_os.status
    );

    RETURN json_build_object('success', true, 'action', 'rejected');
  ELSE
    RAISE EXCEPTION 'Ação inválida.';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


CREATE OR REPLACE FUNCTION direct_reopen_os(
  p_service_order_id UUID,
  p_reason TEXT
) RETURNS JSON AS $$
DECLARE
  v_os service_orders%ROWTYPE;
  v_previous_status service_order_status;
BEGIN
  IF NOT (check_is_admin() OR check_is_soporte()) THEN
    RAISE EXCEPTION 'Acesso negado. Apenas gerentes podem reabrir diretamente.';
  END IF;

  IF p_reason IS NULL OR trim(p_reason) = '' THEN
    RAISE EXCEPTION 'Motivo é obrigatório para reabertura direta.';
  END IF;

  SELECT * INTO v_os FROM service_orders WHERE id = p_service_order_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Ordem de serviço não encontrada.';
  END IF;

  IF v_os.status != 'concluida' AND v_os.status != 'cancelada' THEN
    RAISE EXCEPTION 'Apenas OS finalizadas podem ser reabertas.';
  END IF;

  -- Find previous editable status
  SELECT status INTO v_previous_status FROM service_order_status_history 
  WHERE service_order_id = p_service_order_id 
    AND status NOT IN ('concluida', 'cancelada')
  ORDER BY created_at DESC LIMIT 1;
  
  IF v_previous_status IS NULL THEN
    v_previous_status := 'em_atendimento';
  END IF;

  -- Rule 7: if signed, require new signature (customer_signature_url = null)
  UPDATE service_orders 
  SET status = v_previous_status, closed_at = NULL, customer_signature_url = NULL 
  WHERE id = p_service_order_id;

  INSERT INTO service_order_reopening_audit (
    service_order_id, event_type, actor_id, mandatory_reason, previous_status, resulting_status
  ) VALUES (
    p_service_order_id, 'reabertura_direta', auth.uid(), p_reason, v_os.status, v_previous_status
  );

  RETURN json_build_object('success', true, 'new_status', v_previous_status);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
