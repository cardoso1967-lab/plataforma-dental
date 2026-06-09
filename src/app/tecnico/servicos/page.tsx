'use client';

import React, { useEffect, useState } from 'react';
import { 
  Wrench, User, Calendar, Clock, AlertTriangle, 
  CheckCircle2, Search, X, Check, Eye, RefreshCw, MapPin, Phone, ClipboardList
} from 'lucide-react';
import { createSupabaseBrowserClient } from '@/lib/supabase';
import { useAuth } from '@/components/AuthProvider';

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

  const loadData = async () => {
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

      // 2. Obtener órdenes de servicio
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
        .order('created_at', { ascending: false });

      if (osError) throw osError;
      setServices(osData || []);

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
        (os.customer?.company_name || '').toLowerCase().includes(term) ||
        (os.equipment?.name || '').toLowerCase().includes(term) ||
        os.description.toLowerCase().includes(term)
      );
    }

    setFilteredServices(result);
  }, [services, activeFilter, searchTerm]);

  const openStatusModal = (os: any) => {
    setSelectedOS(os);
    setNewStatus(os.status);
    setTechNotes(os.reported_issues || '');
    setIsModalOpen(true);
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
    } catch (err: any) {
      alert('Erro ao atualizar chamado: ' + err.message);
    } finally {
      setUpdating(false);
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

  const getStatusBadgeClass = (status: string) => {
    switch(status) {
      case 'em_atendimento': return 'bg-sky-500 text-white border-sky-600';
      case 'concluida': return 'bg-emerald-500 text-white border-emerald-600';
      case 'aguardando_peca': return 'bg-orange-500 text-white border-orange-600';
      case 'orcamento_pendente': return 'bg-amber-400 text-slate-900 border-amber-500';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  if (loading && services.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-400 font-medium text-xs gap-3">
        <RefreshCw className="w-8 h-8 text-brand-clinical animate-spin" />
        Carregando ordens de serviço...
      </div>
    );
  }

  if (!technician) {
    return (
      <div className="text-center py-16 px-6 max-w-sm mx-auto space-y-4 bg-white rounded-2xl border border-slate-100 p-6 mt-10 shadow-sm">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
          <User className="w-8 h-8" />
        </div>
        <h2 className="text-base font-extrabold text-brand-dark">Acesso Restrito</h2>
        <p className="text-xs text-slate-500 font-medium leading-relaxed">
          Seu usuário não está vinculado a uma conta de técnico ativa no sistema.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-md mx-auto">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-xl font-extrabold text-brand-dark tracking-tight">
          Minhas Ordens de Serviço
        </h1>
        <p className="text-xs text-slate-500 font-semibold leading-relaxed">
          Gerencie e atualize seus atendimentos técnicos diretamente em campo.
        </p>
      </div>

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
            className={`flex-1 pb-3 text-center border-b-2 capitalize transition-all ${
              activeFilter === tab 
                ? 'border-brand-clinical text-brand-clinical' 
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
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center border border-dashed border-slate-200 rounded-2xl bg-slate-50/20 shadow-3xs">
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-450 flex items-center justify-center mb-3">
              <ClipboardList className="w-5 h-5 text-slate-400" />
            </div>
            <h4 className="font-extrabold text-xs text-slate-800 mb-1">Nenhum chamado encontrado</h4>
            <p className="text-[10px] text-slate-400 font-medium max-w-[250px] leading-normal">
              Não existem ordens de serviço correspondentes a este filtro ou pesquisa em seu portfólio de campo.
            </p>
          </div>
        ) : (
          filteredServices.map((os) => (
            <div
              key={os.id}
              onClick={() => openStatusModal(os)}
              className={`bg-white rounded-2xl border p-4.5 space-y-4 shadow-sm hover:shadow-md transition-all cursor-pointer active:bg-slate-50/50 ${
                os.status === 'em_atendimento' ? 'ring-2 ring-sky-100 border-sky-300' : 'border-slate-100'
              }`}
            >
              {/* Encabezado del Card */}
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold text-slate-400">
                  #{os.id.slice(0, 8).toUpperCase()}
                </span>
                <div className="flex gap-1.5">
                  <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider border ${getStatusBadgeClass(os.status)}`}>
                    {getStatusLabel(os.status)}
                  </span>
                  <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full border ${getPriorityBadgeClass(os.priority)}`}>
                    {os.priority.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Contenido principal */}
              <div className="space-y-1.5 text-left">
                <h4 className="font-extrabold text-brand-dark text-base leading-snug">
                  {os.equipment?.name || 'Equipamento Geral'}
                </h4>
                {os.equipment?.brand && (
                  <p className="text-[10px] text-slate-400 font-medium">
                    {os.equipment.brand} • {os.equipment.model}
                  </p>
                )}
                <div className="flex items-center gap-1.5 text-xs text-slate-600 font-semibold pt-1">
                  <User className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                  <span className="line-clamp-1">{os.customer?.company_name}</span>
                </div>
              </div>

              {/* Fecha y Dirección */}
              <div className="bg-slate-50 rounded-xl p-3 text-xs font-semibold text-slate-600 space-y-2 text-left">
                {os.scheduled_date && (
                  <div className="flex items-center gap-1.5 text-brand-clinical font-bold">
                    <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>Agendado: {new Date(os.scheduled_date).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</span>
                  </div>
                )}
                {os.customer && (
                  <div className="flex items-start gap-1.5 text-[11px] text-slate-500 font-medium leading-relaxed">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
                    <span>{os.customer.address_street}, {os.customer.address_number} - {os.customer.address_city}</span>
                  </div>
                )}
              </div>

              {/* Botón táctil gigante en el card */}
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  openStatusModal(os);
                }}
                className="w-full bg-slate-50 hover:bg-slate-100 text-brand-clinical border border-slate-200/80 font-extrabold text-xs py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Eye className="w-4 h-4" /> Ver & Atualizar Status
              </button>
            </div>
          ))
        )}
      </div>

      {/* Modal Táctil Completo de Actualización de OS */}
      {isModalOpen && selectedOS && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 transition-all">
          <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl border border-slate-100 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div className="text-left">
                <span className="text-[9px] font-mono font-bold text-slate-400">OS #{selectedOS.id.slice(0, 8).toUpperCase()}</span>
                <h3 className="font-extrabold text-sm text-brand-dark flex items-center gap-1.5">
                  <Wrench className="w-4.5 h-4.5 text-brand-clinical" />
                  Gerenciar Chamado
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateStatus} className="p-5 space-y-4 text-left">
              {/* Información del Cliente */}
              <div className="space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs font-semibold text-slate-600">
                <p className="text-brand-dark font-extrabold">{selectedOS.customer?.company_name}</p>
                <p className="text-slate-500 font-medium text-[11px]">
                  {selectedOS.customer?.address_street}, {selectedOS.customer?.address_number} - {selectedOS.customer?.address_city}
                </p>
                {selectedOS.customer?.phone && (
                  <p className="text-brand-clinical font-bold text-[11px] pt-1">
                    Fone: {selectedOS.customer.phone}
                  </p>
                )}
              </div>

              {/* Selector de Status */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Alterar Status do Serviço</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:outline-none focus:border-brand-clinical focus:ring-2 focus:ring-sky-100 transition-all bg-slate-50/20 bg-white font-bold text-brand-dark"
                >
                  <option value="visita_agendada">Visita Agendada</option>
                  <option value="em_atendimento">Em Atendimento Local</option>
                  <option value="aguardando_peca">Aguardando Peça de Reposição</option>
                  <option value="orcamento_pendente">Presuposto Pendente</option>
                  <option value="concluida">Concluído (Finalizado)</option>
                  <option value="cancelada">Cancelado</option>
                </select>
              </div>

              {/* Anotaciones Técnicas */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Observações Técnicas / Laudo de Campo</label>
                <textarea
                  value={techNotes}
                  onChange={(e) => setTechNotes(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:outline-none focus:border-brand-clinical focus:ring-2 focus:ring-sky-100 transition-all bg-slate-50/20 min-h-[90px] font-medium"
                  placeholder="Descreva o diagnóstico, peças substituídas ou justificativas de mudança de status..."
                />
              </div>

              {/* Botones de acción táctiles grandes */}
              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-transparent hover:bg-slate-100 text-slate-600 font-bold text-xs py-3 rounded-xl border border-slate-200 transition-colors text-center"
                >
                  Voltar
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="flex-1 bg-brand-clinical hover:bg-sky-700 text-white font-bold text-xs py-3 rounded-xl transition-all shadow-sm disabled:opacity-50 min-w-[100px] text-center"
                >
                  {updating ? (
                    <span className="flex items-center justify-center gap-1">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Salvando...
                    </span>
                  ) : 'Atualizar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
