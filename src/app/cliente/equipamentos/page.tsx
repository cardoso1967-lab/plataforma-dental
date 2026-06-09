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
    <div className="space-y-8 max-w-4xl mx-auto text-left animate-in fade-in duration-300">
      {/* Header Premium */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-100 pb-5">
        <div className="space-y-1 text-left">
          <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2.5">
            <div className="p-2 bg-sky-50 text-brand-clinical rounded-2xl shadow-2xs">
              <Settings className="w-6 h-6 animate-spin-slow" />
            </div>
            Meus Equipamentos
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Relação de equipamentos ativos e cadastrados no seu consultório para controle de manutenções preventivas e corretivas.
          </p>
        </div>
      </div>

      {!myEquipments || myEquipments.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-100 p-10 text-center shadow-xs space-y-4 hover:border-slate-200 transition-all duration-300">
          <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center mx-auto shadow-2xs">
            <Wrench className="w-6 h-6 text-slate-350" />
          </div>
          <div className="space-y-1">
            <p className="text-xs font-black text-slate-800">Nenhum equipamento registrado</p>
            <p className="text-[10px] text-slate-400 max-w-xs mx-auto leading-normal">
              Seus equipamentos cadastrados aparecerão aqui. Fale com seu administrador para registrar novas instalações.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid gap-4.5 sm:grid-cols-2">
          {myEquipments.map((eq) => (
            <div 
              key={eq.id}
              className="bg-white border border-slate-100/80 rounded-3xl p-5 shadow-2xs space-y-4.5 hover:shadow-md hover:scale-[1.012] transition-all duration-300 relative overflow-hidden text-left"
            >
              {/* Decoración superior sutil */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-sky-400 to-brand-clinical" />

              <div className="space-y-1 pt-1">
                <span className="text-[9px] font-extrabold text-brand-clinical uppercase tracking-widest block font-sans">
                  {eq.brand || 'Fabricante não informado'}
                </span>
                <h4 className="font-extrabold text-slate-850 text-sm leading-snug">
                  {eq.name}
                </h4>
                {eq.model && (
                  <p className="text-[10px] text-slate-400 font-bold">Modelo: {eq.model}</p>
                )}
              </div>

              <div className="space-y-2.5 text-xs font-semibold text-slate-500 pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between text-[10.5px]">
                  <span className="flex items-center gap-1.5 text-slate-400 font-bold">
                    <Tag className="w-3.5 h-3.5 text-sky-450" />
                    Nº de Série
                  </span>
                  <span className="font-mono text-slate-800 bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-100 shadow-3xs">{eq.serial_number || 'N/A'}</span>
                </div>

                <div className="flex items-center justify-between text-[10.5px]">
                  <span className="flex items-center gap-1.5 text-slate-400 font-bold">
                    <Calendar className="w-3.5 h-3.5 text-sky-450" />
                    Instalação
                  </span>
                  <span className="text-slate-800 font-bold">
                    {eq.installation_date 
                      ? new Date(eq.installation_date).toLocaleDateString('pt-BR') 
                      : 'Não informada'
                    }
                  </span>
                </div>

                {eq.last_maintenance_date && (
                  <div className="flex items-center justify-between text-[10.5px]">
                    <span className="flex items-center gap-1.5 text-slate-400 font-bold">
                      <Wrench className="w-3.5 h-3.5 text-sky-450" />
                      Última Manutenção
                    </span>
                    <span className="text-slate-800 font-bold">
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
