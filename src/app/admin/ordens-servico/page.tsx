'use client';

import React, { useEffect, useState } from 'react';
import { PageHero } from '@/components/ui/PageHero';
import { EmptyState } from '@/components/ui/EmptyState';
import { PremiumButton } from '@/components/ui/PremiumButton';
import { PremiumInput } from '@/components/ui/PremiumInput';
import { PremiumModal } from '@/components/ui/PremiumModal';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { MetricCard } from '@/components/ui/MetricCard';
import { 
  Wrench, Plus, User, Calendar, Search, Edit2, 
  Trash2, X, ClipboardList, AlertCircle, Clock, ShieldAlert, RefreshCw, CheckCircle2
} from 'lucide-react';
import { createSupabaseBrowserClient } from '@/lib/supabase';
import { useAuth } from '@/components/AuthProvider';

interface Customer {
  id: string;
  company_name: string;
  trade_name?: string | null;
}

interface ClientEquipment {
  id: string;
  customer_id: string;
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

const priorityMap = {
  baixa: { label: 'Baixa', class: 'bg-slate-100 text-slate-600' },
  media: { label: 'Média', class: 'bg-blue-50 text-blue-600' },
  alta: { label: 'Alta', class: 'bg-orange-50 text-orange-600' },
  urgente: { label: 'Urgente', class: 'bg-rose-50 text-rose-700 font-bold border border-rose-200' },
};

export default function AdminOrdensServicoPage() {
  const supabase = createSupabaseBrowserClient();
  const { user, profile } = useAuth();

  // Estados de datos
  const [serviceOrders, setServiceOrders] = useState<ServiceOrder[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [equipments, setEquipments] = useState<ClientEquipment[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estados de búsqueda
  const [searchTerm, setSearchTerm] = useState('');

  // Feedback inline
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 3500);
  };

  // Estados de modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOS, setEditingOS] = useState<ServiceOrder | null>(null);

  // Formulario de OS
  const [formOS, setFormOS] = useState({
    customer_id: '',
    equipment_id: '',
    technician_id: '',
    status: 'aberta',
    priority: 'media' as ServiceOrder['priority'],
    description: '',
    reported_issues: '',
    scheduled_date: '',
  });

  // Cargar datos
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. Obtener órdenes de servicio con relaciones
      const { data: osData, error: osError } = await supabase
        .from('service_orders')
        .select(`
          *,
          customer:customers(id, company_name, trade_name),
          equipment:client_equipment(id, customer_id, name, brand, model),
          technician:technicians(
            id,
            profile:profiles(name)
          )
        `)
        .order('created_at', { ascending: false });

      if (osError) throw osError;
      setServiceOrders(osData || []);

      // 2. Obtener clientes
      const { data: custData, error: custError } = await supabase
        .from('customers')
        .select('id, company_name')
        .order('company_name', { ascending: true });

      if (custError) throw custError;
      setCustomers(custData || []);

      // 3. Obtener equipos
      const { data: equipData, error: equipError } = await supabase
        .from('client_equipment')
        .select('id, customer_id, name, brand, model');

      if (equipError) throw equipError;
      setEquipments(equipData || []);

      // 4. Obtener técnicos activos
      const { data: techData, error: techError } = await supabase
        .from('technicians')
        .select(`
          id,
          profile:profiles(name)
        `)
        .eq('is_active', true);

      if (techError) throw techError;
      
      const formattedTechs = (techData || []).map((t: any) => ({
        id: t.id,
        profile: Array.isArray(t.profile) ? t.profile[0] : t.profile
      }));
      setTechnicians(formattedTechs);

    } catch (err: any) {
      console.error('Erro ao carregar OS:', err);
      setError(err.message || 'Erro ao carregar dados do servidor.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Abrir modal
  const openModal = (os: ServiceOrder | null = null) => {
    setEditingOS(os);
    if (os) {
      // Formatear fecha para input type datetime-local (YYYY-MM-DDThh:mm)
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

      setFormOS({
        customer_id: os.customer_id || '',
        equipment_id: os.equipment_id || '',
        technician_id: os.technician_id || '',
        status: os.status || 'aberta',
        priority: os.priority || 'media',
        description: os.description || '',
        reported_issues: os.reported_issues || '',
        scheduled_date: formattedDate,
      });
    } else {
      setFormOS({
        customer_id: '',
        equipment_id: '',
        technician_id: '',
        status: 'aberta',
        priority: 'media',
        description: '',
        reported_issues: '',
        scheduled_date: '',
      });
    }
    setIsModalOpen(true);
  };

  // Guardar Orden de Servicio y escribir historial de estado
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formOS.customer_id || !formOS.description.trim()) return;

    try {
      setLoading(true);
      
      // Determinar status: si se asigna técnico y el status original es 'aberta',
      // cambiar a 'tecnico_atribuido' automáticamente, o si hay fecha agendada, pasar a 'visita_agendada'.
      let currentStatus = formOS.status;
      if (formOS.technician_id && currentStatus === 'aberta') {
        currentStatus = 'tecnico_atribuido';
      }
      if (formOS.scheduled_date && (currentStatus === 'aberta' || currentStatus === 'tecnico_atribuido')) {
        currentStatus = 'visita_agendada';
      }

      const payload = {
        customer_id: formOS.customer_id,
        equipment_id: formOS.equipment_id || null,
        technician_id: formOS.technician_id || null,
        status: currentStatus,
        priority: formOS.priority,
        description: formOS.description,
        reported_issues: formOS.reported_issues || null,
        scheduled_date: formOS.scheduled_date ? new Date(formOS.scheduled_date).toISOString() : null,
      };

      if (editingOS) {
        // Validar si cambió el estado para registrar historial
        const statusChanged = editingOS.status !== currentStatus;

        // Actualizar OS
        const { error: saveError } = await supabase
          .from('service_orders')
          .update(payload)
          .eq('id', editingOS.id);
        if (saveError) throw saveError;

        // Escribir historial si cambió
        if (statusChanged && profile?.id) {
          const { error: histError } = await supabase
            .from('service_order_status_history')
            .insert({
              service_order_id: editingOS.id,
              status: currentStatus,
              changed_by: profile.id,
              notes: 'Status alterado pelo administrador na edição manual da OS.'
            });
          if (histError) console.error('Erro ao registrar histórico de status:', histError.message);
        }
      } else {
        // Crear OS
        const { data: newOS, error: saveError } = await supabase
          .from('service_orders')
          .insert(payload)
          .select()
          .single();
        if (saveError) throw saveError;

        // Escribir primer historial
        if (newOS && profile?.id) {
          const { error: histError } = await supabase
            .from('service_order_status_history')
            .insert({
              service_order_id: newOS.id,
              status: currentStatus,
              changed_by: profile.id,
              notes: 'Abertura manual de Ordem de Serviço pelo administrador.'
            });
          if (histError) console.error('Erro ao criar histórico inicial de status:', histError.message);
        }
      }

      const wasEditing = !!editingOS;
      setIsModalOpen(false);
      setEditingOS(null);
      await loadData();
      showFeedback('success', wasEditing ? 'Status atualizado com sucesso.' : 'Chamado aberto com sucesso.');
    } catch (err: any) {
      showFeedback('error', 'Não foi possível concluir a ação. Tente novamente.');
      console.error('Erro ao salvar OS:', err.message);
    } finally {
      setLoading(false);
    }
  };

