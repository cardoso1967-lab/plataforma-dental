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
    <div className="space-y-8 max-w-4xl mx-auto text-left animate-in fade-in duration-300">
      {/* Header Premium */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-100 pb-5">
        <div className="space-y-1 text-left">
          <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2.5">
            <div className="p-2 bg-sky-50 text-brand-clinical rounded-2xl shadow-2xs">
              <Clock className="w-6 h-6 animate-pulse" />
            </div>
            Suporte Técnico
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Acompanhe suas solicitações de reparo e abra novos chamados para seus equipamentos odontológicos.
          </p>
        </div>
      </div>

      {/* OS ativas */}
      <div className="space-y-4.5">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider pl-1">
          Acompanhamento de Chamados e Visitas ({openOS?.length || 0})
        </h3>
        
        {!openOS || openOS.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-100 p-10 text-center shadow-xs space-y-4 hover:border-slate-200 transition-all duration-300">
            <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center mx-auto shadow-2xs">
              <Clock className="w-6 h-6 text-slate-350" />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-black text-slate-800">Nenhum chamado aberto</p>
              <p className="text-[10px] text-slate-400 mt-0.5 max-w-xs mx-auto leading-normal">Reporte falhas no formulário abaixo para acionar a equipe técnica.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
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
                  className="bg-white border border-slate-100/80 rounded-3xl p-6 shadow-2xs hover:shadow-xs hover:border-slate-200 transition-all duration-300 space-y-5 relative overflow-hidden text-left"
                >
                  {/* Encabezado OS */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-50">
                    <div className="text-left">
                      <span className="text-[9.5px] font-mono font-black text-brand-clinical tracking-wider block">
                        OS: #{os.id.slice(0, 8).toUpperCase()} • Abertura: {new Date(os.created_at).toLocaleDateString('pt-BR')}
                      </span>
                      <h4 className="font-extrabold text-slate-800 text-sm mt-0.5">
                        {(os.client_equipment as any)?.name || 'Equipamento Geral'}
                      </h4>
                      {os.description && (
                        <p className="text-[10.5px] text-slate-450 font-semibold italic mt-1 max-w-2xl line-clamp-2 leading-relaxed">
                          "{os.description}"
                        </p>
                      )}
                    </div>
                    
                    <div className="flex items-center self-start sm:self-center">
                      <span className={`text-[9px] font-black px-3 py-1 rounded-full border flex items-center gap-1.5 uppercase tracking-wider shadow-3xs ${statusStyle.bg}`}>
                        <Clock className="w-3.5 h-3.5" />
                        {statusStyle.label}
                      </span>
                    </div>
                  </div>

                  {/* Visualizador Gráfico de Progreso (Timeline) Premium */}
                  {!isCancelado && (
                    <div className="bg-slate-50/40 rounded-2xl p-5 border border-slate-100/50 mt-2">
                      <div className="relative">
                        {/* Barra de fondo */}
                        <div className="absolute top-3 left-0 right-0 h-1 bg-slate-200 rounded-full" />
                        
                        {/* Barra de progreso activa */}
                        <div 
                          className="absolute top-3 left-0 h-1 bg-brand-clinical rounded-full transition-all duration-550" 
                          style={{ width: `${Math.max(0, ((currentStep - 1) / 4) * 100)}%` }}
                        />
                        
                        {/* Nodos */}
                        <div className="relative flex justify-between">
                          {steps.map((st) => {
                            const isDone = currentStep >= st.num;
                            const isCurrent = currentStep === st.num;
                            
                            return (
                              <div key={st.num} className="flex flex-col items-center space-y-2.5">
                                <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all z-10 shadow-3xs ${
                                  isDone 
                                    ? 'bg-brand-clinical border-brand-clinical text-white' 
                                    : 'bg-white border-slate-200 text-slate-350'
                                } ${isCurrent ? 'ring-4 ring-sky-100 scale-105 font-black' : ''}`}>
                                  {isDone && st.num < currentStep ? (
                                    <CheckCircle2 className="w-4.5 h-4.5 text-white" />
                                  ) : (
                                    <span className="text-[10px] font-bold">{st.num}</span>
                                  )}
                                </div>
                                <span className={`text-[9px] font-black tracking-tight ${
                                  isCurrent 
                                    ? 'text-brand-clinical' 
                                    : isDone 
                                      ? 'text-slate-700' 
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
                    <div className="bg-rose-50 text-rose-800 text-[10.5px] font-bold p-4 rounded-2xl border border-rose-100 flex items-center gap-2">
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
      <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-xs text-left">
        <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider mb-4 pl-1">
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
