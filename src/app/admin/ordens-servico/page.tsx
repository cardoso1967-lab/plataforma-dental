'use client';

import React, { useEffect, useState } from 'react';
import { 
  Wrench, Plus, User, Calendar, Search, Edit2, 
  Trash2, X, ClipboardList, AlertCircle, Clock, ShieldAlert, RefreshCw
} from 'lucide-react';
import { createSupabaseBrowserClient } from '@/lib/supabase';
import { useAuth } from '@/components/AuthProvider';

interface Customer {
  id: string;
  company_name: string;
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
          customer:customers(id, company_name),
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

      setIsModalOpen(false);
      setEditingOS(null);
      await loadData();
    } catch (err: any) {
      alert('Erro ao salvar Ordem de Serviço: ' + err.message);
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
    } catch (err: any) {
      alert('Erro ao excluir Ordem de Serviço: ' + err.message);
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
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-extrabold text-brand-dark tracking-tight flex items-center gap-2">
            <Wrench className="w-7 h-7 text-brand-clinical" />
            Ordens de Serviço (OS)
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Abra ordens de serviço manualmente, designe técnicos responsáveis e agende visitas operacionais.
          </p>
        </div>
        <button
          onClick={() => openModal()}
          className="bg-brand-clinical hover:bg-sky-700 text-white text-xs font-bold px-4 py-2.5 rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-sm"
        >
          <Plus className="w-4 h-4" /> Nova OS
        </button>
      </div>

      {/* Fila de Ordens de Serviço */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between pb-2 border-b border-slate-50">
          <h3 className="font-bold text-sm text-brand-dark flex items-center gap-1.5">
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
              className="w-full pl-9 pr-4 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-brand-clinical bg-slate-50/50"
            />
          </div>
        </div>

        {loading && serviceOrders.length === 0 ? (
          <div className="text-center py-12 text-slate-400 font-medium text-xs">
            Carregando ordens de serviço...
          </div>
        ) : filteredOS.length === 0 ? (
          <div className="text-center py-12 text-slate-400 font-medium text-xs border-2 border-dashed border-slate-100 rounded-xl">
            Nenhuma ordem de serviço cadastrada ou encontrada.
          </div>
        ) : (
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="text-slate-400 font-bold border-b border-slate-100">
                  <th className="pb-3">Código</th>
                  <th className="pb-3 px-2">Cliente</th>
                  <th className="pb-3 px-2">Equipamento</th>
                  <th className="pb-3 px-2">Técnico Designado</th>
                  <th className="pb-3 px-2">Agendamento</th>
                  <th className="pb-3 px-2 text-center">Prioridade</th>
                  <th className="pb-3 px-2 text-center">Status</th>
                  <th className="pb-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredOS.map((os) => (
                  <tr key={os.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 font-mono font-bold text-brand-clinical">
                      #{os.id.substring(0, 8).toUpperCase()}
                    </td>
                    <td className="py-4 px-2 font-bold text-brand-dark">
                      {os.customer?.company_name || 'Cliente removido'}
                    </td>
                    <td className="py-4 px-2 font-semibold text-slate-700">
                      {os.equipment ? (
                        <div>
                          <div>{os.equipment.name}</div>
                          {(os.equipment.brand || os.equipment.model) && (
                            <span className="text-[9px] text-slate-400 font-normal">
                              {os.equipment.brand} {os.equipment.model}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-[10px]">Sem equipamento</span>
                      )}
                    </td>
                    <td className="py-4 px-2">
                      {os.technician?.profile ? (
                        <span className="flex items-center gap-1 font-semibold text-slate-700">
                          <User className="w-3.5 h-3.5 text-brand-clinical flex-shrink-0" />
                          {os.technician.profile.name}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 font-medium text-slate-400 italic">
                          <AlertCircle className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />
                          Não designado
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-2">
                      {os.scheduled_date ? (
                        <span className="flex items-center gap-1 font-semibold text-slate-600">
                          <Clock className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                          {new Date(os.scheduled_date).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic font-medium">Não agendada</span>
                      )}
                    </td>
                    <td className="py-4 px-2 text-center">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                        priorityMap[os.priority as keyof typeof priorityMap]?.class || 'bg-slate-100 text-slate-500'
                      }`}>
                        {priorityMap[os.priority as keyof typeof priorityMap]?.label || os.priority}
                      </span>
                    </td>
                    <td className="py-4 px-2 text-center">
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                        statusMap[os.status]?.class || 'bg-slate-100 text-slate-500'
                      }`}>
                        {statusMap[os.status]?.label || os.status}
                      </span>
                    </td>
                    <td className="py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openModal(os)}
                          className="p-1.5 text-slate-400 hover:text-brand-clinical rounded-md hover:bg-slate-100 transition-colors"
                          title="Editar OS"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(os.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md hover:bg-slate-100 transition-colors"
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
        )}
      </div>

      {/* Modal OS */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 transition-all">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-100 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-extrabold text-sm text-brand-dark flex items-center gap-1.5">
                <Wrench className="w-5 h-5 text-brand-clinical animate-pulse" />
                {editingOS ? 'Editar Ordem de Serviço' : 'Nova Ordem de Serviço'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 text-left">
              {/* Cliente */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Cliente *</label>
                <select
                  required
                  value={formOS.customer_id}
                  onChange={(e) => setFormOS({ ...formOS, customer_id: e.target.value, equipment_id: '' })}
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:outline-none focus:border-brand-clinical focus:ring-2 focus:ring-sky-100 transition-all bg-slate-50/20 bg-white"
                >
                  <option value="">Selecione um cliente...</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.company_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Equipamento */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Equipamento</label>
                <select
                  disabled={!formOS.customer_id}
                  value={formOS.equipment_id}
                  onChange={(e) => setFormOS({ ...formOS, equipment_id: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:outline-none focus:border-brand-clinical focus:ring-2 focus:ring-sky-100 transition-all bg-slate-50/20 bg-white disabled:bg-slate-50 disabled:text-slate-400"
                >
                  <option value="">
                    {!formOS.customer_id 
                      ? 'Selecione primeiro o cliente...' 
                      : 'Nenhum equipamento cadastrado / Sem associação'}
                  </option>
                  {getFilteredEquipments().map((eq) => (
                    <option key={eq.id} value={eq.id}>
                      {eq.name} {eq.brand ? `(${eq.brand})` : ''} {eq.model ? `- ${eq.model}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Técnico */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Técnico Designado (Opcional)</label>
                <select
                  value={formOS.technician_id}
                  onChange={(e) => setFormOS({ ...formOS, technician_id: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:outline-none focus:border-brand-clinical focus:ring-2 focus:ring-sky-100 transition-all bg-slate-50/20 bg-white"
                >
                  <option value="">Não atribuído (Aguardando designação)</option>
                  {technicians.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.profile?.name || 'Técnico sem nome'}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Prioridade */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Prioridade *</label>
                  <select
                    value={formOS.priority}
                    onChange={(e) => setFormOS({ ...formOS, priority: e.target.value as ServiceOrder['priority'] })}
                    className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:outline-none focus:border-brand-clinical focus:ring-2 focus:ring-sky-100 transition-all bg-slate-50/20 bg-white"
                  >
                    <option value="baixa">Baixa</option>
                    <option value="media">Média</option>
                    <option value="alta">Alta</option>
                    <option value="urgente">Urgente</option>
                  </select>
                </div>

                {/* Fecha agendada */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Data/Hora Agendada</label>
                  <input
                    type="datetime-local"
                    value={formOS.scheduled_date}
                    onChange={(e) => setFormOS({ ...formOS, scheduled_date: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:outline-none focus:border-brand-clinical focus:ring-2 focus:ring-sky-100 transition-all bg-slate-50/20 font-medium"
                  />
                </div>
              </div>

              {/* Detalhes problema */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Descrição do Problema *</label>
                <textarea
                  required
                  value={formOS.description}
                  onChange={(e) => setFormOS({ ...formOS, description: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:outline-none focus:border-brand-clinical focus:ring-2 focus:ring-sky-100 transition-all bg-slate-50/20 min-h-[70px]"
                  placeholder="Relato detalhado enviado pelo cliente..."
                />
              </div>

              {/* Notas de triagem */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Observações de Triagem / Problemas Detectados</label>
                <textarea
                  value={formOS.reported_issues}
                  onChange={(e) => setFormOS({ ...formOS, reported_issues: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:outline-none focus:border-brand-clinical focus:ring-2 focus:ring-sky-100 transition-all bg-slate-50/20 min-h-[60px]"
                  placeholder="Notas internas do suporte técnico..."
                />
              </div>

              {editingOS && (
                <div className="space-y-1 pt-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Status Atual</label>
                  <select
                    value={formOS.status}
                    onChange={(e) => setFormOS({ ...formOS, status: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:outline-none focus:border-brand-clinical focus:ring-2 focus:ring-sky-100 transition-all bg-slate-50/20 bg-white font-bold"
                  >
                    {Object.entries(statusMap).map(([key, val]) => (
                      <option key={key} value={key}>
                        {val.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Botões Ação */}
              <div className="flex justify-end gap-3 pt-6 border-t border-slate-100 bg-slate-50 -mx-6 -mb-6 p-6 rounded-b-2xl">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="bg-transparent hover:bg-slate-100 text-slate-600 font-bold text-xs px-4 py-2.5 rounded-xl border border-slate-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-brand-clinical hover:bg-sky-700 text-white font-bold text-xs px-4.5 py-2.5 rounded-xl transition-all shadow-sm disabled:opacity-50 min-w-[120px]"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-1">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Salvando...
                    </span>
                  ) : 'Salvar Ordem de Serviço'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
