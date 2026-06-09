import React from 'react';
import { Wrench, Calendar, Tag, AlertCircle, Shield, Settings } from 'lucide-react';
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
    <div className="space-y-6 max-w-4xl mx-auto text-left">
      <div className="space-y-1">
        <h1 className="text-2xl font-extrabold text-brand-dark tracking-tight flex items-center gap-2">
          <Settings className="w-7 h-7 text-brand-clinical" />
          Meus Equipamentos
        </h1>
        <p className="text-xs text-slate-500 font-medium">
          Relação de equipamentos ativos e cadastrados no seu consultório para controle de manutenções preventivas e corretivas.
        </p>
      </div>

      {!myEquipments || myEquipments.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-10 text-center shadow-xs space-y-4">
          <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto">
            <Wrench className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <p className="text-xs font-extrabold text-brand-dark">Nenhum equipamento registrado</p>
            <p className="text-[10px] text-slate-400 max-w-xs mx-auto">
              Seus equipamentos cadastrados aparecerão aqui. Fale com seu administrador para registrar novas instalações.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {myEquipments.map((eq) => (
            <div 
              key={eq.id}
              className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs space-y-4 hover:shadow-md hover:scale-[1.01] transition-all duration-300 relative overflow-hidden"
            >
              {/* Decoración superior sutil */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-sky-400 to-brand-clinical" />

              <div className="space-y-1 pt-1">
                <span className="text-[9px] font-extrabold text-brand-clinical uppercase tracking-widest block">
                  {eq.brand || 'Fabricante não informado'}
                </span>
                <h4 className="font-extrabold text-brand-dark text-base leading-snug">
                  {eq.name}
                </h4>
                {eq.model && (
                  <p className="text-[11px] text-slate-400 font-semibold">Modelo: {eq.model}</p>
                )}
              </div>

              <div className="space-y-2 text-xs font-semibold text-slate-500 pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="flex items-center gap-1.5 text-slate-400">
                    <Tag className="w-3.5 h-3.5" />
                    Nº de Série
                  </span>
                  <span className="font-mono text-slate-700 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">{eq.serial_number || 'N/A'}</span>
                </div>

                <div className="flex items-center justify-between text-[11px]">
                  <span className="flex items-center gap-1.5 text-slate-400">
                    <Calendar className="w-3.5 h-3.5" />
                    Instalação
                  </span>
                  <span className="text-slate-700">
                    {eq.installation_date 
                      ? new Date(eq.installation_date).toLocaleDateString('pt-BR') 
                      : 'Não informada'
                    }
                  </span>
                </div>

                {eq.last_maintenance_date && (
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="flex items-center gap-1.5 text-slate-400">
                      <Wrench className="w-3.5 h-3.5" />
                      Última Manutenção
                    </span>
                    <span className="text-slate-700">
                      {new Date(eq.last_maintenance_date).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
