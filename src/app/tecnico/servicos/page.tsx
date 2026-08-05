'use client';

import React, { useEffect, useState } from 'react';
import { 
  Wrench, User, Calendar, Search, Eye, RefreshCw, MapPin, ClipboardList, CheckCircle2, AlertCircle
} from 'lucide-react';
import { createSupabaseBrowserClient } from '@/lib/supabase';
import { useAuth } from '@/components/AuthProvider';

import { PageHero } from '@/components/ui/PageHero';
import { EmptyState } from '@/components/ui/EmptyState';
import { PremiumModal } from '@/components/ui/PremiumModal';
import { PremiumInput } from '@/components/ui/PremiumInput';
import { PremiumButton } from '@/components/ui/PremiumButton';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { formatFriendlyDateTime } from '@/lib/date-utils';
import { getCustomerDisplayName } from '@/lib/customer-utils';

export default function TecnicoServicosPage() {
  const supabase = createSupabaseBrowserClient();
  const { profile } = useAuth();

  const [loading, setLoading] = useState(true);
  const [technician, setTechnician] = useState<any>(null);
  const [services, setServices] = useState<any[]>([]);
  const [filteredServices, setFilteredServices] = useState<any[]>([]);
  const [activeFilter, setActiveFilter] = useState<'todos' | 'pendentes' | 'atendimento' | 'concluidos'>('todos');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal de detalles y actualización
  const [selectedOS, setSelectedOS] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [techNotes, setTechNotes] = useState('');
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Estados para novas notas de histórico
  const [newNotePeca, setNewNotePeca] = useState('');
  const [newNoteServico, setNewNoteServico] = useState('');
  const [addingNote, setAddingNote] = useState(false);

  // Estados para reabertura (modal de OS finalizada)
  const [pendingRequest, setPendingRequest] = useState<any>(null);
  const [reopenReason, setReopenReason] = useState('');
  const [requestingReopen, setRequestingReopen] = useState(false);
  const [newNoteComplemento, setNewNoteComplemento] = useState('');

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 3500);
  };

  const loadData = async () => {
    if (!profile?.id) return;
    try {
      setLoading(true);
      setError(null);

      // 1. Obtain technician record
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

      // 2. PRIMARY QUERY: load service orders + notes.
      // status_history is intentionally excluded here to prevent a join
      // permission failure from silently returning null/[] for the entire list.
      const { data: osData, error: osError } = await supabase
        .from('service_orders')
        .select(`
          *,
          customer:customers(
            id, trade_name, company_name, contact_name, email, phone, whatsapp,
            address_street, address_number, address_complement,
            address_neighborhood, address_city, address_state, address_zip
          ),
          equipment:client_equipment(id, name, brand, model, serial_number),
          notes:service_order_notes(
            id,
            note,
            category,
            created_at,
            profile:profiles(name)
          )
        `)
        .eq('technician_id', techData.id)
        .order('created_at', { ascending: false });

      if (osError) throw osError;

      const primaryList: any[] = osData || [];

      // 3. SECONDARY QUERY: load status history independently.
      // A failure here does NOT clear the OS list — it only attaches an empty
      // array to each OS and logs the error for debugging.
      let historyMap: Record<string, any[]> = {};
      try {
        const osIds = primaryList.map((os) => os.id);
        if (osIds.length > 0) {
          const { data: histData, error: histError } = await supabase
            .from('service_order_status_history')
            .select('id, service_order_id, status, previous_status, created_at, profile:profiles(name)')
            .in('service_order_id', osIds)
            .order('created_at', { ascending: true });

          if (histError) {
            // Auxiliary failure: log only, do not throw, do not clear OS list.
            console.warn('[loadData] status_history query failed (non-critical):', histError.message);
          } else {
            for (const h of histData || []) {
              if (!historyMap[h.service_order_id]) historyMap[h.service_order_id] = [];
              historyMap[h.service_order_id].push(h);
            }
          }
        }
      } catch (histErr: any) {
        console.warn('[loadData] status_history fetch threw (non-critical):', histErr.message);
      }

      // 4. Merge history into each OS — primary list is never replaced on failure.
      const enriched = primaryList.map((os) => ({
        ...os,
        status_history: historyMap[os.id] || [],
      }));

      setServices(enriched);

    } catch (err: any) {
      console.error('Erro ao carregar serviços:', err);
      setError(err.message || 'Erro ao carregar dados de serviços do Supabase.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [profile]);

  // Filtrado y búsqueda
  useEffect(() => {
    let result = [...services];

    // Aplicar filtro de pestaña
    if (activeFilter === 'pendentes') {
      result = result.filter(os => ['aberta', 'em_analise', 'tecnico_atribuido', 'visita_agendada', 'orcamento_pendente'].includes(os.status));
    } else if (activeFilter === 'atendimento') {
      result = result.filter(os => os.status === 'em_atendimento' || os.status === 'aguardando_peca');
    } else if (activeFilter === 'concluidos') {
      result = result.filter(os => os.status === 'concluida' || os.status === 'cancelada');
    }

    // Aplicar término de búsqueda
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(os => 
        os.id.toLowerCase().includes(term) ||
        getCustomerDisplayName(os.customer).toLowerCase().includes(term) ||
        (os.equipment?.name || '').toLowerCase().includes(term) ||
        os.description.toLowerCase().includes(term)
      );
    }

    setFilteredServices(result);
  }, [services, activeFilter, searchTerm]);

  const openStatusModal = async (os: any) => {
    setSelectedOS(os);
    setNewStatus(os.status);
    setTechNotes(os.reported_issues || '');
    setNewNotePeca('');
    setNewNoteServico('');
    setNewNoteComplemento('');
    setReopenReason('');
    setPendingRequest(null);
    setIsModalOpen(true);

    // For finalized OS, check if there's a pending reopening request
    if (os.status === 'concluida' || os.status === 'cancelada') {
      const { data: reqData } = await supabase
        .from('service_order_reopening_requests')
        .select('*')
        .eq('service_order_id', os.id)
        .eq('status', 'pendente')
        .maybeSingle();
      setPendingRequest(reqData || null);
    }
  };

  // Guardar nueva nota en el historial
  const handleAddNote = async (osId: string, category: string, noteText: string, setter: (val: string) => void) => {
    if (!noteText.trim() || !profile?.id) return;
    try {
      setAddingNote(true);
      const { error: noteError } = await supabase
        .from('service_order_notes')
        .insert({
          service_order_id: osId,
          profile_id: profile.id,
          category: category,
          note: noteText,
        });

      if (noteError) throw noteError;
      
      // Atualizar localmente
      await loadData();
      
      // Update selectedOS object directly so modal shows new note immediately
      setSelectedOS((prev: any) => {
        if (!prev) return prev;
        const newNote = {
          id: Math.random().toString(),
          category,
          note: noteText,
          created_at: new Date().toISOString(),
          profile: { name: profile.name || 'Você' }
        };
        return { ...prev, notes: [newNote, ...(prev.notes || [])] };
      });
      
      setter('');
      showFeedback('success', 'Atualização adicionada com sucesso.');
    } catch (err: any) {
      showFeedback('error', 'Erro ao adicionar atualização.');
      console.error(err);
    } finally {
      setAddingNote(false);
    }
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOS || !profile?.id) return;

    try {
      setUpdating(true);
      const isConcluido = newStatus === 'concluida';
      
      const payload: any = {
        status: newStatus,
        reported_issues: techNotes || null
      };

      if (isConcluido) {
        payload.completion_date = new Date().toISOString();
      }

      const { error: updateError } = await supabase
        .from('service_orders')
        .update(payload)
        .eq('id', selectedOS.id);

      if (updateError) throw updateError;

      // Registrar historial de estatus
      const { error: histError } = await supabase
        .from('service_order_status_history')
        .insert({
          service_order_id: selectedOS.id,
          status: newStatus,
          changed_by: profile.id,
          notes: techNotes ? `Status atualizado em campo: ${techNotes}` : 'Status atualizado em campo pelo técnico.'
        });

      if (histError) console.error('Erro ao registrar histórico:', histError.message);

      setIsModalOpen(false);
      setSelectedOS(null);
      await loadData();
      showFeedback('success', 'Status atualizado com sucesso.');
    } catch (err: any) {
      showFeedback('error', 'Não foi possível concluir a ação. Tente novamente.');
      console.error('Erro ao atualizar chamado:', err.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleReopen = async () => {
    if (!reopenReason.trim() || !selectedOS) return;
    try {
      setRequestingReopen(true);
      const { data, error } = await supabase.rpc('request_reopening', {
        p_service_order_id: selectedOS.id,
        p_reason: reopenReason
      });
      if (error) throw error;

      const result = data as any;
      if (result?.action === 'reopened') {
        showFeedback('success', 'OS reaberta com sucesso.');
        setIsModalOpen(false);
        setSelectedOS(null);
        await loadData();
      } else {
        // requested — show pending state
        setPendingRequest({ id: 'pending', reason: reopenReason });
        showFeedback('success', 'Solicitação de reabertura enviada.');
      }
      setReopenReason('');
    } catch (err: any) {
      showFeedback('error', err.message || 'Erro ao processar solicitação.');
    } finally {
      setRequestingReopen(false);
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

  if (loading && services.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-400 font-medium text-xs gap-3">
        <RefreshCw className="w-8 h-8 text-sky-600 animate-spin" />
        Carregando ordens de serviço...
      </div>
    );
  }

  if (!technician) {
    return (
      <div className="text-center py-16 px-6 max-w-sm mx-auto space-y-4 bg-white rounded-3xl border border-slate-100 p-6 mt-10 shadow-sm text-left animate-in fade-in duration-300">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
          <User className="w-8 h-8" />
        </div>
        <h2 className="text-base font-extrabold text-slate-800">Acesso Restrito</h2>
        <p className="text-xs text-slate-500 font-medium leading-relaxed font-sans">
          Seu usuário não está vinculado a uma conta de técnico ativa no sistema.
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
      {/* Header */}
      <PageHero
        title="Ordens de Serviço"
        description="Gerencie e atualize seus atendimentos técnicos diretamente em campo."
        badge="Serviços"
        icon={Wrench}
        variant="compact"
      />

      {/* Buscador */}
      <div className="relative w-full">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Buscar cliente, equipamento ou OS..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-9.5 pr-4 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-brand-clinical focus:ring-2 focus:ring-sky-100 bg-white shadow-xs font-semibold"
        />
      </div>

      {/* Tabs / Filtros */}
      <div className="flex border-b border-slate-100 text-xs font-bold text-slate-400">
        {(['todos', 'pendentes', 'atendimento', 'concluidos'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveFilter(tab)}
            className={`flex-1 pb-3 text-center border-b-2 capitalize transition-all cursor-pointer ${
              activeFilter === tab 
                ? 'border-sky-600 text-sky-600 font-black' 
                : 'border-transparent hover:text-slate-600'
            }`}
          >
            {tab === 'atendimento' ? 'Ativos' : tab}
          </button>
        ))}
      </div>

      {/* Lista de OS adaptada a cards táctiles */}
      <div className="space-y-4">
        {filteredServices.length === 0 ? (
          <EmptyState
            title="Nenhum chamado encontrado"
            description="Não existem ordens de serviço correspondentes a este filtro em seu portfólio de campo."
            icon={<ClipboardList className="w-5 h-5 text-slate-400" />}
            variant="panel"
          />
        ) : (
          filteredServices.map((os) => (
            <div
              key={os.id}
              onClick={() => openStatusModal(os)}
              className={`bg-white rounded-xl border p-5 space-y-4 shadow-[0_2px_8px_rgba(0,0,0,0.012)] hover:shadow-[0_8px_20px_rgba(7,10,19,0.035)] transition-all cursor-pointer active:bg-slate-50/50 ${
                os.status === 'em_atendimento' ? 'ring-2 ring-sky-200/80 border-sky-400' : 'border-slate-200/60'
              }`}
            >
              {/* Encabezado del Card */}
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-black text-sky-600 bg-sky-50/50 px-2 py-0.5 rounded border border-sky-105/20 leading-none">
                  #{os.id.slice(0, 8).toUpperCase()}
                </span>
                <div className="flex gap-1.5 shrink-0">
                  <StatusBadge
                    label={getStatusLabel(os.status)}
                    type={getStatusBadgeType(os.status)}
                  />
                  <StatusBadge
                    label={os.priority}
                    type={getPriorityBadgeType(os.priority)}
                    className={os.priority === 'urgente' ? 'animate-pulse font-extrabold' : ''}
                  />
                </div>
              </div>

              {/* Contenido principal */}
              <div className="space-y-1.5 text-left">
                <h4 className="font-extrabold text-slate-800 text-sm leading-snug">
                  {os.equipment?.name || <span className="text-slate-400 italic">Equipamento não informado</span>}
                </h4>
                {os.equipment?.brand && (
                  <p className="text-[10px] text-slate-400 font-bold">
                    {os.equipment.brand} • {os.equipment.model}
                  </p>
                )}
                <div className="flex items-center gap-1.5 text-xs text-slate-655 font-semibold pt-1">
                  <User className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                  <span className="line-clamp-1">{getCustomerDisplayName(os.customer)}</span>
                </div>
              </div>

              {/* Descrição / Problema Relatado */}
              <div className="text-xs text-slate-600 font-medium bg-slate-50/40 p-3 rounded-xl border border-slate-100/80">
                <span className="text-[9px] text-slate-400 block font-bold uppercase tracking-wider mb-1">Problema Relatado</span>
                <p className="line-clamp-2 leading-relaxed italic">
                  {os.description ? `"${os.description}"` : <span className="text-slate-400 italic">Descrição não informada</span>}
                </p>
              </div>

              {/* Fecha y Dirección */}
              <div className="bg-slate-50/50 rounded-xl p-4 text-xs font-semibold text-slate-600 space-y-2 text-left border border-slate-150/40 shadow-[inset_0_1px_2px_rgba(0,0,0,0.01)]">
                <div className="flex items-center gap-1.5 text-sky-600 font-extrabold text-[11px]">
                  <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>
                    {os.scheduled_date 
                      ? `Agendado: ${formatFriendlyDateTime(os.scheduled_date)}` 
                      : <span className="text-slate-400 italic font-medium">Agendamento não definido</span>
                    }
                  </span>
                </div>
                <div className="flex items-start gap-1.5 text-[10.5px] text-slate-400 font-medium leading-relaxed">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
                  <span>
                    {os.customer?.address_street 
                      ? `${os.customer.address_street}${os.customer.address_number ? `, ${os.customer.address_number}` : ''}${os.customer.address_city ? ` - ${os.customer.address_city}` : ''}` 
                      : <span className="text-slate-400 italic font-medium">Endereço não informado</span>
                    }
                  </span>
                </div>
              </div>

              {/* Botón táctil gigante en el card */}
              <PremiumButton
                onClick={(e) => {
                  e.stopPropagation();
                  openStatusModal(os);
                }}
                variant="outline"
                className="w-full text-xs py-2.5"
                icon={<Eye className="w-4 h-4" />}
              >
                Ver & Atualizar Status
              </PremiumButton>
            </div>
          ))
        )}
      </div>

      <PremiumModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedOS ? `OS #${selectedOS.id.slice(0, 8).toUpperCase()}` : ''}
        size="md"
      >
        {selectedOS && (
          <form onSubmit={(e) => { e.preventDefault(); if (selectedOS.status !== 'concluida' && selectedOS.status !== 'cancelada') handleUpdateStatus(e); }} className="flex flex-col h-full text-left">
            <div className="space-y-4">
              {/* Informação do Cliente */}
              <div className="space-y-1 bg-slate-50 p-4.5 rounded-2xl border border-slate-100 text-xs font-semibold text-slate-655 text-left">
                <p className="text-slate-800 font-black">{getCustomerDisplayName(selectedOS.customer)}</p>
                <p className="text-slate-400 font-semibold text-[10.5px] leading-relaxed">
                  {selectedOS.customer?.address_street}, {selectedOS.customer?.address_number} - {selectedOS.customer?.address_city}
                </p>
                {selectedOS.customer?.phone && (
                  <p className="text-sky-600 font-extrabold text-[10.5px] pt-1">
                    Fone: {selectedOS.customer.phone}
                  </p>
                )}
              </div>

              {(selectedOS.status === 'concluida' || selectedOS.status === 'cancelada') ? (
                /* READ-ONLY MODE for finalized OS */
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-5">
                  <div className="flex items-center gap-2 text-rose-700 font-bold text-xs">
                    <AlertCircle className="w-4 h-4" />
                    Ordem de Serviço Finalizada — modo visualização
                  </div>

                  {/* Adicionar Complemento */}
                  <div className="space-y-2 bg-white p-4 rounded-xl border border-slate-200">
                    <h4 className="font-bold text-slate-800 text-xs flex items-center gap-2">
                      <User className="w-4 h-4 text-slate-400" />
                      Adicionar complemento
                    </h4>
                    <div className="flex gap-2 items-start">
                      <textarea
                        value={newNoteComplemento}
                        onChange={(e) => setNewNoteComplemento(e.target.value)}
                        placeholder="Complemento após fechamento..."
                        className="flex-1 text-[11px] p-2 rounded-lg border border-slate-200 focus:outline-none focus:border-slate-400 min-h-[60px]"
                      />
                      <PremiumButton
                        type="button"
                        onClick={() => handleAddNote(selectedOS.id, 'geral', newNoteComplemento, setNewNoteComplemento)}
                        disabled={!newNoteComplemento.trim() || addingNote}
                        variant="primary"
                        className="shrink-0 text-[10px] py-2 px-3 h-auto"
                      >
                        Adicionar
                      </PremiumButton>
                    </div>
                  </div>

                  {/* Reopening controls */}
                  <div className="pt-3 border-t border-slate-200">
                    {pendingRequest ? (
                      <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 flex flex-col gap-1">
                        <span className="font-bold text-amber-800 text-xs">Reabertura solicitada</span>
                        <span className="text-[11px] text-amber-700">Aguardando aprovação da gerência.</span>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <PremiumInput
                          label={
                            (!selectedOS.customer_signature_url && !selectedOS.is_billed && selectedOS.closed_at &&
                             (new Date().getTime() - new Date(selectedOS.closed_at).getTime()) / 3600000 <= 2)
                              ? `Motivo da Reabertura (até ${Math.max(0, Math.floor(2 - (new Date().getTime() - new Date(selectedOS.closed_at).getTime()) / 3600000))}h restantes)`
                              : 'Motivo para Solicitar Reabertura'
                          }
                          name="reopenReason"
                          value={reopenReason}
                          onChange={(e) => setReopenReason(e.target.value)}
                          placeholder="Motivo obrigatório..."
                        />
                        <PremiumButton
                          type="button"
                          onClick={handleReopen}
                          disabled={!reopenReason.trim() || requestingReopen}
                          loading={requestingReopen}
                          variant="outline"
                          className="w-full text-rose-600 border-rose-200 hover:bg-rose-50"
                        >
                          {(!selectedOS.customer_signature_url && !selectedOS.is_billed && selectedOS.closed_at &&
                            (new Date().getTime() - new Date(selectedOS.closed_at).getTime()) / 3600000 <= 2)
                            ? 'Reabrir OS'
                            : 'Solicitar reabertura'
                          }
                        </PremiumButton>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* EDIT MODE for active OS */
                <div className="space-y-4">
                  {/* Selector de Status */}
                  <PremiumInput
                    label="Alterar Status do Serviço"
                    name="status"
                    as="select"
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    options={[
                      { value: 'visita_agendada', label: 'Visita Agendada' },
                      { value: 'em_atendimento', label: 'Em Atendimento Local' },
                      { value: 'aguardando_peca', label: 'Aguardando Peça de Reposição' },
                      { value: 'orcamento_pendente', label: 'Aguardando Aprovação' },
                      { value: 'concluida', label: 'Concluído (Finalizado)' },
                      { value: 'cancelada', label: 'Cancelado' }
                    ]}
                  />

                  {/* Anotações Técnicas */}
                  <PremiumInput
                    label="Observações Técnicas / Laudo de Campo"
                    name="notes"
                    as="textarea"
                    value={techNotes}
                    onChange={(e) => setTechNotes(e.target.value)}
                    placeholder="Descreva o diagnóstico, justificativas de mudança de status ou laudo final..."
                    rows={2}
                  />

                  {/* Histórico Cronológico */}
                  <div className="space-y-3 pt-4 border-t border-slate-100">
                    <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
                      <ClipboardList className="w-4 h-4 text-slate-500" />
                      Histórico Completo
                    </h3>
                    
                    <div className="bg-slate-50 rounded-xl p-3 max-h-60 overflow-y-auto no-scrollbar border border-slate-200 space-y-2">
                      {[
                        ...(selectedOS.notes || []).map((n: any) => ({ type: 'note', ...n })),
                        ...(selectedOS.status_history || []).map((sh: any) => ({ type: 'status_change', ...sh }))
                      ]
                        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
                        .map((record: any, index: number) => (
                          <div key={`${record.type}-${record.id || index}`} className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm text-[11px]">
                            {record.type === 'status_change' ? (
                              <div className="flex items-start gap-2">
                                <AlertCircle className="w-3.5 h-3.5 text-sky-500 shrink-0 mt-0.5" />
                                <div>
                                  <span className="font-bold text-slate-700">Status alterado: </span>
                                  <span className="text-slate-600">
                                    {record.previous_status ? `${record.previous_status} → ` : ''}
                                    <span className="font-semibold text-sky-700">{record.status}</span>
                                  </span>
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-1">
                                <div className="flex items-center gap-1.5 mb-1">
                                  {record.category === 'aguardando_peca' && <span className="px-1.5 py-0.5 bg-orange-100 text-orange-700 rounded font-bold text-[9px] uppercase tracking-wider">Peça</span>}
                                  {record.category === 'servicos_realizados' && <span className="px-1.5 py-0.5 bg-sky-100 text-sky-700 rounded font-bold text-[9px] uppercase tracking-wider">Serviço</span>}
                                  {record.category === 'geral' && <span className="px-1.5 py-0.5 bg-slate-200 text-slate-700 rounded font-bold text-[9px] uppercase tracking-wider">Geral</span>}
                                </div>
                                <p className="text-slate-700 font-medium whitespace-pre-wrap">{record.note}</p>
                              </div>
                            )}
                            <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-100 text-[10px] text-slate-400 font-semibold">
                              <span>{record.profile?.name || 'Sistema'}</span>
                              <span>{new Date(record.created_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</span>
                            </div>
                          </div>
                      ))}
                      {(!selectedOS.notes?.length && !selectedOS.status_history?.length) && (
                        <p className="text-[11px] text-slate-400 font-medium italic text-center py-4">Nenhum histórico registrado.</p>
                      )}
                    </div>
                  </div>

                  {/* Adicionar Novos Registros */}
                  <div className="space-y-3 pt-4 border-t border-slate-100">
                    <h3 className="font-extrabold text-slate-800 text-sm">Adicionar Registro</h3>
                    <div className="space-y-2">
                      <div className="flex gap-2 items-start">
                        <textarea
                          value={newNotePeca}
                          onChange={(e) => setNewNotePeca(e.target.value)}
                          placeholder="Nota sobre peças..."
                          className="flex-1 text-[11px] p-2 rounded-lg border border-orange-200 focus:outline-none focus:border-orange-400 bg-orange-50/30 min-h-[40px]"
                        />
                        <PremiumButton
                          type="button"
                          onClick={() => handleAddNote(selectedOS.id, 'aguardando_peca', newNotePeca, setNewNotePeca)}
                          disabled={!newNotePeca.trim() || addingNote}
                          variant="outline"
                          className="shrink-0 text-[10px] py-1.5 px-3 h-auto text-orange-700 border-orange-200 hover:bg-orange-50 mt-1"
                        >
                          Salvar Peça
                        </PremiumButton>
                      </div>
                      <div className="flex gap-2 items-start">
                        <textarea
                          value={newNoteServico}
                          onChange={(e) => setNewNoteServico(e.target.value)}
                          placeholder="Nota sobre serviços..."
                          className="flex-1 text-[11px] p-2 rounded-lg border border-sky-200 focus:outline-none focus:border-sky-400 bg-sky-50/30 min-h-[40px]"
                        />
                        <PremiumButton
                          type="button"
                          onClick={() => handleAddNote(selectedOS.id, 'servicos_realizados', newNoteServico, setNewNoteServico)}
                          disabled={!newNoteServico.trim() || addingNote}
                          variant="outline"
                          className="shrink-0 text-[10px] py-1.5 px-3 h-auto text-sky-700 border-sky-200 hover:bg-sky-50 mt-1"
                        >
                          Salvar Serviço
                        </PremiumButton>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Botões de ação (Sticky Footer) */}
            <div className="sticky bottom-0 bg-white pt-4 pb-2 border-t border-slate-100 flex gap-3 mt-4 -mx-6 px-6 shadow-[0_-12px_16px_-4px_rgba(255,255,255,0.9)] shrink-0 z-10">
              <PremiumButton
                type="button"
                onClick={() => setIsModalOpen(false)}
                variant="outline"
                className="flex-1"
              >
                Voltar
              </PremiumButton>
              {selectedOS.status !== 'concluida' && selectedOS.status !== 'cancelada' && (
                <PremiumButton
                  type="submit"
                  loading={updating}
                  variant="primary"
                  className="flex-1"
                >
                  Atualizar
                </PremiumButton>
              )}
            </div>
          </form>
        )}
      </PremiumModal>
    </div>
  );
}
