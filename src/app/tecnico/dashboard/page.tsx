'use client';

import React, { useEffect, useState } from 'react';
import { 
  Calendar, CheckCircle2, Clock, Wrench, User, MapPin, 
  Phone, AlertTriangle, ChevronRight, Check, RefreshCw, AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import { createSupabaseBrowserClient } from '@/lib/supabase';
import { useAuth } from '@/components/AuthProvider';

import { PageHero } from '@/components/ui/PageHero';
import { MetricCard } from '@/components/ui/MetricCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { PremiumButton } from '@/components/ui/PremiumButton';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { getCustomerDisplayName } from '@/lib/customer-utils';

export default function TecnicoDashboardPage() {
  const supabase = createSupabaseBrowserClient();
  const { profile } = useAuth();

  const [loading, setLoading] = useState(true);
  const [technician, setTechnician] = useState<any>(null);
  const [activeOS, setActiveOS] = useState<any>(null);
  const [todayScheduledCount, setTodayScheduledCount] = useState(0);
  const [todayCompletedCount, setTodayCompletedCount] = useState(0);
  const [todayVisits, setTodayVisits] = useState<any[]>([]);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 3500);
  };

  const loadTechData = async () => {
    if (!profile?.id) return;
    try {
      setLoading(true);
      setError(null);

      // 1. Obtener técnico
      const { data: techData, error: techError } = await supabase
        .from('technicians')
        .select('id, is_active')
        .eq('profile_id', profile.id)
        .maybeSingle();

      if (techError) throw techError;

      if (!techData) {
        setTechnician(null);
        setLoading(false);
        return;
      }

      setTechnician(techData);

      // 2. Obtener órdenes de servicio del técnico
      const { data: osData, error: osError } = await supabase
        .from('service_orders')
        .select(`
          *,
          customer:customers(
            id, trade_name, company_name, contact_name, email, phone, whatsapp,
            address_street, address_number, address_complement, 
            address_neighborhood, address_city, address_state, address_zip
          ),
          equipment:client_equipment(id, name, brand, model, serial_number)
        `)
        .eq('technician_id', techData.id)
        .order('scheduled_date', { ascending: true });

      if (osError) throw osError;

      const allOS = osData || [];

      // Identificar servicio activo (em_atendimento)
      const inProgress = allOS.find(os => os.status === 'em_atendimento');
      
      // O en su defecto, el servicio con mayor prioridad no concluido
      const urgentOrNext = allOS.find(os => os.status !== 'concluida' && os.status !== 'cancelada' && os.priority === 'urgente') || 
                           allOS.find(os => os.status !== 'concluida' && os.status !== 'cancelada');
      
      setActiveOS(inProgress || urgentOrNext || null);

      // Calcular hoy
      const todayStr = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD local

      // Agendados hoje
      const todayScheduled = allOS.filter(os => {
        if (!os.scheduled_date) return false;
        const osDateStr = new Date(os.scheduled_date).toLocaleDateString('en-CA');
        return osDateStr === todayStr;
      });
      setTodayScheduledCount(todayScheduled.length);

      // Concluidos hoje (status concluída y fecha de conclusión hoy)
      const todayCompleted = allOS.filter(os => {
        if (os.status !== 'concluida') return false;
        const completedDate = os.completion_date || os.created_at;
        const dateStr = new Date(completedDate).toLocaleDateString('en-CA');
        return dateStr === todayStr;
      });
      setTodayCompletedCount(todayCompleted.length);

      // Próximas visitas activas de hoy
      const visits = todayScheduled.filter(os => os.status !== 'concluida' && os.status !== 'cancelada');
      setTodayVisits(visits);

    } catch (err: any) {
      console.error('Erro ao carregar dados do técnico:', err);
      setError(err.message || 'Erro ao carregar os chamados do servidor.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTechData();
  }, [profile]);

  // Cambiar estatus rápidamente del servicio activo desde el Dashboard
  const handleUpdateActiveStatus = async (newStatus: string) => {
    if (!activeOS || !profile?.id) return;
    try {
      setUpdatingStatus(true);
      const isConcluido = newStatus === 'concluida';
      
      const updatePayload: any = {
        status: newStatus,
      };
      if (isConcluido) {
        updatePayload.completion_date = new Date().toISOString();
      }

      const { error: updateError } = await supabase
        .from('service_orders')
        .update(updatePayload)
        .eq('id', activeOS.id);

      if (updateError) throw updateError;

      // Guardar historial
      const { error: histError } = await supabase
        .from('service_order_status_history')
        .insert({
          service_order_id: activeOS.id,
          status: newStatus,
          changed_by: profile.id,
          notes: `Status atualizado em campo pelo técnico para: ${getStatusLabel(newStatus)}.`
        });

      if (histError) console.error('Erro ao salvar histórico de status:', histError.message);

      await loadTechData();
      showFeedback('success', 'Status atualizado com sucesso.');
    } catch (err: any) {
      showFeedback('error', 'Não foi possível concluir a ação. Tente novamente.');
      console.error('Erro ao atualizar status:', err.message);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const getPriorityBadgeType = (priority: string) => {
    switch (priority) {
      case 'baixa': return 'neutral';
      case 'media': return 'info';
      case 'alta': return 'warning';
      case 'urgente': return 'error';
      default: return 'neutral';
    }
  };

  const getStatusBadgeType = (status: string) => {
    switch (status) {
      case 'em_atendimento': return 'success';
      case 'concluida': return 'success';
      case 'orcamento_aprovado': return 'success';
      case 'aguardando_peca': return 'warning';
      case 'orcamento_pendente': return 'warning';
      case 'cancelada': return 'error';
      default: return 'neutral';
    }
  };

  const getStatusLabel = (status: string) => {
    const map: Record<string, string> = {
      aberta: 'Aberta',
      em_analise: 'Em análise',
      tecnico_atribuido: 'Técnico atribuído',
      visita_agendada: 'Visita agendada',
      em_atendimento: 'Em atendimento',
      aguardando_peca: 'Aguardando peça',
      orcamento_pendente: 'Orçamento pendente',
      orcamento_aprovado: 'Orçamento aprovado',
      concluida: 'Concluído',
      cancelada: 'Cancelado',
    };
    return map[status] || status;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-400 font-medium text-xs gap-3">
        <RefreshCw className="w-8 h-8 text-sky-600 animate-spin" />
        Carregando painel operacional de campo...
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
      <div className="text-center py-16 px-6 max-w-sm mx-auto space-y-4">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
          <User className="w-8 h-8" />
        </div>
        <h2 className="text-base font-extrabold text-slate-800">Acesso Restrito</h2>
        <p className="text-xs text-slate-500 font-medium leading-relaxed">
          Seu perfil de usuário não está vinculado a um cadastro de técnico ativo no sistema. 
          Entre em contato com o administrador para habilitar seu acesso.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-left animate-in fade-in duration-300">
      {/* Feedback Toast */}
      {feedback && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl text-xs font-bold animate-in slide-in-from-bottom-4 duration-300 ${
          feedback.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
        }`}>
          {feedback.type === 'success'
            ? <CheckCircle2 className="w-4 h-4 shrink-0" />
            : <AlertCircle className="w-4 h-4 shrink-0" />
          }
          {feedback.message}
        </div>
      )}
      {/* Welcome Block */}
      <PageHero
        title={`Olá, ${profile?.name || 'Técnico'}`}
        description="Acesse sua rota de visitas e gerencie seus atendimentos odontológicos de hoje."
        badge="Painel do Técnico"
        icon={Calendar}
        variant="compact"
      />

      {/* OS ativa designada */}
      {activeOS ? (
        <div className="space-y-3">
          <h3 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest pl-1 font-sans flex items-center gap-1.5">
            <Clock className={`w-3.5 h-3.5 ${activeOS.status === 'em_atendimento' ? 'text-rose-500 animate-pulse' : 'text-slate-400'}`} />
            {activeOS.status === 'em_atendimento' ? 'Serviço Ativo (Em andamento)' : 'Próximo Serviço da Lista'}
          </h3>
          
          <div className={`bg-white border rounded-xl p-5 shadow-[0_2px_8px_rgba(0,0,0,0.012)] space-y-4 transition-all duration-300 hover:shadow-[0_12px_30px_rgba(7,10,19,0.04)] hover:border-sky-350/30 ${
            activeOS.priority === 'urgente' ? 'border-rose-300 ring-2 ring-rose-50/50' : 'border-slate-200/60'
          }`}>
            {/* Status y Prioridad */}
            <div className="flex items-center justify-between">
              <StatusBadge
                label={getStatusLabel(activeOS.status)}
                type={getStatusBadgeType(activeOS.status)}
              />

              <StatusBadge
                label={activeOS.priority}
                type={getPriorityBadgeType(activeOS.priority)}
                className={activeOS.priority === 'urgente' ? 'animate-pulse font-extrabold' : ''}
              />
            </div>

            {/* Equipamiento y Cliente */}
            <div className="space-y-2">
              <span className="text-[10px] font-mono font-black text-sky-600 bg-sky-50/50 px-2 py-0.5 rounded border border-sky-105/20 inline-block leading-none">
                OS: #{activeOS.id.slice(0, 8).toUpperCase()}
              </span>
              <h4 className="font-extrabold text-slate-800 text-sm leading-snug">
                {activeOS.equipment?.name || 'Equipamento Geral'}
              </h4>
              {activeOS.equipment?.model && (
                <p className="text-[10px] text-slate-400 font-bold">
                  {activeOS.equipment.brand} • {activeOS.equipment.model} {activeOS.equipment.serial_number ? `(S/N: ${activeOS.equipment.serial_number})` : ''}
                </p>
              )}
              
              <div className="flex items-center gap-2 text-xs text-slate-600 font-semibold pt-1">
                <User className="w-4 h-4 text-slate-400" />
                <span>{getCustomerDisplayName(activeOS.customer)}</span>
              </div>
            </div>

            {/* Dirección */}
            {activeOS.customer && (
              <div className="bg-slate-50/60 rounded-xl p-4 space-y-2.5 text-xs font-semibold text-slate-600 border border-slate-150/40 shadow-[inset_0_1px_2px_rgba(0,0,0,0.01)]">
                <div className="flex items-start gap-2 text-[11px] leading-relaxed">
                  <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                  <span>
                    {activeOS.customer.address_street}, {activeOS.customer.address_number}
                    {activeOS.customer.address_complement ? ` - ${activeOS.customer.address_complement}` : ''}
                    <br />
                    <span className="text-[10px] text-slate-400 font-medium">
                      {activeOS.customer.address_neighborhood}, {activeOS.customer.address_city} - {activeOS.customer.address_state}
                    </span>
                  </span>
                </div>
                {activeOS.customer.phone && (
                  <div className="flex items-center gap-2 border-t border-slate-200/50 pt-2">
                    <Phone className="w-3.5 h-3.5 text-slate-450" />
                    <a href={`tel:${activeOS.customer.phone}`} className="text-sky-600 font-extrabold hover:underline">
                      {activeOS.customer.phone}
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* Relato del problema */}
            <div className="space-y-1">
              <span className="text-[9px] font-extrabold text-slate-450 uppercase tracking-wide">Descrição do Chamado:</span>
              <p className="text-xs text-slate-500 font-semibold leading-relaxed bg-slate-50/40 p-3 rounded-xl border border-slate-150/40 italic">
                "{activeOS.description}"
              </p>
            </div>

            {/* Botones de acción táctiles grandes */}
            <div className="pt-2 border-t border-slate-100/80 flex flex-col gap-2">
              {activeOS.status !== 'em_atendimento' ? (
                <PremiumButton
                  loading={updatingStatus}
                  onClick={() => handleUpdateActiveStatus('em_atendimento')}
                  variant="primary"
                  className="w-full py-3 text-xs"
                  icon={<Wrench className="w-4 h-4" />}
                >
                  Iniciar Atendimento Local
                </PremiumButton>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <PremiumButton
                    loading={updatingStatus}
                    onClick={() => handleUpdateActiveStatus('concluida')}
                    variant="emerald"
                    className="py-3 text-xs"
                    icon={<Check className="w-4 h-4" />}
                  >
                    Concluir Serviço
                  </PremiumButton>
                  <PremiumButton
                    loading={updatingStatus}
                    onClick={() => handleUpdateActiveStatus('aguardando_peca')}
                    variant="danger"
                    className="py-3 text-xs bg-orange-500 hover:bg-orange-600 border-none text-white"
                    icon={<AlertTriangle className="w-4 h-4" />}
                  >
                    Aguardar Peça
                  </PremiumButton>
                </div>
              )}
              <Link 
                href="/tecnico/servicos"
                className="w-full bg-slate-50 hover:bg-slate-100/60 border border-slate-200/60 text-slate-600 font-extrabold text-[11px] py-3 rounded-xl flex items-center justify-center gap-1 transition-all"
              >
                Gerenciar Todos os Chamados <ChevronRight className="w-4 h-4 text-slate-400" />
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <EmptyState
          title="Sem chamados ativos"
          description="Ótimo trabalho! Você completou todos os chamados designados no momento."
          icon={<CheckCircle2 className="w-6 h-6 text-emerald-650" />}
          variant="compact"
        />
      )}

      {/* Grid de Métricas */}
      <div className="grid grid-cols-2 gap-4">
        <MetricCard
          title="Agendados Hoje"
          value={`${todayScheduledCount} visitas`}
          icon={<Calendar className="w-4.5 h-4.5 text-sky-600" />}
        />
        <MetricCard
          title="Concluídos Hoje"
          value={`${todayCompletedCount} OS`}
          icon={<CheckCircle2 className="w-4.5 h-4.5 text-emerald-600" />}
          variant="emerald"
        />
      </div>

      {/* Checklist / Próxima rota */}
      <div className="bg-white rounded-3xl border border-slate-100 p-5 space-y-4 shadow-xs">
        <div className="flex justify-between items-center pb-2 border-b border-slate-55">
          <h3 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest pl-1 font-sans">
            Sua Rota de Hoje
          </h3>
          <span className="text-[10px] font-extrabold text-slate-400 font-sans">
            {todayVisits.length} visitas restantes
          </span>
        </div>

        <div className="space-y-3.5 text-xs font-semibold text-slate-655">
          {todayVisits.length === 0 ? (
            <p className="text-slate-400 text-center py-4 font-medium italic">Nenhuma outra visita programada para hoje.</p>
          ) : (
            todayVisits.map((visit) => (
              <div key={visit.id} className="flex justify-between items-start border-b border-slate-50/50 pb-3 last:border-0 last:pb-0">
                <div className="space-y-1">
                  <p className="text-slate-800 font-extrabold">
                    {visit.scheduled_date ? new Date(visit.scheduled_date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : 'Sem hora'} - {getCustomerDisplayName(visit.customer)}
                  </p>
                  <p className="text-[10px] text-slate-400 font-medium">
                    {visit.equipment?.name || 'Equipamento geral'} ({visit.description.slice(0, 45)}...)
                  </p>
                </div>
                <StatusBadge
                  label={getStatusLabel(visit.status)}
                  type={getStatusBadgeType(visit.status)}
                />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
