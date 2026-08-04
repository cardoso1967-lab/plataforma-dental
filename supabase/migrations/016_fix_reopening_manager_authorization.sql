-- Fix reopening authorization to include the 'manager' role

-- Drop existing policies that need updating
DROP POLICY IF EXISTS "Admins e Suporte gerenciam reopening_requests" ON service_order_reopening_requests;
DROP POLICY IF EXISTS "Admins leem auditoria" ON service_order_reopening_audit;

-- Recreate policies with check_is_manager()
CREATE POLICY "Admins, Suporte e Gerentes gerenciam reopening_requests" ON service_order_reopening_requests
    FOR ALL
    USING (check_is_admin() OR check_is_soporte() OR check_is_manager())
    WITH CHECK (check_is_admin() OR check_is_soporte() OR check_is_manager());

CREATE POLICY "Admins, Suporte e Gerentes leem auditoria" ON service_order_reopening_audit
    FOR SELECT
    USING (check_is_admin() OR check_is_soporte() OR check_is_manager());

-- Update process_reopening_request to allow managers
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
  IF NOT (check_is_admin() OR check_is_soporte() OR check_is_manager()) THEN
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


-- Update direct_reopen_os to allow managers
CREATE OR REPLACE FUNCTION direct_reopen_os(
  p_service_order_id UUID,
  p_reason TEXT
) RETURNS JSON AS $$
DECLARE
  v_os service_orders%ROWTYPE;
  v_previous_status service_order_status;
BEGIN
  IF NOT (check_is_admin() OR check_is_soporte() OR check_is_manager()) THEN
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
  WHERE service_order_id = v_os.id 
    AND status NOT IN ('concluida', 'cancelada')
  ORDER BY created_at DESC LIMIT 1;
  
  IF v_previous_status IS NULL THEN
    v_previous_status := 'em_atendimento';
  END IF;

  UPDATE service_orders 
  SET status = v_previous_status, closed_at = NULL, customer_signature_url = NULL 
  WHERE id = v_os.id;

  INSERT INTO service_order_reopening_audit (
    service_order_id, event_type, actor_id, mandatory_reason, previous_status, resulting_status
  ) VALUES (
    v_os.id, 'direta', auth.uid(), p_reason, v_os.status, v_previous_status
  );

  RETURN json_build_object('success', true, 'action', 'reopened', 'new_status', v_previous_status);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
