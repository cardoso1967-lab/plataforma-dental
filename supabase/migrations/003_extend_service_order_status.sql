-- 003_extend_service_order_status.sql
-- Extender enum service_order_status com novos estados operacionais

ALTER TYPE service_order_status ADD VALUE IF NOT EXISTS 'tecnico_atribuido';
ALTER TYPE service_order_status ADD VALUE IF NOT EXISTS 'visita_agendada';
ALTER TYPE service_order_status ADD VALUE IF NOT EXISTS 'aguardando_peca';
