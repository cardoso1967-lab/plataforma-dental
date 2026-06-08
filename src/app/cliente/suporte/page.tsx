import React from 'react';
import { SupportForm } from './SupportForm';
import { Clock, AlertCircle } from 'lucide-react';
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
      created_at,
      client_equipment (
        name
      )
    `)
    .eq('customer_id', customer.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Erro ao buscar ordens de serviço:', error);
  }

  // Configuração visual de status
  const statusConfig: Record<string, { label: string; bg: string }> = {
    aberta: { label: 'Aberta', bg: 'bg-blue-50 text-blue-700 border-blue-100' },
    em_analise: { label: 'Em Análise', bg: 'bg-purple-50 text-purple-700 border-purple-100' },
    orcamento_pendente: { label: 'Orçamento Pendente', bg: 'bg-amber-50 text-amber-700 border-amber-100' },
    orcamento_aprovado: { label: 'Orçamento Aprovado', bg: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
    em_atendimento: { label: 'Em Atendimento', bg: 'bg-sky-50 text-sky-700 border-sky-100' },
    concluida: { label: 'Concluída', bg: 'bg-slate-100 text-slate-600 border-slate-200' },
    cancelada: { label: 'Cancelada', bg: 'bg-rose-50 text-rose-700 border-rose-100' },
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
          Suporte Técnico
        </h1>
        <p className="text-xs text-slate-500 font-medium">
          Abra chamados para manutenções corretivas ou preventivas nos seus equipamentos.
        </p>
      </div>

      {/* OS ativas */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          Chamados Recentes
        </h3>
        
        {!openOS || openOS.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-100 p-6 text-center shadow-xs">
            <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-500">Nenhum chamado aberto.</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Seus chamados e visitas técnicas serão exibidos aqui.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {openOS.map((os) => {
              const statusStyle = statusConfig[os.status] || {
                label: os.status,
                bg: 'bg-slate-50 text-slate-700 border-slate-200',
              };

              return (
                <div 
                  key={os.id} 
                  className="bg-white border border-slate-100 rounded-xl p-4 shadow-xs flex items-center justify-between hover:shadow-md transition-shadow"
                >
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 block">
                      OS #{os.id.slice(0, 8).toUpperCase()} | {new Date(os.created_at).toLocaleDateString('pt-BR')}
                    </span>
                    <h4 className="font-extrabold text-slate-800 text-sm">
                      {(os.client_equipment as any)?.name || 'Equipamento'}
                    </h4>
                  </div>
                  
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md border flex items-center gap-1 ${statusStyle.bg}`}>
                    <Clock className="w-3.5 h-3.5" />
                    {statusStyle.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Formulário de Abertura */}
      <SupportForm 
        equipments={myEquipments || []} 
        customerId={customer.id} 
      />
    </div>
  );
}
