'use client';

import React, { useEffect, useState } from 'react';
import { StatusCard } from '@/components/ui/StatusCard';
import { 
  Calendar, CheckCircle2, Clock, Wrench, User, MapPin, 
  Phone, AlertTriangle, ChevronRight, Check, X, RefreshCw 
} from 'lucide-react';
import Link from 'next/link';
import { createSupabaseBrowserClient } from '@/lib/supabase';
import { useAuth } from '@/components/AuthProvider';

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
          notes: `Status atualizado em campo pelo técnico para: ${newStatus}.`
        });

      if (histError) console.error('Erro ao salvar histórico de status:', histError.message);

      await loadTechData();
    } catch (err: any) {
      alert('Erro ao atualizar status: ' + err.message);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const getPriorityBadgeClass = (priority: string) => {
    switch(priority) {
      case 'urgente': return 'bg-rose-500 text-white border-rose-600 animate-pulse';
      case 'alta': return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'media': return 'bg-blue-50 text-blue-700 border-blue-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
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
        <RefreshCw className="w-8 h-8 text-brand-clinical animate-spin" />
        Carregando painel operacional de campo...
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
      <div className="text-center py-16 px-6 max-w-sm mx-auto space-y-4">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
          <User className="w-8 h-8" />
        </div>
        <h2 className="text-base font-extrabold text-brand-dark">Acesso Restrito</h2>
        <p className="text-xs text-slate-500 font-medium leading-relaxed">
          Seu perfil de usuário não está vinculado a um cadastro de técnico ativo no sistema. 
          Entre em contato com o administrador para habilitar seu acesso.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-md mx-auto">
      {/* Welcome Block */}
      <div className="space-y-1">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Painel do Técnico</span>
        <h1 className="text-2xl font-extrabold text-brand-dark tracking-tight">
          Olá, {profile?.name || 'Técnico'}
        </h1>
        <p className="text-xs text-slate-500 font-semibold leading-relaxed">
          Acesse sua rota de visitas e gerencie seus atendimentos de hoje.
        </p>
      </div>

      {/* OS ativa designada */}
      {activeOS ? (
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Clock className={`w-3.5 h-3.5 ${activeOS.status === 'em_atendimento' ? 'text-rose-500 animate-pulse' : 'text-slate-400'}`} />
            {activeOS.status === 'em_atendimento' ? 'Serviço Ativo (Em andamento)' : 'Próximo Serviço da Lista'}
          </h3>
          
          <div className={`bg-white border rounded-2xl p-5 shadow-sm space-y-4 transition-all relative overflow-hidden ${
            activeOS.priority === 'urgente' ? 'border-rose-200 ring-2 ring-rose-50' : 'border-slate-100'
          }`}>
            {/* Status y Prioridad */}
            <div className="flex items-center justify-between">
              <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider border ${
                activeOS.status === 'em_atendimento' ? 'bg-sky-500 text-white border-sky-600' : 'bg-slate-100 text-slate-700 border-slate-200'
              }`}>
                {getStatusLabel(activeOS.status)}
              </span>

              <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${getPriorityBadgeClass(activeOS.priority)}`}>
                {activeOS.priority.toUpperCase()}
              </span>
            </div>

            {/* Equipamiento y Cliente */}
            <div className="space-y-2">
              <span className="text-[10px] font-mono font-bold text-brand-clinical block">
                OS: #{activeOS.id.slice(0, 8).toUpperCase()}
              </span>
              <h4 className="font-extrabold text-brand-dark text-lg leading-snug">
                {activeOS.equipment?.name || 'Equipamento Geral'}
              </h4>
              {activeOS.equipment?.model && (
                <p className="text-xs text-slate-400 font-medium">
                  {activeOS.equipment.brand} • {activeOS.equipment.model} {activeOS.equipment.serial_number ? `(S/N: ${activeOS.equipment.serial_number})` : ''}
                </p>
              )}
              
              <div className="flex items-center gap-1.5 text-xs text-slate-600 font-semibold pt-1">
                <User className="w-4 h-4 text-slate-400" />
                <span>{activeOS.customer?.company_name}</span>
              </div>
            </div>

            {/* Dirección */}
            {activeOS.customer && (
              <div className="bg-slate-50 rounded-xl p-3 space-y-1.5 text-xs font-semibold text-slate-600">
                <div className="flex items-start gap-2">
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
                  <div className="flex items-center gap-2 border-t border-slate-100 pt-1.5 mt-1.5">
                    <Phone className="w-4 h-4 text-slate-400" />
                    <a href={`tel:${activeOS.customer.phone}`} className="text-brand-clinical font-bold hover:underline">
                      {activeOS.customer.phone}
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* Relato del problema */}
            <div className="space-y-1">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Descrição do Chamado:</span>
              <p className="text-xs text-slate-500 font-medium leading-relaxed bg-slate-50/50 p-2.5 rounded-lg border border-slate-100/50 italic">
                "{activeOS.description}"
              </p>
            </div>

            {/* Botones de acción táctiles grandes */}
            <div className="pt-2 border-t border-slate-100/80 flex flex-col gap-2">
              {activeOS.status !== 'em_atendimento' ? (
                <button
                  disabled={updatingStatus}
                  onClick={() => handleUpdateActiveStatus('em_atendimento')}
                  className="w-full bg-brand-clinical hover:bg-sky-700 text-white font-extrabold text-sm py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md hover:scale-[1.01] cursor-pointer"
                >
                  {updatingStatus ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Wrench className="w-4 h-4" />}
                  Iniciar Atendimento Local
                </button>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <button
                    disabled={updatingStatus}
                    onClick={() => handleUpdateActiveStatus('concluida')}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs py-3 px-4 rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-sm hover:scale-[1.01] cursor-pointer"
                  >
                    <Check className="w-4 h-4" /> Concluir Serviço
                  </button>
                  <button
                    disabled={updatingStatus}
                    onClick={() => handleUpdateActiveStatus('aguardando_peca')}
                    className="bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-xs py-3 px-4 rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-sm hover:scale-[1.01] cursor-pointer"
                  >
                    <AlertTriangle className="w-4 h-4" /> Aguardar Peça
                  </button>
                </div>
              )}
              <Link 
                href="/tecnico/servicos"
                className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 font-bold text-xs py-2.5 rounded-xl flex items-center justify-center gap-1 transition-all"
              >
                Gerenciar Todos os Chamados <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 px-6 border-2 border-dashed border-slate-200 rounded-2xl bg-white space-y-3">
          <div className="w-12 h-12 bg-sky-50 text-brand-clinical rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="font-extrabold text-sm text-brand-dark">Sem chamados pendentes</h3>
          <p className="text-xs text-slate-400 font-medium">
            Ótimo trabalho! Você não possui nenhuma ordem de serviço pendente ou designada no momento.
          </p>
        </div>
      )}

      {/* Grid de Métricas */}
      <div className="grid grid-cols-2 gap-4">
        <StatusCard
          title="Agendados Hoje"
          value={`${todayScheduledCount} visitas`}
          icon={<Calendar className="w-5 h-5 text-brand-clinical" />}
          variant="light"
        />
        <StatusCard
          title="Concluídos Hoje"
          value={`${todayCompletedCount} OS`}
          icon={<CheckCircle2 className="w-5 h-5 text-emerald-500" />}
          variant="light"
        />
      </div>

      {/* Checklist / Próxima rota */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4 shadow-xs">
        <div className="flex justify-between items-center pb-2 border-b border-slate-50">
          <h3 className="text-xs font-bold text-brand-dark uppercase tracking-wider">
            Sua Rota de Hoje
          </h3>
          <span className="text-[10px] font-bold text-slate-400">
            {todayVisits.length} visitas restantes
          </span>
        </div>

        <div className="space-y-3.5 text-xs font-semibold text-slate-600">
          {todayVisits.length === 0 ? (
            <p className="text-slate-400 text-center py-4 font-medium italic">Nenhuma outra visita programada para hoje.</p>
          ) : (
            todayVisits.map((visit) => (
              <div key={visit.id} className="flex justify-between items-start border-b border-slate-50/50 pb-3 last:border-0 last:pb-0">
                <div className="space-y-1">
                  <p className="text-brand-dark">
                    {visit.scheduled_date ? new Date(visit.scheduled_date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : 'Sem hora'} - {visit.customer?.company_name}
                  </p>
                  <p className="text-[10px] text-slate-400 font-medium">
                    {visit.equipment?.name || 'Equipamento geral'} ({visit.description.slice(0, 45)}...)
                  </p>
                </div>
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md ${
                  visit.status === 'em_atendimento' 
                    ? 'bg-sky-100 text-sky-800 animate-pulse' 
                    : 'bg-blue-50 text-blue-700'
                }`}>
                  {getStatusLabel(visit.status)}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
