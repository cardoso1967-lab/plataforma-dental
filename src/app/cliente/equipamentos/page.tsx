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
    <div className="space-y-8 text-left animate-in fade-in duration-300">
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
              className="bg-white border border-slate-200/65 rounded-xl p-5.5 shadow-[0_2px_8px_rgba(0,0,0,0.012)] space-y-4 hover:shadow-[0_12px_30px_rgba(7,10,19,0.04)] hover:border-sky-300/40 transition-all duration-300 relative overflow-hidden text-left group"
            >
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[9px] font-extrabold text-sky-600 bg-sky-50/70 border border-sky-100/50 px-2 py-0.5 rounded uppercase tracking-widest block font-mono">
                    {eq.brand || 'Fabricante N/D'}
                  </span>
                  {eq.last_maintenance_date && (
                    <span className="text-[8px] font-extrabold text-emerald-600 bg-emerald-50/50 border border-emerald-100/50 px-2 py-0.5 rounded uppercase tracking-wide block font-mono">
                      Revisado
                    </span>
                  )}
                </div>
                <h4 className="font-extrabold text-slate-800 text-sm leading-snug group-hover:text-sky-700 transition-colors">
                  {eq.name}
                </h4>
                {eq.model && (
                  <p className="text-[10px] text-slate-400 font-bold">Modelo: <span className="text-slate-500 font-mono">{eq.model}</span></p>
                )}
              </div>

              <div className="space-y-2.5 text-xs font-semibold text-slate-500 pt-3.5 border-t border-slate-100/70">
                <div className="flex items-center justify-between text-[10.5px]">
                  <span className="flex items-center gap-1.5 text-slate-400 font-bold">
                    <Tag className="w-3.5 h-3.5 text-sky-505" />
                    Nº de Série
                  </span>
                  <span className="font-mono text-slate-700 bg-slate-50 px-2 py-0.5 rounded border border-slate-200/40 shadow-[0_1px_2px_rgba(0,0,0,0.01)]">{eq.serial_number || 'N/A'}</span>
                </div>

                <div className="flex items-center justify-between text-[10.5px]">
                  <span className="flex items-center gap-1.5 text-slate-400 font-bold">
                    <Calendar className="w-3.5 h-3.5 text-sky-505" />
                    Instalação
                  </span>
                  <span className="text-slate-700 font-extrabold font-mono">
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
                    <span className="text-slate-700 font-extrabold font-mono">
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
