-- 005_fix_service_order_status_history_rls.sql
-- Corrige a política de INSERT do histórico de status para permitir
-- que clientes registrem o histórico inicial ao abrir um chamado.

-- Remove a política anterior (apenas admin/suporte/tecnico)
DROP POLICY IF EXISTS "Gravar no histórico" ON service_order_status_history;

-- Recria a política com permissão para o cliente que criou a OS
CREATE POLICY "Gravar no histórico" ON service_order_status_history
  FOR INSERT WITH CHECK (
    check_is_admin() OR check_is_soporte() OR
    EXISTS (
      SELECT 1 FROM service_orders
      WHERE service_orders.id = service_order_status_history.service_order_id
      AND (
        service_orders.technician_id = get_my_technician_id()
        OR service_orders.customer_id = get_my_customer_id()
      )
    )
  );