  // Eliminar OS
  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente remover esta Ordem de Serviço? Todos os registros relacionados serão afetados.')) return;

    try {
      setLoading(true);
      const { error: delError } = await supabase
        .from('service_orders')
        .delete()
        .eq('id', id);

      if (delError) throw delError;
      await loadData();
      showFeedback('success', 'Ordem de serviço removida.');
    } catch (err: any) {
      showFeedback('error', 'Não foi possível concluir a ação. Tente novamente.');
      console.error('Erro ao excluir OS:', err.message);
    } finally {
      setLoading(false);
    }
  };

  // Filtrar equipos según el cliente seleccionado en el formulario
  const getFilteredEquipments = () => {
    return equipments.filter(eq => eq.customer_id === formOS.customer_id);
  };

  // Filtrar OS
  const filteredOS = serviceOrders.filter(os => {
    const text = searchTerm.toLowerCase();
    const id = os.id.toLowerCase();
    const customer = (os.customer?.company_name || '').toLowerCase();
    const equip = (os.equipment?.name || '').toLowerCase();
    const tech = (os.technician?.profile?.name || '').toLowerCase();
    const desc = os.description.toLowerCase();

    return id.includes(text) || customer.includes(text) || equip.includes(text) || tech.includes(text) || desc.includes(text);
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
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
      {/* Header Premium */}
      <PageHero
        title="Ordens de Serviço (OS)"
        description="Abra ordens de serviço manualmente, designe técnicos responsáveis e agende visitas operacionais."
        badge="Central Operacional de Chamados"
        icon={Wrench}
        variant="compact"
        rightElement={
          <PremiumButton
            onClick={() => openModal()}
            icon={<Plus className="w-4 h-4" />}
            variant="primary"
          >
            Nova OS
          </PremiumButton>
        }
      />

      {/* Métricas rápidas de OS */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <MetricCard
          title="Total de OS"
          value={serviceOrders.length}
          description="Histórico acumulado"
          variant="default"
        />
        <MetricCard
          title="Em Triagem"
          value={serviceOrders.filter(os => os.status === 'aberta' || os.status === 'em_analise').length}
          description="Novos chamados"
          variant="default"
        />
        <MetricCard
          title="Em Campo"
          value={serviceOrders.filter(os => os.status === 'em_atendimento').length}
          description="Técnico em visita"
          icon={<Clock className="w-4.5 h-4.5 text-indigo-650" />}
          variant="indigo"
        />
        <MetricCard
          title="Sem Técnico"
          value={serviceOrders.filter(os => !os.technician_id && os.status !== 'concluida' && os.status !== 'cancelada').length}
          description="Aguardando alocação"
          icon={<AlertCircle className="w-4.5 h-4.5 text-rose-500" />}
          variant="rose"
        />
        <MetricCard
          title="Concluídas"
          value={serviceOrders.filter(os => os.status === 'concluida').length}
          description="Encerradas com sucesso"
          variant="emerald"
          className="col-span-2 lg:col-span-1"
        />
      </div>

      {/* Fila de Ordens de Serviço */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-xs p-6 space-y-5">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between pb-2 border-b border-slate-50">
          <h3 className="font-extrabold text-sm text-slate-800 flex items-center gap-1.5 text-left">
            Fila de Atendimento ({filteredOS.length})
          </h3>
          
          {/* Buscador */}
          <div className="relative w-full sm:max-w-xs">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por código, cliente, equipamento..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-brand-clinical focus:ring-2 focus:ring-sky-100 bg-slate-50/20 transition-all text-slate-700 font-sans"
            />
          </div>
        </div>

        {loading && serviceOrders.length === 0 ? (
          <div className="text-center py-12 text-slate-400 font-medium text-xs">
            Carregando ordens de serviço...
          </div>
        ) : filteredOS.length === 0 ? (
          <EmptyState
            title="Fila de Ordens de Serviço Vazia"
            description="Nenhuma ordem de serviço foi registrada ou atende aos filtros atuais. Crie uma nova OS para iniciar as atividades operacionais."
            icon={<ClipboardList className="w-6 h-6 text-sky-600" />}
            actionLabel="Criar Nova OS"
            onActionClick={() => openModal()}
            variant="panel"
          />
        ) : (
          <>
            {/* Tabela para Desktop */}
            <div className="hidden lg:block overflow-x-auto no-scrollbar">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="text-slate-400 font-bold border-b border-slate-100">
                    <th className="pb-3 pr-2 pl-2">Código</th>
                    <th className="pb-3 px-2">Cliente / Consultório</th>
                    <th className="pb-3 px-2">Equipamento</th>
                    <th className="pb-3 px-2">Técnico Designado</th>
                    <th className="pb-3 px-2">Data e Hora</th>
                    <th className="pb-3 px-2 text-center">Prioridade</th>
                    <th className="pb-3 px-2 text-center">Status</th>
                    <th className="pb-3 pr-2 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredOS.map((os) => (
                    <tr key={os.id} className="hover:bg-slate-50/30 transition-all duration-150">
                      <td className="py-4 pr-2 pl-2 font-mono font-black text-slate-450 text-[10px]">
                        #{os.id.substring(0, 8).toUpperCase()}
                      </td>
                      <td className="py-4 px-2 text-left">
                        <div className="font-extrabold text-slate-800 text-xs">{os.customer?.company_name || 'Cliente removido'}</div>
                        {os.customer?.trade_name && (
                          <div className="text-[9.5px] text-slate-400 font-semibold font-sans">{os.customer.trade_name}</div>
                        )}
                      </td>
                      <td className="py-4 px-2 text-left">
                        {os.equipment ? (
                          <div>
                            <div className="font-bold text-slate-700">{os.equipment.name}</div>
                            {(os.equipment.brand || os.equipment.model) && (
                              <span className="text-[9px] text-slate-400 font-semibold bg-slate-150 px-1.5 py-0.2 rounded border border-slate-200/40">
                                {os.equipment.brand} {os.equipment.model}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[10px] font-semibold">Sem equipamento</span>
                        )}
                      </td>
                      <td className="py-4 px-2 text-left">
                        {os.technician?.profile ? (
                          <span className="flex items-center gap-1 font-extrabold text-slate-700">
                            <div className="w-5 h-5 rounded-full bg-sky-50 border border-sky-100 flex items-center justify-center font-black text-[9px] text-brand-clinical flex-shrink-0">
                              {os.technician.profile.name.substring(0, 1).toUpperCase()}
                            </div>
                            {os.technician.profile.name}
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 font-bold text-rose-500 italic bg-rose-50 px-2 py-0.5 rounded-md border border-rose-100/50 inline-flex">
                            <AlertCircle className="w-3 h-3 text-rose-500 flex-shrink-0 animate-pulse" />
                            Não designado
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-2 text-left">
                        {os.scheduled_date ? (
                          <span className="flex items-center gap-1 font-bold text-slate-600">
                            <Clock className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                            {new Date(os.scheduled_date).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic font-bold">Não agendada</span>
                        )}
                      </td>
                      <td className="py-4 px-2 text-center">
                        <StatusBadge
                          label={priorityMap[os.priority as keyof typeof priorityMap]?.label || os.priority}
                          type={os.priority === 'urgente' ? 'error' : os.priority === 'alta' ? 'warning' : os.priority === 'media' ? 'info' : 'neutral'}
                        />
                      </td>
                      <td className="py-4 px-2 text-center">
                        <StatusBadge
                          label={statusMap[os.status]?.label || os.status}
                          type={os.status === 'concluida' ? 'success' : os.status === 'cancelada' ? 'error' : os.status === 'em_atendimento' ? 'success' : os.status === 'orcamento_pendente' ? 'warning' : 'neutral'}
                        />
                      </td>
                      <td className="py-4 pr-2 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openModal(os)}
                            className="p-1.5 text-slate-450 hover:text-sky-655 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                            title="Editar OS"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(os.id)}
                            className="p-1.5 text-slate-450 hover:text-rose-650 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                            title="Remover OS"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Cards para Mobile y Tablet */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:hidden">
              {filteredOS.map((os) => (
                <div 
                  key={os.id}
                  className="bg-white border border-slate-200 rounded-2xl p-4.5 space-y-4 text-left shadow-3xs"
                >
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <span className="text-[9px] font-mono font-black text-slate-450 block">#{os.id.substring(0, 8).toUpperCase()}</span>
                      <h4 className="font-extrabold text-slate-850 text-xs leading-snug">{os.customer?.company_name}</h4>
                      {os.equipment && (
                        <p className="text-[10px] text-sky-655 font-bold mt-0.5">{os.equipment.name}</p>
                      )}
                    </div>
                    <StatusBadge
                      label={statusMap[os.status]?.label || os.status}
                      type={os.status === 'concluida' ? 'success' : os.status === 'cancelada' ? 'error' : os.status === 'em_atendimento' ? 'success' : os.status === 'orcamento_pendente' ? 'warning' : 'neutral'}
                      className="shrink-0"
                    />
                  </div>

                  <div className="space-y-1.5 text-[11px] font-semibold text-slate-655 border-t border-slate-100 pt-3">
                    <div className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>Técnico: </span>
                      <span className="text-slate-800">
                        {os.technician?.profile?.name || 'Não designado'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>Agenda: </span>
                      <span className="text-slate-800">
                        {os.scheduled_date ? new Date(os.scheduled_date).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : 'Não agendada'}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center border-t border-slate-100 pt-3">
                    <StatusBadge
                      label={priorityMap[os.priority as keyof typeof priorityMap]?.label || os.priority}
                      type={os.priority === 'urgente' ? 'error' : os.priority === 'alta' ? 'warning' : os.priority === 'media' ? 'info' : 'neutral'}
                    />
                    
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => openModal(os)}
                        className="p-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-[10px] font-black text-slate-755 transition-all shadow-3xs cursor-pointer"
                        title="Editar OS"
                      >
                        <Edit2 className="w-3 h-3 text-slate-450" />
                      </button>
                      <button
                        onClick={() => handleDelete(os.id)}
                        className="p-1.5 bg-rose-50/50 hover:bg-rose-100 border border-rose-150 rounded-xl text-[10px] font-black text-rose-700 transition-all shadow-3xs cursor-pointer"
                        title="Excluir OS"
                      >
                        <Trash2 className="w-3 h-3 text-rose-450" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Modal OS */}
      <PremiumModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingOS ? 'Editar Ordem de Serviço' : 'Nova Ordem de Serviço'}
        size="lg"
      >
        <form onSubmit={handleSave} className="space-y-4 text-left">
          {/* Cliente */}
          <PremiumInput
            label="Cliente"
            name="customer_id"
            as="select"
            required
            value={formOS.customer_id}
            onChange={(e) => setFormOS({ ...formOS, customer_id: e.target.value, equipment_id: '' })}
            placeholder="Selecione um cliente..."
            options={customers.map(c => ({ value: c.id, label: c.company_name }))}
          />

          {/* Equipamento */}
          <PremiumInput
            label="Equipamento"
            name="equipment_id"
            as="select"
            disabled={!formOS.customer_id}
            value={formOS.equipment_id}
            onChange={(e) => setFormOS({ ...formOS, equipment_id: e.target.value })}
            placeholder={!formOS.customer_id ? 'Selecione primeiro o cliente...' : 'Nenhum equipamento cadastrado / Sem associação'}
            options={getFilteredEquipments().map(eq => ({
              value: eq.id,
              label: `${eq.name} ${eq.brand ? `(${eq.brand})` : ''} ${eq.model ? `- ${eq.model}` : ''}`
            }))}
          />

          {/* Técnico */}
          <PremiumInput
            label="Técnico Designado (Opcional)"
            name="technician_id"
            as="select"
            value={formOS.technician_id}
            onChange={(e) => setFormOS({ ...formOS, technician_id: e.target.value })}
            placeholder="Não atribuído (Aguardando designação)"
            options={technicians.map(t => ({
              value: t.id,
              label: t.profile?.name || 'Técnico sem nome'
            }))}
          />

          <div className="grid grid-cols-2 gap-4">
            {/* Prioridade */}
            <PremiumInput
              label="Prioridade"
              name="priority"
              as="select"
              required
              value={formOS.priority}
              onChange={(e) => setFormOS({ ...formOS, priority: e.target.value as ServiceOrder['priority'] })}
              options={[
                { value: 'baixa', label: 'Baixa' },
                { value: 'media', label: 'Média' },
                { value: 'alta', label: 'Alta' },
                { value: 'urgente', label: 'Urgente' }
              ]}
            />

            {/* Fecha agendada */}
            <PremiumInput
              label="Data/Hora Agendada"
              name="scheduled_date"
              type="datetime-local"
              value={formOS.scheduled_date}
              onChange={(e) => setFormOS({ ...formOS, scheduled_date: e.target.value })}
            />
          </div>

          {/* Detalhes problema */}
          <PremiumInput
            label="Descrição do Problema"
            name="description"
            as="textarea"
            required
            value={formOS.description}
            onChange={(e) => setFormOS({ ...formOS, description: e.target.value })}
            placeholder="Relato detalhado enviado pelo cliente..."
            rows={2.5}
          />

          {/* Notas de triagem */}
          <PremiumInput
            label="Observações de Triagem / Problemas Detectados"
            name="reported_issues"
            as="textarea"
            value={formOS.reported_issues || ''}
            onChange={(e) => setFormOS({ ...formOS, reported_issues: e.target.value })}
            placeholder="Notas internas do suporte técnico..."
            rows={2}
          />

          {editingOS && (
            <PremiumInput
              label="Status Atual"
              name="status"
              as="select"
              value={formOS.status}
              onChange={(e) => setFormOS({ ...formOS, status: e.target.value })}
              options={Object.entries(statusMap).map(([key, val]) => ({
                value: key,
                label: val.label
              }))}
            />
          )}

          {/* Botões Ação */}
          <div className="flex justify-end gap-3 pt-6 border-t border-slate-100 bg-slate-50 -mx-6 -mb-6 p-6 rounded-b-3xl">
            <PremiumButton
              variant="outline"
              onClick={() => setIsModalOpen(false)}
            >
              Cancelar
            </PremiumButton>
            <PremiumButton
              type="submit"
              loading={loading}
              variant="primary"
            >
              Salvar Ordem de Serviço
            </PremiumButton>
          </div>
        </form>
      </PremiumModal>
    </div>
  );
}
