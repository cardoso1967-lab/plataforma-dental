'use client';

import React, { useEffect, useState } from 'react';
import { 
  Wrench, User, Calendar, Search, Eye, RefreshCw, MapPin, ClipboardList
} from 'lucide-react';
import { createSupabaseBrowserClient } from '@/lib/supabase';
import { useAuth } from '@/components/AuthProvider';

import { PageHero } from '@/components/ui/PageHero';
import { EmptyState } from '@/components/ui/EmptyState';
import { PremiumModal } from '@/components/ui/PremiumModal';
import { PremiumInput } from '@/components/ui/PremiumInput';
import { PremiumButton } from '@/components/ui/PremiumButton';
import { StatusBadge } from '@/components/ui/StatusBadge';

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
      case 'aguardando_peca': return 'warning';
      case 'orcamento_pendente': return 'warning';
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
      {/* Header */}
      <PageHero
        title="Ordens de Serviço"
        description="Gerencie e atualize seus atendimentos técnicos diretamente em campo."
        badge="Serviços"
        icon={Wrench}
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
                  {os.equipment?.name || 'Equipamento Geral'}
                </h4>
                {os.equipment?.brand && (
                  <p className="text-[10px] text-slate-400 font-bold">
                    {os.equipment.brand} • {os.equipment.model}
                  </p>
                )}
                <div className="flex items-center gap-1.5 text-xs text-slate-655 font-semibold pt-1">
                  <User className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                  <span className="line-clamp-1">{os.customer?.company_name}</span>
                </div>
              </div>

              {/* Fecha y Dirección */}
              <div className="bg-slate-50/50 rounded-xl p-4 text-xs font-semibold text-slate-600 space-y-2 text-left border border-slate-150/40 shadow-[inset_0_1px_2px_rgba(0,0,0,0.01)]">
                {os.scheduled_date && (
                  <div className="flex items-center gap-1.5 text-sky-600 font-extrabold text-[11px]">
                    <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>Agendado: {new Date(os.scheduled_date).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</span>
                  </div>
                )}
                {os.customer && (
                  <div className="flex items-start gap-1.5 text-[10.5px] text-slate-400 font-medium leading-relaxed">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
                    <span>{os.customer.address_street}, {os.customer.address_number} - {os.customer.address_city}</span>
                  </div>
                )}
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

      {/* Modal Táctil Completo de Actualización de OS */}
      <PremiumModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedOS ? `OS #${selectedOS.id.slice(0, 8).toUpperCase()}` : ''}
        size="sm"
      >
        {selectedOS && (
          <form onSubmit={handleUpdateStatus} className="space-y-4 text-left">
            {/* Información del Cliente */}
            <div className="space-y-1 bg-slate-50 p-4.5 rounded-2xl border border-slate-100 text-xs font-semibold text-slate-655 text-left">
              <p className="text-slate-800 font-black">{selectedOS.customer?.company_name}</p>
              <p className="text-slate-400 font-semibold text-[10.5px] leading-relaxed">
                {selectedOS.customer?.address_street}, {selectedOS.customer?.address_number} - {selectedOS.customer?.address_city}
              </p>
              {selectedOS.customer?.phone && (
                <p className="text-sky-600 font-extrabold text-[10.5px] pt-1">
                  Fone: {selectedOS.customer.phone}
                </p>
              )}
            </div>

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

            {/* Anotaciones Técnicas */}
            <PremiumInput
              label="Observações Técnicas / Laudo de Campo"
              name="notes"
              as="textarea"
              value={techNotes}
              onChange={(e) => setTechNotes(e.target.value)}
              placeholder="Descreva o diagnóstico, peças substituídas ou justificativas de mudança de status..."
              rows={4}
            />

            {/* Botones de acción táctiles grandes */}
            <div className="flex gap-3 pt-4 border-t border-slate-100">
              <PremiumButton
                onClick={() => setIsModalOpen(false)}
                variant="outline"
                className="flex-1"
              >
                Voltar
              </PremiumButton>
              <PremiumButton
                type="submit"
                loading={updating}
                variant="primary"
                className="flex-1"
              >
                Atualizar
              </PremiumButton>
            </div>
          </form>
        )}
      </PremiumModal>
    </div>
  );
}
