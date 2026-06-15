import React from 'react';
import { SupportForm } from './SupportForm';
import { Clock, ShieldAlert, Clipboard } from 'lucide-react';
import { getCustomerSession } from '@/lib/customer-data';
import { PageHero } from '@/components/ui/PageHero';
import { EmptyState } from '@/components/ui/EmptyState';
import { StatusBadge } from '@/components/ui/StatusBadge';

// Configuração visual de status
const getStatusInfo = (status: string) => {
  const lowerStatus = (status || '').toLowerCase();
  switch (lowerStatus) {
    case 'aberta':
      return { label: 'Triagem', bg: 'bg-blue-50/50 text-blue-700 border-blue-100', color: '#0284c7', step: 1, badge: 'neutral' };
    case 'em_analise':
      return { label: 'Em análise', bg: 'bg-purple-50/50 text-purple-700 border-purple-100', color: '#7c3aed', step: 1, badge: 'indigo' };
    case 'tecnico_atribuido':
      return { label: 'Técnico atribuído', bg: 'bg-indigo-50/50 text-indigo-700 border-indigo-100', color: '#4f46e5', step: 2, badge: 'info' };
    case 'visita_agendada':
      return { label: 'Visita agendada', bg: 'bg-sky-50 text-sky-700 border-sky-100', color: '#0369a1', step: 2, badge: 'info' };
    case 'em_atendimento':
      return { label: 'Em campo', bg: 'bg-sky-500 text-white border-sky-600', color: '#0ea5e9', step: 3, badge: 'success' };
    case 'aguardando_peca':
      return { label: 'Aguardando peça', bg: 'bg-orange-50 text-orange-700 border-orange-100', color: '#ea580c', step: 3, badge: 'warning' };
    case 'orcamento_pendente':
      return { label: 'Orçamento pendente', bg: 'bg-amber-50 text-amber-700 border-amber-100', color: '#d97706', step: 4, badge: 'warning' };
    case 'orcamento_aprovado':
      return { label: 'Orçamento aprovado', bg: 'bg-emerald-50 text-emerald-700 border-emerald-100', color: '#10b981', step: 4, badge: 'success' };
    case 'concluida':
      return { label: 'Finalizado', bg: 'bg-emerald-50 text-emerald-700 border-emerald-100', color: '#059669', step: 5, badge: 'success' };
    case 'cancelada':
      return { label: 'Cancelado', bg: 'bg-rose-50 text-rose-700 border-rose-100', color: '#e11d48', step: 0, badge: 'error' };
    default:
      return { label: status || 'Triagem', bg: 'bg-slate-50 text-slate-700 border-slate-200', color: '#64748b', step: 1, badge: 'neutral' };
  }
};

const formatSafeDate = (dateStr: any) => {
  if (!dateStr) return 'Data não definida';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 'Data não definida';
    return d.toLocaleDateString('pt-BR');
  } catch (e) {
    return 'Data não definida';
  }
};

const formatSafeDateTime = (dateStr: any) => {
  if (!dateStr) return 'Data não definida';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 'Data não definida';
    return d.toLocaleString('pt-BR');
  } catch (e) {
    return 'Data não definida';
  }
};

// Nombres de los pasos en el timeline
const steps = [
  { num: 1, name: 'Triagem' },
  { num: 2, name: 'Agendado' },
  { num: 3, name: 'Em Campo' },
  { num: 4, name: 'Orçamento' },
  { num: 5, name: 'Finalizado' }
];

