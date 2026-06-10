import React from 'react';
import { SupportForm } from './SupportForm';
import { Clock, ShieldAlert, Clipboard } from 'lucide-react';
import { getCustomerSession } from '@/lib/customer-data';
import { PageHero } from '@/components/ui/PageHero';
import { EmptyState } from '@/components/ui/EmptyState';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { TimelineStep } from '@/components/ui/TimelineStep';

export default async function ClienteSuportePage() {
  const { supabase, customer } = await getCustomerSession();

  // 1. Buscar os equipamentos para popular o formulário de suporte
  const { data: myEquipments } = await supabase
    .from('client_equipment')
    .select('id, name, brand, serial_number')
    .eq('customer_id', customer.id)
    .order('name', { ascending: true });

  // 2. Buscar as Ordens de Serviço (chamados) ativas
  const { data: openOS, error } = await supabase
    .from('service_orders')
    .select(`
      id,
      status,
      priority,
      created_at,
      description,
      client_equipment (
        name,
        brand,
        model
      )
    `)
    .eq('customer_id', customer.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Erro ao buscar ordens de serviço:', error);
  }

  // Configuração visual de status
  const statusConfig: Record<string, { label: string; bg: string; color: string; step: number }> = {
    aberta: { label: 'Recebido', bg: 'bg-blue-50/50 text-blue-700 border-blue-100', color: '#0284c7', step: 1 },
    em_analise: { label: 'Triagem', bg: 'bg-purple-50/50 text-purple-700 border-purple-100', color: '#7c3aed', step: 1 },
    tecnico_atribuido: { label: 'Técnico Designado', bg: 'bg-indigo-50/50 text-indigo-700 border-indigo-100', color: '#4f46e5', step: 2 },
    visita_agendada: { label: 'Visita Agendada', bg: 'bg-sky-50 text-sky-700 border-sky-100', color: '#0369a1', step: 2 },
    em_atendimento: { label: 'Em Atendimento', bg: 'bg-sky-500 text-white border-sky-600', color: '#0ea5e9', step: 3 },
    aguardando_peca: { label: 'Aguardando Peça', bg: 'bg-orange-50 text-orange-700 border-orange-100', color: '#ea580c', step: 3 },
    orcamento_pendente: { label: 'Aguardando Aprovação', bg: 'bg-amber-50 text-amber-700 border-amber-100', color: '#d97706', step: 4 },
    concluida: { label: 'Concluído', bg: 'bg-emerald-50 text-emerald-700 border-emerald-100', color: '#059669', step: 5 },
    cancelada: { label: 'Cancelado', bg: 'bg-rose-50 text-rose-700 border-rose-100', color: '#e11d48', step: 0 },
  };

  // Nombres de los pasos en el timeline
  const steps = [
    { num: 1, name: 'Triagem' },
    { num: 2, name: 'Agendado' },
    { num: 3, name: 'Em Campo' },
    { num: 4, name: 'Orçamento' },
    { num: 5, name: 'Finalizado' }
  ];

  return (
    <div className="space-y-8 max-w-4xl mx-auto text-left animate-in fade-in duration-300">
      {/* Header Premium */}
      <PageHero
        title="Suporte Técnico"
        description="Acompanhe suas solicitações de reparo em tempo real e abra novos chamados para seus equipamentos odontológicos."
        badge="Suporte"
        icon={Clock}
      />

      {/* OS ativas */}
      <div className="space-y-4.5">
        <h3 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest pl-1 font-sans">
          Acompanhamento de Chamados e Visitas ({openOS?.length || 0})
        </h3>
        
        {!openOS || openOS.length === 0 ? (
          <EmptyState
            title="Nenhum chamado aberto"
            description="Todos os seus chamados de manutenção e visitas preventivas estão concluídos. Use o formulário abaixo para abrir uma nova solicitação técnica."
            icon={<Clipboard className="w-6 h-6 text-sky-650" />}
          />
        ) : (
          <div className="space-y-5">
             {openOS.map((os) => {
              const statusStyle = statusConfig[os.status] || {
                label: os.status,
                bg: 'bg-slate-50 text-slate-700 border-slate-200',
                color: '#64748b',
                step: 1
              };

              const getStatusBadgeType = (status: string) => {
                switch (status) {
                  case 'aberta': return 'neutral';
                  case 'em_analise': return 'indigo';
                  case 'tecnico_atribuido': return 'info';
                  case 'visita_agendada': return 'info';
                  case 'em_atendimento': return 'success';
                  case 'aguardando_peca': return 'warning';
                  case 'orcamento_pendente': return 'warning';
                  case 'concluida': return 'success';
                  case 'cancelada': return 'error';
                  default: return 'neutral';
                }
              };

              const currentStep = statusStyle.step;
              const isCancelado = os.status === 'cancelada';

              return (
                <div 
                  key={os.id} 
                  className="bg-white border border-slate-200/60 rounded-xl p-5.5 shadow-[0_2px_8px_rgba(0,0,0,0.012)] hover:shadow-[0_12px_30px_rgba(7,10,19,0.04)] hover:border-slate-350/30 transition-all duration-300 space-y-4 relative overflow-hidden text-left group"
                >
                  {/* Encabezado OS */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100/70">
                    <div className="text-left">
                      <span className="text-[9.5px] font-mono font-black text-sky-600 bg-sky-50/50 px-2 py-0.5 rounded border border-sky-100/50 tracking-wider inline-block leading-none">
                        OS: #{os.id.slice(0, 8).toUpperCase()} • {new Date(os.created_at).toLocaleDateString('pt-BR')}
                      </span>
                      <h4 className="font-extrabold text-slate-800 text-sm mt-1.5 group-hover:text-sky-705 transition-colors">
                        {(os.client_equipment as any)?.name || 'Equipamento Geral'}
                      </h4>
                      {os.description && (
                        <p className="text-[10.5px] text-slate-500 font-semibold italic mt-1.5 max-w-2xl line-clamp-2 leading-relaxed">
                          "{os.description}"
                        </p>
                      )}
                    </div>
                    
                    <div className="flex items-center self-start sm:self-center shrink-0">
                      <StatusBadge
                        label={statusStyle.label}
                        type={getStatusBadgeType(os.status)}
                      />
                    </div>
                  </div>

                  {/* Visualizador Gráfico de Progreso (Timeline) Premium */}
                  {!isCancelado && (
                    <div className="bg-slate-50/40 rounded-xl p-5 border border-slate-150/40 mt-1 max-w-xl shadow-[inset_0_1px_2px_rgba(0,0,0,0.015)]">
                      <div className="space-y-0">
                        {steps.map((st, idx) => {
                          const isDone = currentStep >= st.num;
                          const isCurrent = currentStep === st.num;
                          
                          let statusVal: 'completed' | 'active' | 'upcoming' = 'upcoming';
                          if (isCurrent) statusVal = 'active';
                          else if (isDone) statusVal = 'completed';

                          return (
                            <TimelineStep
                              key={st.num}
                              label={st.name}
                              status={statusVal}
                              isLast={idx === steps.length - 1}
                              icon={<span className="text-[9px] font-black">{st.num}</span>}
                              description={isCurrent ? `Fase atual do seu chamado técnico.` : undefined}
                            />
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {isCancelado && (
                    <div className="bg-rose-50/40 text-rose-800 text-[10.5px] font-bold p-4 rounded-xl border border-rose-100/50 flex items-center gap-2">
                      <ShieldAlert className="w-4.5 h-4.5 text-rose-550 flex-shrink-0" />
                      <span>Este chamado foi cancelado. Entre em contato com a administração caso julgue necessário.</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Formulário de Abertura */}
      <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-xs text-left">
        <h3 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest pl-1 mb-4 font-sans">
          Solicitar Nova Assistência Técnica
        </h3>
        <SupportForm 
          equipments={myEquipments || []} 
          customerId={customer.id} 
        />
      </div>
    </div>
  );
}
