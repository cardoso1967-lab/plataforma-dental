import React from 'react';
import { SupportForm } from './SupportForm';
import { Clock, AlertCircle, CheckCircle2, ShieldAlert, ArrowRight, Clipboard } from 'lucide-react';
import { getCustomerSession } from '@/lib/customer-data';

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
    <div className="space-y-8 max-w-4xl mx-auto text-left">
      <div className="space-y-1">
        <h1 className="text-2xl font-extrabold text-brand-dark tracking-tight flex items-center gap-2">
          <Clock className="w-7 h-7 text-brand-clinical" />
          Suporte Técnico
        </h1>
        <p className="text-xs text-slate-500 font-medium">
          Acompanhe suas solicitações de reparo e abra novos chamados para seus equipamentos odontológicos.
        </p>
      </div>

      {/* OS ativas */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          Acompanhamento de Chamados e Visitas ({openOS?.length || 0})
        </h3>
        
        {!openOS || openOS.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center shadow-xs space-y-3">
            <Clock className="w-10 h-10 text-slate-300 mx-auto" />
            <div>
              <p className="text-xs font-extrabold text-brand-dark">Nenhum chamado aberto</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Reporte falhas no formulário abaixo para acionar a equipe técnica.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {openOS.map((os) => {
              const statusStyle = statusConfig[os.status] || {
                label: os.status,
                bg: 'bg-slate-50 text-slate-700 border-slate-200',
                color: '#64748b',
                step: 1
              };

              const currentStep = statusStyle.step;
              const isCancelado = os.status === 'cancelada';

              return (
                <div 
                  key={os.id} 
                  className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all space-y-4 relative overflow-hidden text-left"
                >
                  {/* Encabezado OS */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-mono font-bold text-slate-400">
                        OS: #{os.id.slice(0, 8).toUpperCase()} | Abertura: {new Date(os.created_at).toLocaleDateString('pt-BR')}
                      </span>
                      <h4 className="font-extrabold text-brand-dark text-base">
                        {(os.client_equipment as any)?.name || 'Equipamento Geral'}
                      </h4>
                      {os.description && (
                        <p className="text-[11px] text-slate-400 font-medium italic mt-0.5 max-w-2xl line-clamp-1">
                          "{os.description}"
                        </p>
                      )}
                    </div>
                    
                    <div className="flex items-center self-start sm:self-center">
                      <span className={`text-[9px] font-extrabold px-2.5 py-1 rounded-full border flex items-center gap-1.5 uppercase tracking-wider ${statusStyle.bg}`}>
                        <Clock className="w-3.5 h-3.5" />
                        {statusStyle.label}
                      </span>
                    </div>
                  </div>

                  {/* Visualizador Gráfico de Progreso (Timeline) */}
                  {!isCancelado && (
                    <div className="bg-slate-50/50 rounded-xl p-4 border border-slate-100/50 mt-2">
                      <div className="relative">
                        {/* Barra de fondo */}
                        <div className="absolute top-2.5 left-0 right-0 h-1 bg-slate-200 rounded-full" />
                        
                        {/* Barra de progreso activa */}
                        <div 
                          className="absolute top-2.5 left-0 h-1 bg-brand-clinical rounded-full transition-all duration-500" 
                          style={{ width: `${Math.max(0, ((currentStep - 1) / 4) * 100)}%` }}
                        />
                        
                        {/* Nodos */}
                        <div className="relative flex justify-between">
                          {steps.map((st) => {
                            const isDone = currentStep >= st.num;
                            const isCurrent = currentStep === st.num;
                            
                            return (
                              <div key={st.num} className="flex flex-col items-center space-y-2">
                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all z-10 ${
                                  isDone 
                                    ? 'bg-brand-clinical border-brand-clinical text-white shadow-xs' 
                                    : 'bg-white border-slate-200 text-slate-300'
                                } ${isCurrent ? 'ring-4 ring-sky-100 animate-pulse scale-105' : ''}`}>
                                  {isDone && st.num < currentStep ? (
                                    <CheckCircle2 className="w-4 h-4 text-white" />
                                  ) : (
                                    <span className="text-[10px] font-bold">{st.num}</span>
                                  )}
                                </div>
                                <span className={`text-[9px] font-bold tracking-tight ${
                                  isCurrent 
                                    ? 'text-brand-clinical font-black' 
                                    : isDone 
                                      ? 'text-slate-800' 
                                      : 'text-slate-400'
                                }`}>
                                  {st.name}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {isCancelado && (
                    <div className="bg-rose-50 text-rose-800 text-[11px] font-semibold p-3.5 rounded-xl border border-rose-100 flex items-center gap-2">
                      <ShieldAlert className="w-4.5 h-4.5 text-rose-500 flex-shrink-0" />
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
      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-xs">
        <h3 className="text-sm font-extrabold text-brand-dark uppercase tracking-wider mb-4">
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
