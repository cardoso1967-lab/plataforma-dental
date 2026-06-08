import React from 'react';
import { Wrench, Calendar, Tag, AlertCircle } from 'lucide-react';
import { getCustomerSession } from '@/lib/customer-data';

export default async function ClienteEquipamentosPage() {
  const { supabase, customer } = await getCustomerSession();

  // Buscar todos os equipamentos ativos instalados para este cliente
  const { data: myEquipments, error } = await supabase
    .from('client_equipment')
    .select('*')
    .eq('customer_id', customer.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Erro ao buscar equipamentos:', error);
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
          Meus Equipamentos
        </h1>
        <p className="text-xs text-slate-500 font-medium">
          Lista de equipamentos ativos instalados no seu consultório para controle de manutenção.
        </p>
      </div>

      {!myEquipments || myEquipments.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-100 p-8 text-center shadow-xs">
          <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-xs font-semibold text-slate-500">Nenhum equipamento registrado.</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Seus novos equipamentos aparecerão aqui assim que instalados.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {myEquipments.map((eq) => (
            <div 
              key={eq.id}
              className="bg-white border border-slate-100 rounded-xl p-4 shadow-xs space-y-3 hover:shadow-md transition-shadow"
            >
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-sky-500 uppercase tracking-wider block">
                  {eq.brand || 'Marca não informada'}
                </span>
                <h4 className="font-extrabold text-slate-900 text-sm leading-snug">
                  {eq.name}
                </h4>
                {eq.model && (
                  <p className="text-[10px] text-slate-400 font-medium">Modelo: {eq.model}</p>
                )}
              </div>

              <div className="space-y-2 text-xs font-semibold text-slate-500 pt-2 border-t border-slate-50">
                <p className="flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-slate-400" />
                  <span>Nº de Série: <strong className="text-slate-800">{eq.serial_number || 'N/A'}</strong></span>
                </p>
                <p className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>Instalação: <strong className="text-slate-800">
                    {eq.installation_date 
                      ? new Date(eq.installation_date).toLocaleDateString('pt-BR') 
                      : 'N/A'
                    }
                  </strong></span>
                </p>
                {eq.last_maintenance_date && (
                  <p className="flex items-center gap-1.5">
                    <Wrench className="w-3.5 h-3.5 text-slate-400" />
                    <span>Última Manutenção: <strong className="text-slate-800">
                      {new Date(eq.last_maintenance_date).toLocaleDateString('pt-BR')}
                    </strong></span>
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
