import React from 'react';
import { Wrench, Calendar, Tag, Settings } from 'lucide-react';
import { getCustomerSession } from '@/lib/customer-data';
import { PageHero } from '@/components/ui/PageHero';
import { EmptyState } from '@/components/ui/EmptyState';

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
      <PageHero
        title="Meus Equipamentos"
        description="Relação de equipamentos ativos e cadastrados no seu consultório para controle de manutenções preventivas e corretivas."
        badge="Equipamentos"
        icon={Settings}
      />

      {!myEquipments || myEquipments.length === 0 ? (
        <EmptyState
          title="Nenhum equipamento registrado"
          description="Não há nenhum equipamento odontológico ativado em seu consultório ainda. Fale com seu administrador para registrar novas instalações."
          icon={<Wrench className="w-6 h-6 text-sky-650" />}
          actionLabel="Falar com Administrador"
          actionHref="/cliente/suporte"
        />
      ) : (
        <div className="grid gap-4.5 sm:grid-cols-2">
          {myEquipments.map((eq) => (
            <div 
              key={eq.id}
              className="bg-white border border-slate-100/80 rounded-3xl p-5 shadow-2xs space-y-4.5 hover:shadow-md hover:scale-[1.012] transition-all duration-300 relative overflow-hidden text-left"
            >
              {/* Decoración superior sutil */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-sky-400 to-sky-600" />

              <div className="space-y-1 pt-1">
                <span className="text-[9px] font-extrabold text-sky-600 uppercase tracking-widest block font-sans">
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
                    <Tag className="w-3.5 h-3.5 text-sky-500" />
                    Nº de Série
                  </span>
                  <span className="font-mono text-slate-850 bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-100 shadow-3xs">{eq.serial_number || 'N/A'}</span>
                </div>

                <div className="flex items-center justify-between text-[10.5px]">
                  <span className="flex items-center gap-1.5 text-slate-400 font-bold">
                    <Calendar className="w-3.5 h-3.5 text-sky-500" />
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
                      <Wrench className="w-3.5 h-3.5 text-sky-505" />
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
