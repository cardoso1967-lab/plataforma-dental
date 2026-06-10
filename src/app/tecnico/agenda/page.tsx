'use client';

import React, { useEffect, useState } from 'react';
import { 
  Calendar, Clock, MapPin, Phone, RefreshCw, 
  Wrench, ChevronRight
} from 'lucide-react';
import Link from 'next/link';
import { createSupabaseBrowserClient } from '@/lib/supabase';
import { useAuth } from '@/components/AuthProvider';

import { PageHero } from '@/components/ui/PageHero';
import { EmptyState } from '@/components/ui/EmptyState';
import { PremiumButton } from '@/components/ui/PremiumButton';
import { StatusBadge } from '@/components/ui/StatusBadge';

export default function TecnicoAgendaPage() {
  const supabase = createSupabaseBrowserClient();
  const { profile } = useAuth();

  const [loading, setLoading] = useState(true);
  const [technician, setTechnician] = useState<any>(null);
  const [todaySchedule, setTodaySchedule] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const loadAgendaData = async () => {
    if (!profile?.id) return;
    try {
      setLoading(true);
      setError(null);

      // 1. Obtener técnico
      const { data: techData, error: techError } = await supabase
        .from('technicians')
        .select('id')
        .eq('profile_id', profile.id)
        .maybeSingle();

      if (techError) throw techError;
      if (!techData) {
        setTechnician(null);
        setLoading(false);
        return;
      }
      setTechnician(techData);

      // 2. Obtener órdenes de servicio con fecha de hoy
      const { data: osData, error: osError } = await supabase
        .from('service_orders')
        .select(`
          *,
          customer:customers(
            id, company_name, trade_name, phone,
            address_street, address_number, address_complement, 
            address_neighborhood, address_city, address_state, address_zip
          ),
          equipment:client_equipment(id, name, brand, model, serial_number)
        `)
        .eq('technician_id', techData.id)
        .order('scheduled_date', { ascending: true });

      if (osError) throw osError;

      const allOS = osData || [];
      const todayStr = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD local

      // Filtrar por hoy y que no estén canceladas
      const todayVisits = allOS.filter(os => {
        if (!os.scheduled_date) return false;
        const osDateStr = new Date(os.scheduled_date).toLocaleDateString('en-CA');
        return osDateStr === todayStr && os.status !== 'cancelada';
      });

      setTodaySchedule(todayVisits);

    } catch (err: any) {
      console.error('Erro ao carregar agenda:', err);
      setError(err.message || 'Erro ao carregar dados da agenda de hoje.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAgendaData();
  }, [profile]);

  const getStatusBadgeType = (status: string) => {
    switch (status) {
      case 'em_atendimento': return 'success';
      case 'concluida': return 'success';
      case 'aguardando_peca': return 'warning';
      case 'cancelada': return 'error';
      default: return 'neutral';
    }
  };

  const getStatusLabel = (status: string) => {
    const map: Record<string, string> = {
      aberta: 'Solicitação recebida',
      em_analise: 'Em triagem',
      tecnico_atribuido: 'Técnico designado',
      visita_agendada: 'Visita agendada',
      em_atendimento: 'Em atendimento',
      aguardando_peca: 'Aguardando peça',
      orcamento_pendente: 'Aguardando aprovação',
      concluida: 'Concluído',
      cancelada: 'Cancelado',
    };
    return map[status] || status;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-400 font-medium text-xs gap-3">
        <RefreshCw className="w-8 h-8 text-sky-650 animate-spin" />
        Carregando seu roteiro de hoje...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs font-semibold text-left">
        {error}
      </div>
    );
  }

  if (!technician) {
    return (
      <div className="text-center py-16 px-6 max-w-sm mx-auto bg-white border border-slate-200/60 rounded-xl p-6 mt-10 shadow-sm text-left animate-in fade-in duration-300">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-450">
          <Calendar className="w-8 h-8" />
        </div>
        <h2 className="text-base font-extrabold text-slate-800">Agenda Restrita</h2>
        <p className="text-xs text-slate-500 font-medium leading-relaxed mt-2 font-sans">
          Sua conta de usuário não possui vinculação operacional de campo ativa.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-left animate-in fade-in duration-300">
      {/* Header */}
      <PageHero
        title="Minha Agenda"
        description="Roteiro cronológico de visitas e manutenções preventivas designadas para hoje."
        badge="Agenda"
        icon={Calendar}
        variant="compact"
      />

      {/* Roteiro */}
      <div className="space-y-4">
        {todaySchedule.length === 0 ? (
          <EmptyState
            title="Nenhuma visita hoje"
            description="Você não possui atendimentos agendados ou visitas na sua rota para a data de hoje."
            icon={<Calendar className="w-6 h-6 text-sky-655" />}
            actionLabel="Ver Todas as OS"
            actionHref="/tecnico/servicos"
            variant="panel"
          />
        ) : (
          todaySchedule.map((item) => (
            <div 
              key={item.id}
              className="bg-white border border-slate-200/60 rounded-xl p-5 shadow-[0_2px_8px_rgba(0,0,0,0.012)] space-y-4 hover:shadow-[0_12px_24px_rgba(7,10,19,0.04)] hover:border-slate-350/40 transition-all duration-300 text-left group"
            >
              {/* Header de hora e status */}
              <div className="flex items-center justify-between border-b border-slate-100/60 pb-2.5">
                <span className="text-xs font-black text-sky-600 flex items-center gap-1.5 leading-none">
                  <Clock className="w-4 h-4 text-sky-500" />
                  {item.scheduled_date ? new Date(item.scheduled_date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : 'Sem hora'}
                </span>
                <StatusBadge
                  label={getStatusLabel(item.status)}
                  type={getStatusBadgeType(item.status)}
                />
              </div>

              {/* Informações da Tarefa */}
              <div className="space-y-3 text-xs font-semibold text-slate-600">
                <div className="space-y-1.5">
                  <span className="text-[9px] font-mono font-black text-sky-600 bg-sky-50/50 px-2 py-0.5 rounded border border-sky-100/50 tracking-wider inline-block leading-none">
                    OS: #{item.id.slice(0, 8).toUpperCase()}
                  </span>
                  <h4 className="font-extrabold text-slate-800 text-sm leading-snug group-hover:text-sky-700 transition-colors">
                    {item.equipment?.name || 'Equipamento Geral'}
                  </h4>
                  {item.description && (
                    <p className="text-[11px] text-slate-500 font-semibold leading-relaxed bg-slate-50/40 p-3 rounded-lg border border-slate-150/40 italic">
                      "{item.description}"
                    </p>
                  )}
                </div>
                
                {/* Dados do Cliente e Endereço */}
                <div className="space-y-2 border-t border-slate-100/60 pt-3 text-[11px]">
                  <p className="text-slate-500">
                    Cliente: <strong className="text-slate-700">{item.customer?.company_name}</strong>
                  </p>
                  
                  {item.customer && (
                    <div className="space-y-2">
                      <p className="flex items-start gap-1.5 text-slate-400 font-medium leading-relaxed">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
                        <span>
                          {item.customer.address_street}, {item.customer.address_number}
                          {item.customer.address_complement ? ` - ${item.customer.address_complement}` : ''}
                          <br />
                          {item.customer.address_neighborhood}, {item.customer.address_city} - {item.customer.address_state}
                        </span>
                      </p>
                      
                      {item.customer.phone && (
                        <p className="flex items-center gap-1.5 text-slate-500 font-semibold">
                          <Phone className="w-3.5 h-3.5 text-slate-405" />
                          <a href={`tel:${item.customer.phone}`} className="text-sky-600 font-extrabold hover:underline">
                            {item.customer.phone}
                          </a>
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Botão para iniciar atendimento */}
                <Link href={`/tecnico/servicos`} className="block w-full pt-1">
                  <PremiumButton
                    variant="outline"
                    className="w-full text-xs py-2.5"
                    icon={<Wrench className="w-3.5 h-3.5" />}
                  >
                    Atualizar Atendimento
                  </PremiumButton>
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
