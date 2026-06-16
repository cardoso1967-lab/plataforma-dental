'use client';

import React, { useEffect, useState } from 'react';
import { 
  Calendar, User, Clock, MapPin, Grid, List, Filter, 
  ChevronRight, Wrench, RefreshCw, X, AlertCircle, 
  ArrowRight, ShieldCheck, Tag, FileText, UserPlus, SlidersHorizontal, Info, ClipboardList,
  CheckCircle2
} from 'lucide-react';
import { createSupabaseBrowserClient } from '@/lib/supabase';
import { useAuth } from '@/components/AuthProvider';
import { assignTechnicianToOS, scheduleOSVisit } from '@/lib/service-orders';
import { getCustomerDisplayName } from '@/lib/customer-utils';

import { PageHero } from '@/components/ui/PageHero';
import { KanbanColumn } from '@/components/ui/KanbanColumn';
import { KanbanCard } from '@/components/ui/KanbanCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { PremiumModal } from '@/components/ui/PremiumModal';
import { PremiumInput } from '@/components/ui/PremiumInput';
import { PremiumButton } from '@/components/ui/PremiumButton';
import { StatusBadge } from '@/components/ui/StatusBadge';

interface Customer {
  id: string;
  company_name: string;
  trade_name: string | null;
  address_city: string | null;
  address_state: string | null;
}

interface ClientEquipment {
  id: string;
  name: string;
  brand: string | null;
  model: string | null;
}

interface Technician {
  id: string;
  profile?: {
    name: string;
  } | null;
}

interface ServiceOrder {
  id: string;
  customer_id: string;
  equipment_id: string | null;
  technician_id: string | null;
  status: string;
  priority: 'baixa' | 'media' | 'alta' | 'urgente';
  description: string;
  reported_issues: string | null;
  scheduled_date: string | null;
  completion_date: string | null;
  created_at: string;
  customer?: Customer | null;
  equipment?: ClientEquipment | null;
  technician?: Technician | null;
}

interface StatusHistory {
  id: string;
  status: string;
  created_at: string;
  notes: string | null;
  profiles?: {
    name: string;
  } | null;
}

const KANBAN_STATUSES = [
  { id: 'aberta', label: 'Solicitação recebida', color: 'bg-blue-50/60 text-blue-700 border-blue-200/60' },
  { id: 'em_analise', label: 'Em triagem', color: 'bg-indigo-50/60 text-indigo-700 border-indigo-200/60' },
  { id: 'tecnico_atribuido', label: 'Técnico atribuído', color: 'bg-purple-50/60 text-purple-700 border-purple-200/60' },
  { id: 'visita_agendada', label: 'Visita agendada', color: 'bg-emerald-50/60 text-emerald-700 border-emerald-200/60' },
  { id: 'em_atendimento', label: 'Em atendimento', color: 'bg-sky-50/60 text-sky-700 border-sky-200/60' },
  { id: 'aguardando_peca', label: 'Aguardando peça', color: 'bg-orange-50/60 text-orange-700 border-orange-200/60' },
  { id: 'orcamento_pendente', label: 'Aguardando aprovação', color: 'bg-amber-50/60 text-amber-700 border-amber-200/60' },
  { id: 'concluida', label: 'Concluído', color: 'bg-green-50/60 text-green-700 border-green-200/60' },
  { id: 'cancelada', label: 'Cancelado', color: 'bg-rose-50/60 text-rose-700 border-rose-200/60' },
];

const priorityMap = {
  baixa: { label: 'Baixa', class: 'bg-slate-50 text-slate-650 border border-slate-200/40' },
  media: { label: 'Média', class: 'bg-blue-50/50 text-blue-650 border border-blue-200/40' },
  alta: { label: 'Alta', class: 'bg-orange-50/50 text-orange-700 border border-orange-200/40' },
  urgente: { label: 'Urgente', class: 'bg-rose-50/80 text-rose-700 font-bold border border-rose-200 animate-pulse' },
};

