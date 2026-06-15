/**
 * service-orders.ts
 * Funções utilitárias para mutações de Ordens de Serviço.
 * Centraliza updates de status, histórico e agendamentos.
 */

import type { SupabaseClient } from '@supabase/supabase-js';

export type ServiceOrderStatus =
  | 'aberta'
  | 'em_analise'
  | 'tecnico_atribuido'
  | 'visita_agendada'
  | 'em_atendimento'
  | 'aguardando_peca'
  | 'orcamento_pendente'
  | 'orcamento_aprovado'
  | 'concluida'
  | 'cancelada';

export const STATUS_LABELS: Record<string, string> = {
  aberta: 'Solicitação recebida',
  em_analise: 'Em triagem',
  tecnico_atribuido: 'Técnico atribuído',
  visita_agendada: 'Visita agendada',
  em_atendimento: 'Em atendimento',
  aguardando_peca: 'Aguardando peça',
  orcamento_pendente: 'Aguardando aprovação',
  orcamento_aprovado: 'Orçamento aprovado',
  concluida: 'Concluído',
  cancelada: 'Cancelado',
};

/**
 * Atualiza o status de uma OS e registra o histórico.
 */
export async function updateServiceOrderStatus(
  supabase: SupabaseClient,
  osId: string,
  newStatus: string,
  changedBy: string,
  notes?: string
): Promise<{ error: string | null }> {
  const { error: updateError } = await supabase
    .from('service_orders')
    .update({ status: newStatus })
    .eq('id', osId);

  if (updateError) return { error: updateError.message };

  const { error: histError } = await supabase
    .from('service_order_status_history')
    .insert({
      service_order_id: osId,
      status: newStatus,
      changed_by: changedBy,
      notes: notes || `Status alterado para "${STATUS_LABELS[newStatus] || newStatus}".`,
    });

  if (histError) {
    console.error('Erro ao registrar histórico de status:', histError.message);
  }

  return { error: null };
}

/**
 * Atribui técnico a uma OS.
 * Atualiza status para 'tecnico_atribuido' se ainda estava em 'aberta' ou 'em_analise'.
 */
export async function assignTechnicianToOS(
  supabase: SupabaseClient,
  osId: string,
  technicianId: string,
  changedBy: string,
  currentStatus: string
): Promise<{ error: string | null }> {
  let newStatus = currentStatus;
  if (currentStatus === 'aberta' || currentStatus === 'em_analise') {
    newStatus = 'tecnico_atribuido';
  }

  const { error: updateError } = await supabase
    .from('service_orders')
    .update({ technician_id: technicianId, status: newStatus })
    .eq('id', osId);

  if (updateError) return { error: updateError.message };

  if (newStatus !== currentStatus) {
    const { error: histError } = await supabase
      .from('service_order_status_history')
      .insert({
        service_order_id: osId,
        status: newStatus,
        changed_by: changedBy,
        notes: 'Técnico atribuído com sucesso.',
      });

    if (histError) {
      console.error('Erro ao registrar histórico:', histError.message);
    }
  }

  return { error: null };
}

/**
 * Agenda uma visita para a OS.
 * Atualiza status para 'visita_agendada' se aplicável.
 */
export async function scheduleOSVisit(
  supabase: SupabaseClient,
  osId: string,
  scheduledDate: string,
  changedBy: string,
  currentStatus: string,
  technicianId?: string | null
): Promise<{ error: string | null }> {
  const isoDate = scheduledDate ? new Date(scheduledDate).toISOString() : null;

  let newStatus = currentStatus;
  if (
    currentStatus === 'aberta' ||
    currentStatus === 'em_analise' ||
    currentStatus === 'tecnico_atribuido'
  ) {
    newStatus = 'visita_agendada';
  }

  const { error: updateError } = await supabase
    .from('service_orders')
    .update({ scheduled_date: isoDate, status: newStatus })
    .eq('id', osId);

  if (updateError) return { error: updateError.message };

  if (newStatus !== currentStatus) {
    const { error: histError } = await supabase
      .from('service_order_status_history')
      .insert({
        service_order_id: osId,
        status: newStatus,
        changed_by: changedBy,
        notes: `Visita agendada para ${isoDate ? new Date(isoDate).toLocaleString('pt-BR') : 'data não definida'}.`,
      });

    if (histError) {
      console.error('Erro ao registrar histórico:', histError.message);
    }
  }

  // Criar agendamento na tabela appointments se técnico atribuído
  if (technicianId && isoDate) {
    const endTime = new Date(isoDate);
    endTime.setHours(endTime.getHours() + 2); // duração padrão 2h

    await supabase.from('appointments').insert({
      technician_id: technicianId,
      service_order_id: osId,
      status: 'agendado',
      start_time: isoDate,
      end_time: endTime.toISOString(),
      notes: `Visita agendada para OS #${osId.slice(0, 8).toUpperCase()}.`,
    });
  }

  return { error: null };
}