export default async function ClienteSuportePage() {
  const { supabase, customer } = await getCustomerSession();

  if (!customer) {
    return (
      <div className="p-8 text-center text-slate-500 bg-slate-50 border border-slate-100 rounded-xl">
        Perfil de cliente não encontrado. Entre em contato com a administração.
      </div>
    );
  }

  let myEquipments: any[] = [];
  let openOS: any[] = [];
  let queryError = false;

  // 1. Buscar os equipamentos
  try {
    const { data, error } = await supabase
      .from('client_equipment')
      .select('id, name, brand, serial_number')
      .eq('customer_id', customer.id)
      .order('name', { ascending: true });

    if (error) {
      console.error('Erro ao buscar equipamentos:', error);
      queryError = true;
    } else {
      myEquipments = data || [];
    }
  } catch (err) {
    console.error('Erro de rede ao buscar equipamentos:', err);
    queryError = true;
  }

  // 2. Buscar as Ordens de Serviço (chamados) ativas
  try {
    const { data, error } = await supabase
      .from('service_orders')
      .select(`
        id,
        status,
        priority,
        created_at,
        description,
        scheduled_date,
        client_equipment (
          name,
          brand,
          model
        ),
        service_order_status_history (
          status,
          notes,
          created_at
        )
      `)
      .eq('customer_id', customer.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar chamados:', error);
      queryError = true;
    } else {
      openOS = data || [];
    }
  } catch (err) {
    console.error('Erro de rede ao buscar chamados:', err);
    queryError = true;
  }

  const renderTicket = (os: any) => {
    if (!os) return null;
    try {
      const statusStyle = getStatusInfo(os.status);
      const isCancelado = os.status === 'cancelada';
      const currentStep = typeof statusStyle.step === 'number' ? statusStyle.step : 1;

      // Equipamento nulo-seguro
      let equipmentName = 'Equipamento Geral';
      if (os.client_equipment) {
        if (Array.isArray(os.client_equipment)) {
          equipmentName = os.client_equipment[0]?.name || 'Equipamento Geral';
        } else {
          equipmentName = (os.client_equipment as any).name || 'Equipamento Geral';
        }
      }

      // Descrição nula-segura
      const description = os.description || 'Descrição não informada';

      // Histórico nulo-seguro
      let latestHistoryNote = null;
      if (os.service_order_status_history && Array.isArray(os.service_order_status_history) && os.service_order_status_history.length > 0) {
        const sortedHistory = [...os.service_order_status_history].sort((a: any, b: any) => {
          return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
        });
        latestHistoryNote = sortedHistory[0]?.notes || null;
      }

      return (
        <div 
          key={os.id} 
          className="bg-white border border-slate-200/60 rounded-xl p-5.5 shadow-[0_2px_8px_rgba(0,0,0,0.012)] hover:shadow-[0_12px_30px_rgba(7,10,19,0.04)] hover:border-slate-350/30 transition-all duration-300 space-y-4 relative overflow-hidden text-left group"
        >
          {/* Encabezado OS */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100/70">
            <div className="text-left">
              <span className="text-[9.5px] font-mono font-black text-sky-600 bg-sky-50/50 px-2 py-0.5 rounded border border-sky-100/50 tracking-wider inline-block leading-none">
                OS: #{os.id.slice(0, 8).toUpperCase()} • {formatSafeDate(os.created_at)}
              </span>
              <h4 className="font-extrabold text-slate-800 text-sm mt-1.5 group-hover:text-sky-705 transition-colors">
                {equipmentName}
              </h4>
              <p className="text-[10.5px] text-slate-500 font-semibold italic mt-1.5 max-w-2xl line-clamp-2 leading-relaxed">
                "{description}"
              </p>
            </div>
            
            <div className="flex items-center self-start sm:self-center shrink-0">
              <StatusBadge
                label={statusStyle.label}
                type={statusStyle.badge as any}
              />
            </div>
          </div>

          {/* Data agendada da visita */}
          {os.scheduled_date && (
            <div className="bg-sky-50/40 text-sky-850 text-[10.5px] font-semibold px-4 py-2.5 rounded-xl border border-sky-100/50 inline-flex items-center gap-1.5">
              <span>Visita técnica agendada para:</span>
              <strong className="text-sky-700">{formatSafeDateTime(os.scheduled_date)}</strong>
            </div>
          )}

          {/* Visualizador Gráfico de Progreso (Timeline) */}
          {!isCancelado && (
            <div className="bg-slate-50/50 rounded-2xl p-4.5 border border-slate-100 max-w-4xl mt-3 text-left">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-4 font-mono">Status do Chamado</span>
              
              {/* Flex Horizontal para Desktop */}
              <div className="hidden sm:flex items-center justify-between w-full relative pt-2 pb-2">
                {/* Línea conectora de fondo */}
                <div className="absolute top-[21px] left-8 right-8 h-0.5 bg-slate-200/80 -z-0" />
                
                {/* Línea de progreso completado */}
                <div 
                  className="absolute top-[21px] left-8 h-0.5 bg-sky-600 transition-all duration-500 -z-0"
                  style={{ width: `${Math.max(0, Math.min(90, ((currentStep - 1) / (steps.length - 1)) * 90))}%` }}
                />

                {steps.map((st) => {
                  const isDone = currentStep >= st.num;
                  const isCurrent = currentStep === st.num;
                  
                  return (
                    <div key={st.num} className="flex flex-col items-center flex-1 relative z-10 text-center">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black border transition-all duration-300 ${
                        isCurrent 
                          ? 'bg-white text-sky-600 border-sky-600 ring-4 ring-sky-100 shadow-[0_2px_8px_rgba(2,132,199,0.15)] animate-pulse'
                          : isDone
                            ? 'bg-sky-600 text-white border-sky-600 shadow-[0_2px_6px_rgba(2,132,199,0.1)]'
                            : 'bg-white text-slate-300 border-slate-200'
                      }`}>
                        {isDone && !isCurrent ? '✓' : st.num}
                      </div>
                      
                      <span className={`text-[10px] font-extrabold mt-2 tracking-tight ${
                        isCurrent ? 'text-sky-700 font-black' : isDone ? 'text-slate-700 font-bold' : 'text-slate-400 font-semibold'
                      }`}>
                        {st.name}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Timeline Vertical para Mobile */}
              <div className="sm:hidden space-y-4 pt-1">
                {steps.map((st, idx) => {
                  const isDone = currentStep >= st.num;
                  const isCurrent = currentStep === st.num;
                  
                  return (
                    <div key={st.num} className="flex items-center gap-3 relative text-left">
                      {idx < steps.length - 1 && (
                        <div className={`absolute left-3 top-6 bottom-[-20px] w-0.5 ${isDone ? 'bg-sky-600' : 'bg-slate-200/80'}`} />
                      )}
                      
                      <div className={`w-6.5 h-6.5 rounded-full flex items-center justify-center text-[9px] font-black border z-10 transition-all duration-300 shrink-0 ${
                        isCurrent 
                          ? 'bg-white text-sky-600 border-sky-600 ring-4 ring-sky-100 shadow-[0_2px_8px_rgba(2,132,199,0.15)]'
                          : isDone
                            ? 'bg-sky-600 text-white border-sky-600 shadow-[0_2px_6px_rgba(2,132,199,0.1)]'
                            : 'bg-white text-slate-300 border-slate-200'
                      }`}>
                        {isDone && !isCurrent ? '✓' : st.num}
                      </div>
                      
                      <span className={`text-[10.5px] font-bold ${
                        isCurrent ? 'text-sky-700 font-black' : isDone ? 'text-slate-700' : 'text-slate-400 font-semibold'
                      }`}>
                        {st.name}
                      </span>
                    </div>
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

          {/* Última atualização do técnico (Histórico) */}
          {latestHistoryNote && (
            <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-100 text-[11px] text-slate-600 font-medium leading-relaxed mt-2">
              <strong className="text-slate-700 block mb-1">Última atualização do técnico:</strong>
              "{latestHistoryNote}"
            </div>
          )}
        </div>
      );
    } catch (renderErr) {
      console.error('Erro ao renderizar chamado:', renderErr, os);
      return (
        <div 
          key={os?.id || Math.random().toString()} 
          className="bg-white border border-slate-200/60 rounded-xl p-5 shadow-[0_2px_8px_rgba(0,0,0,0.012)] space-y-3 text-left"
        >
          <div className="pb-3 border-b border-slate-100 flex justify-between items-center">
            <div>
              <span className="text-[9.5px] font-mono font-black text-sky-600 bg-sky-50 px-2 py-0.5 rounded">
                OS: #{String(os?.id || '').slice(0, 8).toUpperCase()}
              </span>
              <h4 className="font-extrabold text-slate-800 text-sm mt-1">
                Equipamento Geral
              </h4>
            </div>
            <StatusBadge label={os?.status || 'aberta'} type="neutral" />
          </div>
          <p className="text-[10.5px] text-slate-500 font-semibold italic">
            "{os?.description || 'Descrição não informada'}"
          </p>
          <div className="bg-amber-50 border border-amber-100 text-amber-700 text-[10px] font-semibold p-3 rounded-xl">
            Não foi possível carregar todos os detalhes do chamado, mas o acompanhamento principal continua disponível.
          </div>
        </div>
      );
    }
  };

  return (
    <div className="space-y-8 text-left animate-in fade-in duration-300">
      {/* Header Premium */}
      <PageHero
        title="Suporte Técnico"
        description="Acompanhe suas solicitações de reparo em tempo real e abra novos chamados para seus equipamentos odontológicos."
        badge="Suporte"
        icon={Clock}
        variant="compact"
      />

      {/* Alerta de erro de query parcial se houver */}
      {queryError && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-semibold p-4 rounded-xl flex items-center gap-2">
          <span>Não foi possível carregar todos os detalhes do chamado, mas o acompanhamento principal continua disponível.</span>
        </div>
      )}

      {/* OS ativas */}
      <div className="space-y-4.5">
        <h3 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest pl-1 font-sans">
          Acompanhamento de Chamados e Visitas ({openOS?.length || 0})
        </h3>
        
        {!openOS || openOS.length === 0 ? (
          <EmptyState
            title="Nenhum chamado aberto"
            description="Todos os seus chamados de manutenção e visitas preventivas estão concluídos. Use o formulário abaixo para abrir uma nova solicitação técnica."
            icon={<Clipboard className="w-6 h-6 text-sky-655" />}
            variant="panel"
          />
        ) : (
          <div className="space-y-5">
             {openOS.map((os) => renderTicket(os))}
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

