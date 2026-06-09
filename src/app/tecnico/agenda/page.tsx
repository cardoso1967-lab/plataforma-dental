'use client';

import React, { useEffect, useState } from 'react';
import { 
  Calendar, Clock, MapPin, Phone, RefreshCw, 
  Wrench, ChevronRight, AlertTriangle 
} from 'lucide-react';
import Link from 'next/link';
import { createSupabaseBrowserClient } from '@/lib/supabase';
import { useAuth } from '@/components/AuthProvider';

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

  const getStatusClass = (status: string) => {
    switch(status) {
      case 'em_atendimento': return 'bg-sky-100 text-sky-800 border-sky-200 animate-pulse';
      case 'concluida': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'aguardando_peca': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-blue-50 text-blue-800 border-blue-200';
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-400 font-medium text-xs gap-3">
        <RefreshCw className="w-8 h-8 text-brand-clinical animate-spin" />
        Carregando seu roteiro de hoje...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs font-semibold">
        {error}
      </div>
    );
  }

  if (!technician) {
    return (
      <div className="text-center py-16 px-6 max-w-sm mx-auto bg-white border border-slate-100 rounded-2xl p-6 mt-10 shadow-sm">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
          <Calendar className="w-8 h-8" />
        </div>
        <h2 className="text-base font-extrabold text-brand-dark">Agenda Restrita</h2>
        <p className="text-xs text-slate-500 font-medium leading-relaxed mt-2">
          Sua conta de usuário não possui vinculação operacional de campo ativa.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-md mx-auto">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-xl font-extrabold text-brand-dark tracking-tight">
          Minha Agenda de Hoje
        </h1>
        <p className="text-xs text-slate-500 font-semibold leading-relaxed">
          Roteiro cronológico de visitas e manutenções designadas para o seu dia.
        </p>
      </div>

      {/* Roteiro */}
      <div className="space-y-4">
        {todaySchedule.length === 0 ? (
          <div className="text-center py-16 px-6 border-2 border-dashed border-slate-200 rounded-2xl bg-white space-y-4">
            <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto">
              <Calendar className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-sm text-brand-dark">Nenhuma visita hoje</h3>
            <p className="text-xs text-slate-400 font-medium">
              Você não possui nenhum atendimento agendado para o dia de hoje.
            </p>
            <Link
              href="/tecnico/servicos"
              className="inline-flex items-center gap-1.5 bg-brand-clinical hover:bg-sky-700 text-white text-xs font-extrabold px-5 py-2.5 rounded-xl shadow-xs transition-colors"
            >
              Ver Todas as Minhas OS <ChevronRight className="w-4.5 h-4.5" />
            </Link>
          </div>
        ) : (
          todaySchedule.map((item) => (
            <div 
              key={item.id}
              className="bg-white border border-slate-100 rounded-2xl p-4.5 shadow-sm space-y-4 hover:shadow-md transition-shadow text-left"
            >
              {/* Header de hora e status */}
              <div className="flex items-center justify-between border-b border-slate-50 pb-2.5">
                <span className="text-xs font-extrabold text-brand-clinical flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  {item.scheduled_date ? new Date(item.scheduled_date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : 'Sem hora'}
                </span>
                <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full border uppercase tracking-wider ${getStatusClass(item.status)}`}>
                  {getStatusLabel(item.status)}
                </span>
              </div>

              {/* Informações da Tarefa */}
              <div className="space-y-3 text-xs font-semibold text-slate-600">
                <div className="space-y-1">
                  <span className="text-[9px] font-mono font-bold text-slate-400 block">
                    OS: #{item.id.slice(0, 8).toUpperCase()}
                  </span>
                  <h4 className="font-extrabold text-brand-dark text-base leading-snug">
                    {item.equipment?.name || 'Equipamento Geral'}
                  </h4>
                  {item.description && (
                    <p className="text-[11px] text-slate-500 font-medium leading-relaxed italic">
                      "{item.description}"
                    </p>
                  )}
                </div>
                
                {/* Dados do Cliente e Endereço */}
                <div className="space-y-2 border-t border-slate-50 pt-2.5 text-[11px] pt-1">
                  <p className="text-slate-800">
                    Cliente: <strong className="text-brand-dark">{item.customer?.company_name}</strong>
                  </p>
                  
                  {item.customer && (
                    <div className="space-y-1.5">
                      <p className="flex items-start gap-1.5 text-slate-500 font-medium">
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
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          <a href={`tel:${item.customer.phone}`} className="text-brand-clinical font-bold hover:underline">
                            {item.customer.phone}
                          </a>
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Botão para iniciar atendimento */}
                <Link
                  href={`/tecnico/servicos`}
                  className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-200/80 text-brand-clinical font-extrabold text-xs py-2.5 rounded-xl flex items-center justify-center gap-1 transition-colors cursor-pointer"
                >
                  <Wrench className="w-3.5 h-3.5" /> Atualizar Atendimento
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
