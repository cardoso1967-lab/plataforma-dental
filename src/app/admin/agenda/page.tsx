'use client';

import React, { useEffect, useState } from 'react';
import { 
  Calendar, User, Clock, MapPin, Grid, List, Filter, 
  ChevronRight, Wrench, RefreshCw, X, AlertCircle, 
  ArrowRight, ShieldCheck, Tag, FileText, UserPlus, SlidersHorizontal
} from 'lucide-react';
import { createSupabaseBrowserClient } from '@/lib/supabase';
import { useAuth } from '@/components/AuthProvider';

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

// Configuración de los 9 estados Kanban
const KANBAN_STATUSES = [
  { id: 'aberta', label: 'Solicitação recebida', color: 'bg-blue-50/50 border-blue-200 text-blue-800' },
  { id: 'em_analise', label: 'Em triagem', color: 'bg-indigo-50/50 border-indigo-200 text-indigo-800' },
  { id: 'tecnico_atribuido', label: 'Técnico atribuído', color: 'bg-purple-50/50 border-purple-200 text-purple-800' },
  { id: 'visita_agendada', label: 'Visita agendada', color: 'bg-emerald-50/50 border-emerald-200 text-emerald-800' },
  { id: 'em_atendimento', label: 'Em atendimento', color: 'bg-sky-50/50 border-sky-200 text-sky-800' },
  { id: 'aguardando_peca', label: 'Aguardando peça', color: 'bg-orange-50/50 border-orange-200 text-orange-800' },
  { id: 'orcamento_pendente', label: 'Aguardando aprovação', color: 'bg-amber-50/50 border-amber-200 text-amber-800' },
  { id: 'concluida', label: 'Concluído', color: 'bg-green-50/50 border-green-200 text-green-800' },
  { id: 'cancelada', label: 'Cancelado', color: 'bg-rose-50/50 border-rose-200 text-rose-800' },
];