export default function AdminAgendaPage() {
  const supabase = createSupabaseBrowserClient();
  const { profile: adminProfile } = useAuth();

  // Estados de datos
  const [serviceOrders, setServiceOrders] = useState<ServiceOrder[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Feedback de sucesso/erro inline
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 3500);
  };

  // Estados de visualización
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [showFilters, setShowFilters] = useState(false);

  // Estados de arrastre (Kanban)
  const [draggedOverCol, setDraggedOverCol] = useState<string | null>(null);

  // Estados del modal de detalles
  const [selectedOS, setSelectedOS] = useState<ServiceOrder | null>(null);
  const [statusHistory, setStatusHistory] = useState<StatusHistory[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Estados de asignación móvil y reprogramación rápida
  const [activeQuickOS, setActiveQuickOS] = useState<ServiceOrder | null>(null);
  const [quickActionType, setQuickActionType] = useState<'status' | 'tech' | 'date' | null>(null);
  const [quickForm, setQuickForm] = useState({
    status: '',
    technician_id: '',
    scheduled_date: '',
    notes: '',
  });

  // Filtros de Lista
  const [filters, setFilters] = useState({
    date: '',
    technician_id: '',
    customer_id: '',
    status: '',
    priority: '',
    city: '',
    equipment_type: '',
  });

  // Cargar datos principales
  const loadData = async () => {
    try {
      setLoading(true);
      const { data: osData, error: osError } = await supabase
        .from('service_orders')
        .select(`
          *,
          customer:customers(id, company_name, trade_name, address_city, address_state),
          equipment:client_equipment(id, name, brand, model),
          technician:technicians(
            id,
            profile:profiles(name)
          )
        `)
        .order('created_at', { ascending: false });

      if (osError) throw osError;
      setServiceOrders(osData || []);

      const { data: techData, error: techError } = await supabase
        .from('technicians')
        .select('id, profile:profiles(name)')
        .eq('is_active', true);
      if (techError) throw techError;
      
      const formattedTechs = (techData || []).map((t: any) => ({
        id: t.id,
        profile: Array.isArray(t.profile) ? t.profile[0] : t.profile
      }));
      setTechnicians(formattedTechs);

      const { data: custData, error: custError } = await supabase
        .from('customers')
        .select('id, company_name, trade_name, address_city, address_state');
      if (custError) throw custError;
      setCustomers(custData || []);

    } catch (err) {
      console.error('Erro ao carregar dados da agenda:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Cargar historial de status
  const loadStatusHistory = async (osId: string) => {
    try {
      setHistoryLoading(true);
      const { data, error } = await supabase
        .from('service_order_status_history')
        .select(`
          id,
          status,
          created_at,
          notes,
          profiles:profiles(name)
        `)
        .eq('service_order_id', osId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const formattedHistory = (data || []).map((h: any) => ({
        ...h,
        profiles: Array.isArray(h.profiles) ? h.profiles[0] : h.profiles
      }));
      setStatusHistory(formattedHistory);
    } catch (err) {
      console.error('Erro ao buscar histórico:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    if (selectedOS) {
      loadStatusHistory(selectedOS.id);
    }
  }, [selectedOS]);

  // Actualizar status de la orden de servicio
  const updateOSStatus = async (osId: string, newStatus: string, notes: string = '') => {
    if (!adminProfile?.id) return;
    try {
      setUpdatingId(osId);
      
      const previousOS = serviceOrders.find(o => o.id === osId);
      if (!previousOS) return;
      if (previousOS.status === newStatus) return;

      const { error: updateError } = await supabase
        .from('service_orders')
        .update({ status: newStatus })
        .eq('id', osId);

      if (updateError) throw updateError;

      const historyNotes = notes || `Status alterado de "${statusMap[previousOS.status]?.label || previousOS.status}" para "${statusMap[newStatus]?.label || newStatus}" via painel administrativo.`;
      
      const { error: historyError } = await supabase
        .from('service_order_status_history')
        .insert({
          service_order_id: osId,
          status: newStatus,
          changed_by: adminProfile.id,
          notes: historyNotes
        });

      if (historyError) throw historyError;

      setServiceOrders(prev => prev.map(os => {
        if (os.id === osId) {
          return { ...os, status: newStatus };
        }
        return os;
      }));

      if (selectedOS?.id === osId) {
        loadStatusHistory(osId);
      }

      showFeedback('success', 'Status atualizado com sucesso.');

    } catch (err: any) {
      showFeedback('error', 'Não foi possível concluir a ação. Tente novamente.');
      console.error('Erro ao atualizar status:', err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  // Reasignar técnico com histórico de status
  const assignTechnician = async (osId: string, techId: string | null) => {
    if (!adminProfile?.id) return;
    try {
      setUpdatingId(osId);
      
      if (!techId) {
        // Remover técnico sem alterar status
        const { error } = await supabase
          .from('service_orders')
          .update({ technician_id: null })
          .eq('id', osId);
        if (error) throw error;
      } else {
        const currentOS = serviceOrders.find(o => o.id === osId);
        const currentStatus = currentOS?.status || 'aberta';
        
        const { error } = await assignTechnicianToOS(
          supabase,
          osId,
          techId,
          adminProfile.id,
          currentStatus
        );
        if (error) throw new Error(error);
      }
      
      await loadData();
      showFeedback('success', 'Técnico atribuído com sucesso.');
    } catch (err: any) {
      showFeedback('error', 'Não foi possível concluir a ação. Tente novamente.');
      console.error('Erro ao designar técnico:', err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  // Re-programar fecha com histórico de status
  const rescheduleVisit = async (osId: string, dateStr: string) => {
    if (!adminProfile?.id) return;
    try {
      setUpdatingId(osId);
      const currentOS = serviceOrders.find(o => o.id === osId);
      const currentStatus = currentOS?.status || 'aberta';
      const technicianId = currentOS?.technician_id || null;
      
      const { error } = await scheduleOSVisit(
        supabase,
        osId,
        dateStr,
        adminProfile.id,
        currentStatus,
        technicianId
      );
      if (error) throw new Error(error);
      
      await loadData();
      showFeedback('success', 'Visita agendada com sucesso.');
    } catch (err: any) {
      showFeedback('error', 'Não foi possível concluir a ação. Tente novamente.');
      console.error('Erro ao agendar visita:', err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  // Drag and Drop
  const handleDragStart = (e: React.DragEvent, osId: string) => {
    e.dataTransfer.setData('text/plain', osId);
  };

  const handleDragOver = (e: React.DragEvent, statusId: string) => {
    e.preventDefault();
    setDraggedOverCol(statusId);
  };

  const handleDrop = async (e: React.DragEvent, statusId: string) => {
    e.preventDefault();
    setDraggedOverCol(null);
    const osId = e.dataTransfer.getData('text/plain');
    if (osId) {
      await updateOSStatus(osId, statusId);
    }
  };

  // Abrir barra móvil de acciones rápidas
  const openQuickAction = (os: ServiceOrder, type: 'status' | 'tech' | 'date') => {
    setActiveQuickOS(os);
    setQuickActionType(type);
    
    let formattedDate = '';
    if (os.scheduled_date) {
      const d = new Date(os.scheduled_date);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      formattedDate = `${year}-${month}-${day}T${hours}:${minutes}`;
    }

    setQuickForm({
      status: os.status,
      technician_id: os.technician_id || '',
      scheduled_date: formattedDate,
      notes: '',
    });
  };

  const handleSaveQuickAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeQuickOS) return;

    try {
      if (quickActionType === 'status') {
        await updateOSStatus(activeQuickOS.id, quickForm.status, quickForm.notes);
      } else if (quickActionType === 'tech') {
        await assignTechnician(activeQuickOS.id, quickForm.technician_id || null);
      } else if (quickActionType === 'date') {
        await rescheduleVisit(activeQuickOS.id, quickForm.scheduled_date);
      }
      setActiveQuickOS(null);
      setQuickActionType(null);
    } catch (err: any) {
      showFeedback('error', 'Não foi possível concluir a ação. Tente novamente.');
      console.error('Erro na ação rápida:', err.message);
    }
  };

  // Filtrado de lista
  const getFilteredServiceOrders = () => {
    return serviceOrders.filter(os => {
      if (filters.date) {
        if (!os.scheduled_date) return false;
        const osDate = new Date(os.scheduled_date).toDateString();
        const filterDate = new Date(filters.date).toDateString();
        if (osDate !== filterDate) return false;
      }
      if (filters.technician_id && os.technician_id !== filters.technician_id) {
        return false;
      }
      if (filters.customer_id && os.customer_id !== filters.customer_id) {
        return false;
      }
      if (filters.status && os.status !== filters.status) {
        return false;
      }
      if (filters.priority && os.priority !== filters.priority) {
        return false;
      }
      if (filters.city) {
        const cityLower = (os.customer?.address_city || '').toLowerCase();
        if (!cityLower.includes(filters.city.toLowerCase())) return false;
      }
      if (filters.equipment_type) {
        const eqName = (os.equipment?.name || '').toLowerCase();
        const eqBrand = (os.equipment?.brand || '').toLowerCase();
        const eqModel = (os.equipment?.model || '').toLowerCase();
        const filterLower = filters.equipment_type.toLowerCase();
        if (!eqName.includes(filterLower) && !eqBrand.includes(filterLower) && !eqModel.includes(filterLower)) {
          return false;
        }
      }
      return true;
    });
  };

  const filteredOrdersForList = getFilteredServiceOrders();

  // Iniciales del técnico para el avatar
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Feedback Toast Inline */}
      {feedback && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl text-xs font-bold animate-in slide-in-from-bottom-4 duration-300 ${
          feedback.type === 'success'
            ? 'bg-emerald-600 text-white'
            : 'bg-rose-600 text-white'
        }`}>
          {feedback.type === 'success'
            ? <CheckCircle2 className="w-4 h-4 shrink-0" />
            : <AlertCircle className="w-4 h-4 shrink-0" />
          }
          {feedback.message}
        </div>
      )}
      {/* Header y Alternador Premium */}
      <PageHero
        title="Agenda Operativa"
        description="Acompanhe o status dos atendimentos em tempo real. Arraste os chamados para atualizar o status ou filtre a lista completa."
        badge="Operacional"
        icon={Calendar}
        rightElement={
          <div className="flex items-center gap-2 bg-slate-800/80 p-1.5 rounded-2xl border border-slate-700/50 shadow-xs">
            <button
              onClick={() => setViewMode('kanban')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 ${
                viewMode === 'kanban' 
                  ? 'bg-slate-900 text-white shadow-xs' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Grid className="w-4 h-4" />
              <span>Kanban</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 ${
                viewMode === 'list' 
                  ? 'bg-slate-900 text-white shadow-xs' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <List className="w-4 h-4" />
              <span>Lista</span>
            </button>
          </div>
        }
      />

      {/* Resumo Operativo Compacto */}
      {!loading && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 bg-white border border-slate-200/60 p-3.5 rounded-2xl shadow-3xs text-[11px] font-bold text-slate-700 text-left">
          <div className="flex flex-col justify-center px-4 py-2 border-r border-slate-100 last:border-0">
            <span className="text-[9px] uppercase tracking-wider text-slate-400 font-extrabold mb-1">Total de OS</span>
            <span className="text-base font-black text-slate-900 leading-none">{serviceOrders.length}</span>
          </div>
          <div className="flex flex-col justify-center px-4 py-2 border-r border-slate-100 last:border-0">
            <span className="text-[9px] uppercase tracking-wider text-rose-500 font-extrabold mb-1 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
              Urgentes
            </span>
            <span className="text-base font-black text-rose-600 leading-none">
              {serviceOrders.filter(os => os.priority === 'urgente' && os.status !== 'concluida' && os.status !== 'cancelada').length}
            </span>
          </div>
          <div className="flex flex-col justify-center px-4 py-2 border-r border-slate-100 last:border-0">
            <span className="text-[9px] uppercase tracking-wider text-sky-500 font-extrabold mb-1">Em Campo</span>
            <span className="text-base font-black text-sky-600 leading-none">
              {serviceOrders.filter(os => os.status === 'em_atendimento').length}
            </span>
          </div>
          <div className="flex flex-col justify-center px-4 py-2 border-r border-slate-100 last:border-0">
            <span className="text-[9px] uppercase tracking-wider text-amber-500 font-extrabold mb-1">Aguardando Peça</span>
            <span className="text-base font-black text-amber-600 leading-none">
              {serviceOrders.filter(os => os.status === 'aguardando_peca').length}
            </span>
          </div>
          <div className="flex flex-col justify-center px-4 py-2 last:border-0">
            <span className="text-[9px] uppercase tracking-wider text-emerald-500 font-extrabold mb-1">Concluídas</span>
            <span className="text-base font-black text-emerald-600 leading-none">
              {serviceOrders.filter(os => os.status === 'concluida').length}
            </span>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-20 text-slate-400 font-medium text-xs">
          Carregando ordens de serviço...
        </div>
      ) : (
        <>
          {/* VISTA KANBAN */}
          {viewMode === 'kanban' && (
            <div className="overflow-x-auto pb-6 no-scrollbar -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8">
              <div className="flex gap-4.5 min-w-[2200px] items-start py-2">
                {KANBAN_STATUSES.map((statusCol) => {
                  const ordersInCol = serviceOrders.filter(os => os.status === statusCol.id);
                  const isOver = draggedOverCol === statusCol.id;

                  return (
                    <KanbanColumn
                      key={statusCol.id}
                      id={statusCol.id}
                      label={statusCol.label}
                      badgeCount={ordersInCol.length}
                      colorStyles={statusCol.color}
                      isOver={isOver}
                      onDragOver={(e) => handleDragOver(e, statusCol.id)}
                      onDragLeave={() => setDraggedOverCol(null)}
                      onDrop={(e) => handleDrop(e, statusCol.id)}
                    >
                      {ordersInCol.map((os) => (
                        <KanbanCard
                          key={os.id}
                          id={os.id}
                          priority={os.priority}
                          customerName={getCustomerDisplayName(os.customer)}
                          equipmentName={os.equipment?.name}
                          technicianName={os.technician?.profile?.name}
                          scheduledDate={os.scheduled_date ? new Date(os.scheduled_date).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : undefined}
                          onDragStart={(e) => handleDragStart(e, os.id)}
                          onDetailClick={() => setSelectedOS(os)}
                          quickActions={
                            <>
                              <button
                                onClick={() => openQuickAction(os, 'status')}
                                className="text-[8.5px] font-black px-2.5 py-1.5 bg-slate-50 hover:bg-sky-50 hover:text-sky-700 hover:border-sky-200/60 rounded-md text-slate-600 transition-colors border border-slate-200/40"
                              >
                                Status
                              </button>
                              <button
                                onClick={() => openQuickAction(os, 'tech')}
                                className="text-[8.5px] font-black px-2.5 py-1.5 bg-slate-50 hover:bg-sky-50 hover:text-sky-700 hover:border-sky-200/60 rounded-md text-slate-600 transition-colors border border-slate-200/40"
                              >
                                Técnico
                              </button>
                              <button
                                onClick={() => openQuickAction(os, 'date')}
                                className="text-[8.5px] font-black px-2.5 py-1.5 bg-slate-50 hover:bg-sky-50 hover:text-sky-700 hover:border-sky-200/60 rounded-md text-slate-600 transition-colors border border-slate-200/40"
                              >
                                Agendar
                              </button>
                            </>
                          }
                        />
                      ))}

                      {ordersInCol.length === 0 && (
                        <EmptyState
                          title="Sem chamados"
                          description="Arraste chamados aqui"
                          icon={<ClipboardList className="w-5 h-5" />}
                          variant="compact"
                        />
                      )}
                    </KanbanColumn>
                  );
                })}
              </div>
            </div>
          )}

          {/* VISTA LISTA */}
          {viewMode === 'list' && (
            <div className="space-y-6">
              {/* Filtros Plegables */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="w-full flex items-center justify-between p-5 text-xs font-black text-slate-800 focus:outline-none hover:bg-slate-50/40 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <SlidersHorizontal className="w-4.5 h-4.5 text-brand-clinical" />
                    <span>Filtros Operacionais Avançados</span>
                  </span>
                  <span className="text-[10px] font-bold text-brand-clinical hover:underline">
                    {showFilters ? 'Recolher' : 'Expandir'}
                  </span>
                </button>

                {showFilters && (
                  <div className="p-5 border-t border-slate-50 bg-slate-50/20 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 text-xs animate-in fade-in duration-300">
                    <div className="space-y-1">
                      <label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">Data Agendada</label>
                      <input 
                        type="date" 
                        value={filters.date}
                        onChange={(e) => setFilters({ ...filters, date: e.target.value })}
                        className="w-full border border-slate-200 rounded-xl p-2 text-xs focus:outline-none focus:border-brand-clinical bg-white font-medium"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">Técnico</label>
                      <select 
                        value={filters.technician_id}
                        onChange={(e) => setFilters({ ...filters, technician_id: e.target.value })}
                        className="w-full border border-slate-200 rounded-xl p-2 text-xs focus:outline-none focus:border-brand-clinical bg-white font-medium"
                      >
                        <option value="">Todos</option>
                        {technicians.map(t => (
                          <option key={t.id} value={t.id}>{t.profile?.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">Cliente</label>
                      <select 
                        value={filters.customer_id}
                        onChange={(e) => setFilters({ ...filters, customer_id: e.target.value })}
                        className="w-full border border-slate-200 rounded-xl p-2 text-xs focus:outline-none focus:border-brand-clinical bg-white font-medium"
                      >
                        <option value="">Todos</option>
                        {customers.map(c => (
                          <option key={c.id} value={c.id}>{getCustomerDisplayName(c)}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">Status</label>
                      <select 
                        value={filters.status}
                        onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                        className="w-full border border-slate-200 rounded-xl p-2 text-xs focus:outline-none focus:border-brand-clinical bg-white font-medium"
                      >
                        <option value="">Todos</option>
                        {KANBAN_STATUSES.map(s => (
                          <option key={s.id} value={s.id}>{s.label}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">Prioridade</label>
                      <select 
                        value={filters.priority}
                        onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
                        className="w-full border border-slate-200 rounded-xl p-2 text-xs focus:outline-none focus:border-brand-clinical bg-white font-medium"
                      >
                        <option value="">Todas</option>
                        <option value="baixa">Baixa</option>
                        <option value="media">Média</option>
                        <option value="alta">Alta</option>
                        <option value="urgente">Urgente</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">Cidade</label>
                      <input 
                        type="text" 
                        placeholder="Ex: Campinas"
                        value={filters.city}
                        onChange={(e) => setFilters({ ...filters, city: e.target.value })}
                        className="w-full border border-slate-200 rounded-xl p-2 text-xs focus:outline-none focus:border-brand-clinical bg-white font-medium"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">Equipamento</label>
                      <input 
                        type="text" 
                        placeholder="Ex: Cadeira"
                        value={filters.equipment_type}
                        onChange={(e) => setFilters({ ...filters, equipment_type: e.target.value })}
                        className="w-full border border-slate-200 rounded-xl p-2 text-xs focus:outline-none focus:border-brand-clinical bg-white font-medium"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Contenedor de Lista */}
              <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-4 shadow-sm">
                <h3 className="font-bold text-sm text-brand-dark flex items-center gap-1.5 pb-2 border-b border-slate-50">
                  Visitas e Chamados Filtrados ({filteredOrdersForList.length})
                </h3>

                {filteredOrdersForList.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 font-medium text-xs border-2 border-dashed border-slate-100 rounded-2xl">
                    Nenhuma ordem de serviço corresponde aos filtros selecionados.
                  </div>
                ) : (
                  <>
                    {/* Vista TABLE para Desktop */}
                    <div className="hidden md:block overflow-x-auto no-scrollbar">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="text-slate-400 font-bold border-b border-slate-100">
                            <th className="pb-3">OS</th>
                            <th className="pb-3 px-2">Cliente</th>
                            <th className="pb-3 px-2">Cidade</th>
                            <th className="pb-3 px-2">Equipamento</th>
                            <th className="pb-3 px-2">Técnico</th>
                            <th className="pb-3 px-2">Data Agendada</th>
                            <th className="pb-3 px-2 text-center">Prioridade</th>
                            <th className="pb-3 px-2 text-center">Status</th>
                            <th className="pb-3 text-right">Ação</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {filteredOrdersForList.map((os) => (
                            <tr key={os.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="py-4 font-mono font-bold text-brand-clinical">
                                #{os.id.substring(0, 8).toUpperCase()}
                              </td>
                              <td className="py-4 px-2 font-bold text-brand-dark">
                                {getCustomerDisplayName(os.customer)}
                              </td>
                              <td className="py-4 px-2 text-slate-500 font-semibold">
                                {os.customer?.address_city ? `${os.customer.address_city} - ${os.customer.address_state || ''}` : '—'}
                              </td>
                              <td className="py-4 px-2 font-semibold text-slate-600">
                                {os.equipment?.name || '—'}
                              </td>
                              <td className="py-4 px-2">
                                {os.technician?.profile ? (
                                  <span className="font-semibold text-slate-700">{os.technician.profile.name}</span>
                                ) : (
                                  <span className="text-slate-400 italic font-medium">Não atribuído</span>
                                )}
                              </td>
                              <td className="py-4 px-2 font-semibold text-slate-600">
                                {os.scheduled_date ? new Date(os.scheduled_date).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : '—'}
                              </td>
                              <td className="py-4 px-2 text-center">
                                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                                  priorityMap[os.priority]?.class || 'bg-slate-100'
                                }`}>
                                  {priorityMap[os.priority]?.label || os.priority}
                                </span>
                              </td>
                              <td className="py-4 px-2 text-center">
                                <span className={`text-[9.5px] font-bold px-2.5 py-0.5 rounded-full ${
                                  statusColColorMap(os.status)
                                }`}>
                                  {statusMap[os.status]?.label || os.status}
                                </span>
                              </td>
                              <td className="py-4 text-right">
                                <button
                                  onClick={() => setSelectedOS(os)}
                                  className="text-brand-clinical hover:underline font-bold text-[11px]"
                                >
                                  Detalhes
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Vista CARDS responsiva para Móviles */}
                    <div className="grid grid-cols-1 gap-3.5 md:hidden">
                      {filteredOrdersForList.map((os) => (
                        <div 
                          key={os.id}
                          className="border border-slate-100 rounded-2xl p-4.5 space-y-4 bg-slate-50/20 hover:bg-slate-50 transition-colors shadow-xs text-left"
                        >
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-mono font-bold text-brand-clinical">
                              #{os.id.substring(0, 8).toUpperCase()}
                            </span>
                            <span className={`text-[8.5px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                              priorityMap[os.priority]?.class || 'bg-slate-100'
                            }`}>
                              {priorityMap[os.priority]?.label || os.priority}
                            </span>
                          </div>

                          <div className="space-y-1">
                            <h4 className="font-extrabold text-xs text-brand-dark leading-tight">{getCustomerDisplayName(os.customer)}</h4>
                            <p className="text-[10.5px] font-semibold text-slate-500 flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-slate-400" />
                              <span>{os.customer?.address_city ? `${os.customer.address_city} - ${os.customer.address_state || ''}` : 'Sem cidade'}</span>
                            </p>
                          </div>

                          <div className="grid grid-cols-2 gap-3 text-[10px] font-semibold text-slate-600 pt-3 border-t border-slate-50/70">
                            <div>
                              <span className="text-[8.5px] font-extrabold text-slate-400 block uppercase tracking-wide">Equipamento</span>
                              <span className="line-clamp-1">{os.equipment?.name || 'Não informado'}</span>
                            </div>
                            <div>
                              <span className="text-[8.5px] font-extrabold text-slate-400 block uppercase tracking-wide">Técnico Designado</span>
                              <span className="line-clamp-1">{os.technician?.profile?.name || 'Não designado'}</span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-3 border-t border-slate-50/70">
                            <span className={`text-[9.5px] font-bold px-2.5 py-0.5 rounded-full ${
                              statusColColorMap(os.status)
                            }`}>
                              {statusMap[os.status]?.label || os.status}
                            </span>
                            <button
                              onClick={() => setSelectedOS(os)}
                              className="text-brand-clinical text-xs font-bold hover:underline"
                            >
                              Ver detalhes
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </>
      )}
      <PremiumModal
        isOpen={!!selectedOS}
        onClose={() => setSelectedOS(null)}
        title={selectedOS ? `OS #${selectedOS.id.substring(0, 8).toUpperCase()}` : ''}
        size="lg"
      >
        {selectedOS && (
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <StatusBadge
                label={statusMap[selectedOS.status]?.label || selectedOS.status}
                type={selectedOS.status === 'concluida' ? 'success' : selectedOS.status === 'cancelada' ? 'error' : 'info'}
              />
              <h3 className="font-extrabold text-sm text-slate-800 leading-tight">
                {getCustomerDisplayName(selectedOS.customer)}
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pb-6 border-b border-slate-100">
              <div className="space-y-3 text-left">
                <h4 className="font-bold text-xs text-sky-600 uppercase tracking-wider flex items-center gap-1">
                  <FileText className="w-4 h-4" /> Detalhes do Chamado
                </h4>
                <div className="space-y-2 text-[11px] font-semibold text-slate-600">
                  <p><span className="text-slate-400 font-medium">Equipamento:</span> {selectedOS.equipment ? `${selectedOS.equipment.name} (${selectedOS.equipment.brand || ''} ${selectedOS.equipment.model || ''})` : 'Sem equipamento'}</p>
                  <p><span className="text-slate-400 font-medium">Prioridade:</span> <span className={`px-2 py-0.5 rounded-md ${priorityMap[selectedOS.priority]?.class}`}>{priorityMap[selectedOS.priority]?.label}</span></p>
                  <p><span className="text-slate-400 font-medium">Data Abertura:</span> {new Date(selectedOS.created_at).toLocaleDateString('pt-BR')} {new Date(selectedOS.created_at).toLocaleTimeString('pt-BR')}</p>
                  <p><span className="text-slate-400 font-medium">Agendamento Visita:</span> {selectedOS.scheduled_date ? new Date(selectedOS.scheduled_date).toLocaleString('pt-BR') : 'Não agendada'}</p>
                </div>
              </div>

              <div className="space-y-3 text-left">
                <h4 className="font-bold text-xs text-sky-600 uppercase tracking-wider flex items-center gap-1">
                  <User className="w-4 h-4" /> Responsáveis e Contato
                </h4>
                <div className="space-y-2 text-[11px] font-semibold text-slate-600">
                  <p><span className="text-slate-400 font-medium">Técnico Designado:</span> {selectedOS.technician?.profile?.name || 'Aguardando Técnico'}</p>
                  <p><span className="text-slate-400 font-medium">Cidade/UF Cliente:</span> {selectedOS.customer?.address_city ? `${selectedOS.customer.address_city} - ${selectedOS.customer.address_state || ''}` : '—'}</p>
                  <p><span className="text-slate-400 font-medium">Nome Fantasia:</span> {selectedOS.customer?.trade_name || '—'}</p>
                </div>
              </div>

              <div className="sm:col-span-2 space-y-2 text-left">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Descrição do Problema</span>
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {selectedOS.description}
                </div>
              </div>

              {selectedOS.reported_issues && (
                <div className="sm:col-span-2 space-y-2 text-left">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Observações de Triagem</span>
                  <div className="bg-amber-50/20 border border-amber-100/60 rounded-2xl p-4 text-xs text-amber-900/80 leading-relaxed whitespace-pre-wrap">
                    {selectedOS.reported_issues}
                  </div>
                </div>
              )}
            </div>

            {/* Histórico de Alterações */}
            <div className="space-y-4">
              <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <RefreshCw className="w-4 h-4 text-sky-600" />
                Histórico de Status da OS
              </h4>

              {historyLoading ? (
                <div className="text-xs text-slate-400">Carregando histórico...</div>
              ) : statusHistory.length === 0 ? (
                <div className="text-xs text-slate-400 italic">Nenhum histórico registrado para esta ordem.</div>
              ) : (
                <div className="relative border-l border-slate-200 pl-4 space-y-5 ml-1.5 py-1">
                  {statusHistory.map((hist) => (
                    <div key={hist.id} className="relative space-y-1.5 text-left">
                      {/* Dot */}
                      <div className="absolute -left-[21px] top-1.5 bg-white border border-sky-600 w-2 h-2 rounded-full" />
                      
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <StatusBadge
                          label={statusMap[hist.status]?.label || hist.status}
                          type={hist.status === 'concluida' ? 'success' : hist.status === 'cancelada' ? 'error' : 'info'}
                          className="self-start"
                        />
                        <span className="text-[9px] text-slate-400 font-medium">
                          {new Date(hist.created_at).toLocaleString('pt-BR')}
                        </span>
                      </div>

                      <p className="text-[10.5px] text-slate-600 font-semibold leading-relaxed">
                        {hist.notes || 'Status alterado.'}
                      </p>
                      
                      <p className="text-[8.5px] text-slate-400 font-bold uppercase tracking-wider">
                        Responsável: {hist.profiles?.name || 'Sistema'}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
              <PremiumButton
                onClick={() => setSelectedOS(null)}
                variant="primary"
              >
                Fechar Detalhes
              </PremiumButton>
            </div>
          </div>
        )}
      </PremiumModal>

      {/* PANEL MÓVIL DE ACCIONES RÁPIDAS */}
      <PremiumModal
        isOpen={!!activeQuickOS && !!quickActionType}
        onClose={() => { setActiveQuickOS(null); setQuickActionType(null); }}
        title={
          quickActionType === 'status' ? 'Alterar Status da OS' :
          quickActionType === 'tech' ? 'Designar Técnico' :
          quickActionType === 'date' ? 'Agendar Visita' : ''
        }
        size="sm"
      >
        {activeQuickOS && quickActionType && (
          <form onSubmit={handleSaveQuickAction} className="space-y-4">
            <p className="text-[10px] text-slate-500 font-medium">
              Atualizando OS de <span className="font-bold text-slate-800">{getCustomerDisplayName(activeQuickOS.customer)}</span> (OS #{activeQuickOS.id.substring(0, 6).toUpperCase()})
            </p>

            {quickActionType === 'status' && (
              <div className="space-y-3">
                <PremiumInput
                  label="Novo Status"
                  name="status"
                  as="select"
                  value={quickForm.status}
                  onChange={(e) => setQuickForm({ ...quickForm, status: e.target.value })}
                  options={KANBAN_STATUSES.map(s => ({ value: s.id, label: s.label }))}
                />
                <PremiumInput
                  label="Observação / Nota de Status"
                  name="notes"
                  as="textarea"
                  value={quickForm.notes}
                  onChange={(e) => setQuickForm({ ...quickForm, notes: e.target.value })}
                  placeholder="Motivo da alteração..."
                  rows={3}
                />
              </div>
            )}

            {quickActionType === 'tech' && (
              <PremiumInput
                label="Técnico Designado"
                name="technician_id"
                as="select"
                value={quickForm.technician_id}
                onChange={(e) => setQuickForm({ ...quickForm, technician_id: e.target.value })}
                placeholder="Não designado (Aguardando)"
                options={technicians.map(t => ({ value: t.id, label: t.profile?.name || 'Técnico' }))}
              />
            )}

            {quickActionType === 'date' && (
              <PremiumInput
                label="Data e Hora Programada"
                name="scheduled_date"
                type="datetime-local"
                value={quickForm.scheduled_date}
                onChange={(e) => setQuickForm({ ...quickForm, scheduled_date: e.target.value })}
              />
            )}

            <div className="flex gap-2 justify-end pt-4 border-t border-slate-100">
              <PremiumButton
                onClick={() => { setActiveQuickOS(null); setQuickActionType(null); }}
                variant="outline"
              >
                Cancelar
              </PremiumButton>
              <PremiumButton
                type="submit"
                variant="primary"
              >
                Confirmar Alteração
              </PremiumButton>
            </div>
          </form>
        )}
      </PremiumModal>
    </div>
  );
}

// Helpers
function statusColColorMap(statusId: string) {
  const match = KANBAN_STATUSES.find(s => s.id === statusId);
  return match ? match.color : 'bg-slate-100 text-slate-600';
}

const statusMap: Record<string, { label: string; class: string }> = {
  aberta: { label: 'Solicitação recebida', class: 'bg-blue-50 text-blue-700 border border-blue-200' },
  em_analise: { label: 'Em triagem', class: 'bg-indigo-50 text-indigo-700 border border-indigo-200' },
  tecnico_atribuido: { label: 'Técnico atribuído', class: 'bg-purple-50 text-purple-700 border border-purple-200' },
  visita_agendada: { label: 'Visita agendada', class: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
  em_atendimento: { label: 'Em atendimento', class: 'bg-sky-50 text-sky-700 border border-sky-200' },
  aguardando_peca: { label: 'Aguardando peça', class: 'bg-orange-50 text-orange-700 border border-orange-200' },
  orcamento_pendente: { label: 'Aguardando aprovação', class: 'bg-amber-50 text-amber-700 border border-amber-200' },
  concluida: { label: 'Concluído', class: 'bg-green-50 text-green-700 border border-green-200' },
  cancelada: { label: 'Cancelado', class: 'bg-rose-50 text-rose-700 border border-rose-200' },
};