const priorityMap = {
  baixa: { label: 'Baixa', class: 'bg-slate-100 text-slate-600' },
  media: { label: 'Média', class: 'bg-blue-50 text-blue-600' },
  alta: { label: 'Alta', class: 'bg-orange-50 text-orange-600' },
  urgente: { label: 'Urgente', class: 'bg-rose-50 text-rose-700 font-bold border border-rose-200' },
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

  // Estados de visualización
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');

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
      // 1. Cargar OS
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

      // 2. Cargar técnicos activos
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

      // 3. Cargar clientes para filtros
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

  // Cargar historial de status de una OS específica
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

  // Actualizar status de la orden de servicio en BD y registrar historial
  const updateOSStatus = async (osId: string, newStatus: string, notes: string = '') => {
    if (!adminProfile?.id) return;
    try {
      setUpdatingId(osId);
      
      // Obtener el status anterior
      const previousOS = serviceOrders.find(o => o.id === osId);
      if (!previousOS) return;
      if (previousOS.status === newStatus) return; // No hay cambios

      // 1. Actualizar service_orders
      const { error: updateError } = await supabase
        .from('service_orders')
        .update({ status: newStatus })
        .eq('id', osId);

      if (updateError) throw updateError;

      // 2. Registrar historial en service_order_status_history
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

      // Actualizar localmente de manera optimista
      setServiceOrders(prev => prev.map(os => {
        if (os.id === osId) {
          return { ...os, status: newStatus };
        }
        return os;
      }));

      // Si el modal de detalles está abierto, refrescar su historial
      if (selectedOS?.id === osId) {
        loadStatusHistory(osId);
      }

    } catch (err: any) {
      alert('Erro ao atualizar status: ' + err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  // Reasignar técnico
  const assignTechnician = async (osId: string, techId: string | null) => {
    try {
      setUpdatingId(osId);
      const { error } = await supabase
        .from('service_orders')
        .update({ technician_id: techId })
        .eq('id', osId);

      if (error) throw error;
      
      // Actualizar local
      await loadData();
    } catch (err: any) {
      alert('Erro ao designar técnico: ' + err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  // Re-programar fecha de visita
  const rescheduleVisit = async (osId: string, dateStr: string) => {
    try {
      setUpdatingId(osId);
      const scheduledDate = dateStr ? new Date(dateStr).toISOString() : null;
      
      const { error } = await supabase
        .from('service_orders')
        .update({ scheduled_date: scheduledDate })
        .eq('id', osId);

      if (error) throw error;

      await loadData();
    } catch (err: any) {
      alert('Erro ao agendar visita: ' + err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  // Drag and Drop handlers (Desktop)
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

  // Guardar acción rápida móvil
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
      alert('Erro na ação rápida: ' + err.message);
    }
  };

  // Filtrado de lista en frontend
  const getFilteredServiceOrders = () => {
    return serviceOrders.filter(os => {
      // Filtrar por fecha
      if (filters.date) {
        if (!os.scheduled_date) return false;
        const osDate = new Date(os.scheduled_date).toDateString();
        const filterDate = new Date(filters.date).toDateString();
        if (osDate !== filterDate) return false;
      }
      // Filtrar por técnico
      if (filters.technician_id && os.technician_id !== filters.technician_id) {
        return false;
      }
      // Filtrar por cliente
      if (filters.customer_id && os.customer_id !== filters.customer_id) {
        return false;
      }
      // Filtrar por status
      if (filters.status && os.status !== filters.status) {
        return false;
      }
      // Filtrar por prioridad
      if (filters.priority && os.priority !== filters.priority) {
        return false;
      }
      // Filtrar por ciudad del cliente
      if (filters.city) {
        const cityLower = (os.customer?.address_city || '').toLowerCase();
        if (!cityLower.includes(filters.city.toLowerCase())) return false;
      }
      // Filtrar por tipo/marca de equipo
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

  return (
    <div className="space-y-8">
      {/* Header y Navegación de Vistas */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-extrabold text-brand-dark tracking-tight flex items-center gap-2">
            <Calendar className="w-7 h-7 text-brand-clinical" />
            Agenda Operativa
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Gerencie o fluxo de suporte técnico. Arraste os chamados para atualizar status ou filtre a lista.
          </p>
        </div>

        {/* Alternador de Vistas */}
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl self-start md:self-auto border border-slate-200">
          <button
            onClick={() => setViewMode('kanban')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'kanban' 
                ? 'bg-white text-brand-dark shadow-xs' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Grid className="w-4 h-4" />
            <span>Kanban</span>
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'list' 
                ? 'bg-white text-brand-dark shadow-xs' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <List className="w-4 h-4" />
            <span>Lista</span>
          </button>
          
          {/* Estructura para Calendario Futuro */}
          <button
            disabled
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-400 bg-transparent border-none cursor-not-allowed"
            title="Visualização em Calendário (Próxima Fase)"
          >
            <Calendar className="w-4 h-4 text-slate-300" />
            <span>Calendário <span className="text-[8px] px-1 py-0.2 bg-slate-200 text-slate-500 rounded font-bold">Breve</span></span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-slate-400 font-medium text-xs">
          Carregando ordens de serviço...
        </div>
      ) : (
        <>
          {/* VISTA KANBAN */}
          {viewMode === 'kanban' && (
            <div className="overflow-x-auto pb-4 no-scrollbar -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8">
              <div className="flex gap-4 min-w-[1900px] items-start">
                {KANBAN_STATUSES.map((statusCol) => {
                  const ordersInCol = serviceOrders.filter(os => os.status === statusCol.id);
                  const isOver = draggedOverCol === statusCol.id;

                  return (
                    <div
                      key={statusCol.id}
                      onDragOver={(e) => handleDragOver(e, statusCol.id)}
                      onDragLeave={() => setDraggedOverCol(null)}
                      onDrop={(e) => handleDrop(e, statusCol.id)}
                      className={`flex-1 min-w-[200px] bg-slate-100/60 border border-slate-200/50 rounded-2xl p-3 space-y-3 transition-all ${
                        isOver ? 'bg-sky-50/50 border-2 border-dashed border-brand-clinical scale-[1.01]' : ''
                      }`}
                    >
                      {/* Column Header */}
                      <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                        <span className="font-bold text-xs text-brand-dark leading-tight">{statusCol.label}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-200/80 text-slate-600 rounded-full">
                          {ordersInCol.length}
                        </span>
                      </div>

                      {/* Column Cards */}
                      <div className="space-y-2.5 max-h-[70vh] overflow-y-auto pr-0.5 no-scrollbar min-h-[150px]">
                        {ordersInCol.map((os) => (
                          <div
                            key={os.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, os.id)}
                            className="bg-white rounded-xl p-3 border border-slate-100 hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing space-y-3 shadow-xs"
                          >
                            {/* Card Header */}
                            <div className="flex justify-between items-start gap-1">
                              <span className="text-[9px] font-mono font-bold text-brand-clinical bg-sky-50 px-1.5 py-0.5 rounded">
                                #{os.id.substring(0, 6).toUpperCase()}
                              </span>
                              <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${
                                priorityMap[os.priority as keyof typeof priorityMap]?.class || 'bg-slate-100'
                              }`}>
                                {priorityMap[os.priority as keyof typeof priorityMap]?.label || os.priority}
                              </span>
                            </div>

                            {/* Client & Equipment info */}
                            <div className="space-y-1 text-left">
                              <h4 className="font-extrabold text-[11px] text-brand-dark line-clamp-1">
                                {os.customer?.company_name}
                              </h4>
                              {os.equipment ? (
                                <p className="text-[9px] font-medium text-slate-500 flex items-center gap-0.5">
                                  <Wrench className="w-3 h-3 text-slate-400 flex-shrink-0" />
                                  <span className="line-clamp-1">{os.equipment.name}</span>
                                </p>
                              ) : (
                                <span className="text-[8px] text-slate-400 italic">Sem equipamento</span>
                              )}
                            </div>

                            {/* Technician asignado */}
                            <div className="pt-2 border-t border-slate-50 flex flex-col gap-1 text-[9px] text-slate-600 font-semibold">
                              <div className="flex items-center gap-1">
                                <User className="w-3 h-3 text-brand-clinical" />
                                <span className="line-clamp-1">
                                  Téc: {os.technician?.profile?.name || 'Não designado'}
                                </span>
                              </div>
                              {os.scheduled_date && (
                                <div className="flex items-center gap-1 text-[8px] text-slate-400 font-medium">
                                  <Clock className="w-3 h-3" />
                                  <span>{new Date(os.scheduled_date).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</span>
                                </div>
                              )}
                            </div>

                            {/* Botones de acción móvil (visibles en móviles, ocultos en desktop) */}
                            <div className="flex flex-wrap gap-1 pt-2 border-t border-slate-50 md:hidden justify-between">
                              <button
                                onClick={() => openQuickAction(os, 'status')}
                                className="text-[8px] font-bold px-1.5 py-1 bg-slate-100 rounded text-brand-dark hover:bg-slate-200"
                              >
                                Status
                              </button>
                              <button
                                onClick={() => openQuickAction(os, 'tech')}
                                className="text-[8px] font-bold px-1.5 py-1 bg-slate-100 rounded text-brand-dark hover:bg-slate-200"
                              >
                                Técnico
                              </button>
                              <button
                                onClick={() => openQuickAction(os, 'date')}
                                className="text-[8px] font-bold px-1.5 py-1 bg-slate-100 rounded text-brand-dark hover:bg-slate-200"
                              >
                                Reagendar
                              </button>
                            </div>

                            {/* Botón Detalles */}
                            <button
                              onClick={() => setSelectedOS(os)}
                              className="w-full text-center text-[9px] font-bold text-slate-500 hover:text-brand-clinical bg-slate-50 hover:bg-sky-50 py-1.5 rounded-lg transition-colors mt-1"
                            >
                              Ver detalhes
                            </button>
                          </div>
                        ))}

                        {ordersInCol.length === 0 && (
                          <div className="text-center py-8 text-[10px] text-slate-400 italic font-medium border border-dashed border-slate-200 rounded-xl">
                            Arraste chamados aqui
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* VISTA LISTA CON FILTROS */}
          {viewMode === 'list' && (
            <div className="space-y-6">
              {/* Filtros de la Lista */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-5 space-y-4">
                <div className="flex items-center gap-1.5 text-xs font-bold text-brand-dark pb-2 border-b border-slate-50">
                  <SlidersHorizontal className="w-4 h-4 text-brand-clinical" />
                  <span>Filtros Operacionais</span>
                  <button 
                    onClick={() => setFilters({ date: '', technician_id: '', customer_id: '', status: '', priority: '', city: '', equipment_type: '' })}
                    className="text-[10px] text-slate-400 font-normal hover:text-brand-clinical ml-auto"
                  >
                    Limpar Filtros
                  </button>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 text-xs">
                  {/* Filtro Fecha */}
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-500 uppercase">Data Agendada</label>
                    <input 
                      type="date" 
                      value={filters.date}
                      onChange={(e) => setFilters({ ...filters, date: e.target.value })}
                      className="w-full border border-slate-200 rounded-lg p-1.5 text-xs focus:outline-none focus:border-brand-clinical bg-slate-50/50"
                    />
                  </div>

                  {/* Filtro Técnico */}
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-500 uppercase">Técnico</label>
                    <select 
                      value={filters.technician_id}
                      onChange={(e) => setFilters({ ...filters, technician_id: e.target.value })}
                      className="w-full border border-slate-200 rounded-lg p-1.5 text-xs focus:outline-none focus:border-brand-clinical bg-white"
                    >
                      <option value="">Todos</option>
                      {technicians.map(t => (
                        <option key={t.id} value={t.id}>{t.profile?.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Filtro Cliente */}
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-500 uppercase">Cliente</label>
                    <select 
                      value={filters.customer_id}
                      onChange={(e) => setFilters({ ...filters, customer_id: e.target.value })}
                      className="w-full border border-slate-200 rounded-lg p-1.5 text-xs focus:outline-none focus:border-brand-clinical bg-white"
                    >
                      <option value="">Todos</option>
                      {customers.map(c => (
                        <option key={c.id} value={c.id}>{c.company_name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Filtro Status */}
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-500 uppercase">Status</label>
                    <select 
                      value={filters.status}
                      onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                      className="w-full border border-slate-200 rounded-lg p-1.5 text-xs focus:outline-none focus:border-brand-clinical bg-white"
                    >
                      <option value="">Todos</option>
                      {KANBAN_STATUSES.map(s => (
                        <option key={s.id} value={s.id}>{s.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Filtro Prioridad */}
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-500 uppercase">Prioridade</label>
                    <select 
                      value={filters.priority}
                      onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
                      className="w-full border border-slate-200 rounded-lg p-1.5 text-xs focus:outline-none focus:border-brand-clinical bg-white"
                    >
                      <option value="">Todas</option>
                      <option value="baixa">Baixa</option>
                      <option value="media">Média</option>
                      <option value="alta">Alta</option>
                      <option value="urgente">Urgente</option>
                    </select>
                  </div>

                  {/* Filtro Ciudad */}
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-500 uppercase">Cidade</label>
                    <input 
                      type="text" 
                      placeholder="Ex: São Paulo"
                      value={filters.city}
                      onChange={(e) => setFilters({ ...filters, city: e.target.value })}
                      className="w-full border border-slate-200 rounded-lg p-1.5 text-xs focus:outline-none focus:border-brand-clinical bg-slate-50/50"
                    />
                  </div>

                  {/* Filtro Tipo Equipo */}
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-500 uppercase">Equipamento</label>
                    <input 
                      type="text" 
                      placeholder="Ex: Autoclave"
                      value={filters.equipment_type}
                      onChange={(e) => setFilters({ ...filters, equipment_type: e.target.value })}
                      className="w-full border border-slate-200 rounded-lg p-1.5 text-xs focus:outline-none focus:border-brand-clinical bg-slate-50/50"
                    />
                  </div>
                </div>
              </div>

              {/* Lista */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-6 space-y-4">
                <div className="flex justify-between items-center pb-2">
                  <h3 className="font-bold text-sm text-brand-dark flex items-center gap-1.5">
                    Visitas e Chamados Filtrados ({filteredOrdersForList.length})
                  </h3>
                </div>

                {filteredOrdersForList.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 font-medium text-xs border-2 border-dashed border-slate-100 rounded-xl">
                    Nenhuma ordem de serviço corresponde aos filtros selecionados.
                  </div>
                ) : (
                  <div className="overflow-x-auto no-scrollbar">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="text-slate-400 font-bold border-b border-slate-100">
                          <th className="pb-3">OS</th>
                          <th className="pb-3 px-2">Cliente</th>
                          <th className="pb-3 px-2">Cidade</th>
                          <th className="pb-3 px-2">Equipamento</th>
                          <th className="pb-3 px-2">Técnico</th>
                          <th className="pb-3 px-2">Data/Hora Agendada</th>
                          <th className="pb-3 px-2 text-center">Prioridade</th>
                          <th className="pb-3 px-2 text-center">Status</th>
                          <th className="pb-3 text-right">Detalhamento</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {filteredOrdersForList.map((os) => (
                          <tr key={os.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="py-4 font-mono font-bold text-brand-clinical">
                              #{os.id.substring(0, 8).toUpperCase()}
                            </td>
                            <td className="py-4 px-2 font-bold text-brand-dark">
                              {os.customer?.company_name}
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
                                priorityMap[os.priority as keyof typeof priorityMap]?.class || 'bg-slate-100'
                              }`}>
                                {priorityMap[os.priority as keyof typeof priorityMap]?.label || os.priority}
                              </span>
                            </td>
                            <td className="py-4 px-2 text-center">
                              <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
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
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* MODAL DETALHES COMPLETO E HISTÓRICO (Kanban/Lista) */}
      {selectedOS && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-100 flex flex-col">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-sky-100 text-brand-clinical rounded">
                    OS #{selectedOS.id.toUpperCase()}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    statusColColorMap(selectedOS.status)
                  }`}>
                    {statusMap[selectedOS.status]?.label || selectedOS.status}
                  </span>
                </div>
                <h3 className="font-extrabold text-sm text-brand-dark leading-tight">
                  {selectedOS.customer?.company_name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedOS(null)}
                className="p-1 rounded-md text-slate-400 hover:bg-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6 flex-1 overflow-y-auto">
              {/* Grid Datos Detalle */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pb-6 border-b border-slate-100">
                <div className="space-y-3">
                  <h4 className="font-bold text-xs text-brand-clinical uppercase tracking-wider flex items-center gap-1">
                    <FileText className="w-4 h-4" /> Detalhes do Chamado
                  </h4>
                  <div className="space-y-2 text-[11px] font-semibold text-slate-600">
                    <p><span className="text-slate-400 font-medium">Equipamento:</span> {selectedOS.equipment ? `${selectedOS.equipment.name} (${selectedOS.equipment.brand || ''} ${selectedOS.equipment.model || ''})` : 'Sem equipamento'}</p>
                    <p><span className="text-slate-400 font-medium">Prioridade:</span> <span className={`px-1.5 py-0.5 rounded ${priorityMap[selectedOS.priority]?.class}`}>{priorityMap[selectedOS.priority]?.label}</span></p>
                    <p><span className="text-slate-400 font-medium">Data Abertura:</span> {new Date(selectedOS.created_at).toLocaleDateString('pt-BR')} {new Date(selectedOS.created_at).toLocaleTimeString('pt-BR')}</p>
                    <p><span className="text-slate-400 font-medium">Agendamento Visita:</span> {selectedOS.scheduled_date ? new Date(selectedOS.scheduled_date).toLocaleString('pt-BR') : 'Não agendada'}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-bold text-xs text-brand-clinical uppercase tracking-wider flex items-center gap-1">
                    <User className="w-4 h-4" /> Responsáveis e Contato
                  </h4>
                  <div className="space-y-2 text-[11px] font-semibold text-slate-600">
                    <p><span className="text-slate-400 font-medium">Técnico Designado:</span> {selectedOS.technician?.profile?.name || 'Aguardando Técnico'}</p>
                    <p><span className="text-slate-400 font-medium">Cidade/UF Cliente:</span> {selectedOS.customer?.address_city ? `${selectedOS.customer.address_city} - ${selectedOS.customer.address_state || ''}` : '—'}</p>
                    <p><span className="text-slate-400 font-medium">Nome Fantasia:</span> {selectedOS.customer?.trade_name || '—'}</p>
                  </div>
                </div>

                <div className="sm:col-span-2 space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Descrição do Problema</span>
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                    {selectedOS.description}
                  </div>
                </div>

                {selectedOS.reported_issues && (
                  <div className="sm:col-span-2 space-y-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Observações de Triagem</span>
                    <div className="bg-amber-50/20 border border-amber-100/60 rounded-xl p-3.5 text-xs text-amber-900/80 leading-relaxed whitespace-pre-wrap">
                      {selectedOS.reported_issues}
                    </div>
                  </div>
                )}
              </div>

              {/* Histórico de Alterações */}
              <div className="space-y-4">
                <h4 className="font-bold text-xs text-brand-dark uppercase tracking-wider flex items-center gap-1.5">
                  <RefreshCw className="w-4 h-4 text-brand-clinical" />
                  Histórico de Status da OS
                </h4>

                {historyLoading ? (
                  <div className="text-xs text-slate-400">Carregando histórico...</div>
                ) : statusHistory.length === 0 ? (
                  <div className="text-xs text-slate-400 italic">Nenhum histórico registrado para esta ordem.</div>
                ) : (
                  <div className="relative border-l-2 border-slate-100 pl-4 space-y-5 ml-1.5 py-1">
                    {statusHistory.map((hist) => (
                      <div key={hist.id} className="relative space-y-1 text-left">
                        {/* Dot */}
                        <div className="absolute -left-[23px] top-1 bg-white border-2 border-brand-clinical w-2.5 h-2.5 rounded-full" />
                        
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full self-start ${
                            statusColColorMap(hist.status)
                          }`}>
                            {statusMap[hist.status]?.label || hist.status}
                          </span>
                          <span className="text-[9px] text-slate-400 font-medium">
                            {new Date(hist.created_at).toLocaleString('pt-BR')}
                          </span>
                        </div>

                        <p className="text-[10px] text-slate-600 font-semibold leading-relaxed">
                          {hist.notes || 'Status alterado.'}
                        </p>
                        
                        <p className="text-[8px] text-slate-400 font-bold uppercase">
                          Responsável: {hist.profiles?.name || 'Sistema'}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Acciones en Modal */}
            <div className="flex justify-end gap-3 pt-6 border-t border-slate-100 bg-slate-50 p-6 rounded-b-2xl">
              <button
                type="button"
                onClick={() => setSelectedOS(null)}
                className="bg-brand-clinical hover:bg-sky-700 text-white font-bold text-xs px-4 py-2.5 rounded-lg transition-colors shadow-sm"
              >
                Fechar Detalhes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PANEL MÓVIL DE ACCIONES RÁPIDAS (Mobile Only) */}
      {activeQuickOS && quickActionType && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          {/* Overlay click close */}
          <div className="absolute inset-0 -z-10" onClick={() => { setActiveQuickOS(null); setQuickActionType(null); }} />
          
          <div className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-extrabold text-xs text-brand-dark uppercase tracking-wider">
                {quickActionType === 'status' && 'Alterar Status da OS'}
                {quickActionType === 'tech' && 'Designar Técnico'}
                {quickActionType === 'date' && 'Agendar Visita'}
              </h3>
              <button
                onClick={() => { setActiveQuickOS(null); setQuickActionType(null); }}
                className="p-1 rounded-md text-slate-400 hover:bg-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveQuickAction} className="p-5 space-y-4">
              <p className="text-[10px] text-slate-500 font-medium">
                Atualizando OS de <span className="font-bold text-brand-dark">{activeQuickOS.customer?.company_name}</span> (OS #{activeQuickOS.id.substring(0, 6).toUpperCase()})
              </p>

              {/* Acción Cambiar Status */}
              {quickActionType === 'status' && (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-500 uppercase">Novo Status</label>
                    <select
                      value={quickForm.status}
                      onChange={(e) => setQuickForm({ ...quickForm, status: e.target.value })}
                      className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:border-brand-clinical bg-white font-bold"
                    >
                      {KANBAN_STATUSES.map(s => (
                        <option key={s.id} value={s.id}>{s.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-500 uppercase">Observação / Nota de Status</label>
                    <textarea
                      value={quickForm.notes}
                      onChange={(e) => setQuickForm({ ...quickForm, notes: e.target.value })}
                      className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:border-brand-clinical min-h-[60px]"
                      placeholder="Motivo da alteração (Ex: Aguardando aprovação do orçamento)..."
                    />
                  </div>
                </div>
              )}

              {/* Acción Asignar Técnico */}
              {quickActionType === 'tech' && (
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-500 uppercase">Técnico Designado</label>
                  <select
                    value={quickForm.technician_id}
                    onChange={(e) => setQuickForm({ ...quickForm, technician_id: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:border-brand-clinical bg-white"
                  >
                    <option value="">Não designado (Aguardando)</option>
                    {technicians.map(t => (
                      <option key={t.id} value={t.id}>{t.profile?.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Acción Agendar Visita */}
              {quickActionType === 'date' && (
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-500 uppercase">Data e Hora Programada</label>
                  <input
                    type="datetime-local"
                    value={quickForm.scheduled_date}
                    onChange={(e) => setQuickForm({ ...quickForm, scheduled_date: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:border-brand-clinical font-medium"
                  />
                </div>
              )}

              <div className="flex gap-2 justify-end pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => { setActiveQuickOS(null); setQuickActionType(null); }}
                  className="bg-transparent hover:bg-slate-100 text-slate-600 font-bold text-xs px-3.5 py-2.5 rounded-lg border border-slate-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-brand-clinical hover:bg-sky-700 text-white font-bold text-xs px-3.5 py-2.5 rounded-lg transition-colors shadow-xs"
                >
                  Confirmar Alteração
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper para colores
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
