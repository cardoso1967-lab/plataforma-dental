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
  Users, Mail, Phone, MapPin, Search, Plus, Edit2, 
  Trash2, Stethoscope, ChevronRight, X, Building2, 
  Layers, Calendar, ClipboardList, Info, CheckCircle, RefreshCw, UserPlus, Wrench
} from 'lucide-react';
import { createSupabaseBrowserClient } from '@/lib/supabase';
import { useAuth } from '@/components/AuthProvider';

interface Customer {
  id: string;
  profile_id: string | null;
  company_name: string;
  trade_name: string | null;
  cnpj: string | null;
  cpf: string | null;
  address_street: string | null;
  address_number: string | null;
  address_complement: string | null;
  address_neighborhood: string | null;
  address_city: string | null;
  address_state: string | null;
  address_zip: string | null;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  notes: string | null;
  created_at: string;
  profile?: {
    name: string;
    phone: string | null;
  } | null;
}

interface ClientEquipment {
  id: string;
  customer_id: string;
  name: string;
  brand: string | null;
  model: string | null;
  serial_number: string | null;
  installation_date: string | null;
  last_maintenance_date: string | null;
  notes: string | null;
}

interface Profile {
  id: string;
  name: string;
  phone: string | null;
}

export default function AdminClientesPage() {
  const supabase = createSupabaseBrowserClient();
  const { profile: adminProfile } = useAuth();

  // Estados de datos
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [equipments, setEquipments] = useState<ClientEquipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estados de búsqueda y filtrado
  const [searchTerm, setSearchTerm] = useState('');

  // Estados de modales y selección
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isEquipmentModalOpen, setIsEquipmentModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [editingEquipment, setEditingEquipment] = useState<ClientEquipment | null>(null);

  // Estados del formulario de cliente
  const [formCustomer, setFormCustomer] = useState({
    company_name: '',
    trade_name: '',
    cnpj: '',
    cpf: '',
    profile_id: '',
    address_street: '',
    address_number: '',
    address_complement: '',
    address_neighborhood: '',
    address_city: '',
    address_state: '',
    address_zip: '',
    contact_name: '',
    email: '',
    phone: '',
    whatsapp: '',
    notes: '',
  });

  // Estados del formulario de equipo
  const [formEquipment, setFormEquipment] = useState({
    name: '',
    brand: '',
    model: '',
    serial_number: '',
    installation_date: '',
    last_maintenance_date: '',
    notes: '',
  });

  // Cargar datos
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. Obtener clientes con perfiles
      const { data: customersData, error: customersError } = await supabase
        .from('customers')
        .select(`
          *,
          profile:profiles(name, phone)
        `)
        .order('company_name', { ascending: true });

      if (customersError) throw customersError;
      
      const formattedCustomers = (customersData || []).map((c: any) => ({
        ...c,
        profile: Array.isArray(c.profile) ? c.profile[0] : c.profile
      }));
      setCustomers(formattedCustomers);

      // 2. Obtener perfiles de clientes disponibles para asociación
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, name, phone')
        .eq('role', 'cliente');

      if (profilesError) throw profilesError;
      setProfiles(profilesData || []);

      // 3. Obtener todos los equipos de clientes
      const { data: equipData, error: equipError } = await supabase
        .from('client_equipment')
        .select('*');

      if (equipError) throw equipError;
      setEquipments(equipData || []);

    } catch (err: any) {
      console.error('Erro ao carregar dados:', err);
      setError(err.message || 'Erro ao carregar dados do servidor.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtrar perfiles libres (no asociados a ningún customer, excepto el del cliente en edición)
  const getFreeProfiles = () => {
    const associatedProfileIds = customers
      .map(c => c.profile_id)
      .filter((id): id is string => !!id && id !== editingCustomer?.profile_id);
    
    return profiles.filter(p => !associatedProfileIds.includes(p.id));
  };

  // Manejar apertura de modal de cliente
  const openCustomerModal = (customer: Customer | null = null) => {
    setEditingCustomer(customer);
    if (customer) {
      setFormCustomer({
        company_name: customer.company_name || '',
        trade_name: customer.trade_name || '',
        cnpj: customer.cnpj || '',
        cpf: customer.cpf || '',
        profile_id: customer.profile_id || '',
        address_street: customer.address_street || '',
        address_number: customer.address_number || '',
        address_complement: customer.address_complement || '',
        address_neighborhood: customer.address_neighborhood || '',
        address_city: customer.address_city || '',
        address_state: customer.address_state || '',
        address_zip: customer.address_zip || '',
        contact_name: customer.contact_name || '',
        email: customer.email || '',
        phone: customer.phone || '',
        whatsapp: customer.whatsapp || '',
        notes: customer.notes || '',
      });
    } else {
      setFormCustomer({
        company_name: '',
        trade_name: '',
        cnpj: '',
        cpf: '',
        profile_id: '',
        address_street: '',
        address_number: '',
        address_complement: '',
        address_neighborhood: '',
        address_city: '',
        address_state: '',
        address_zip: '',
        contact_name: '',
        email: '',
        phone: '',
        whatsapp: '',
        notes: '',
      });
    }
    setIsCustomerModalOpen(true);
  };

  // Guardar cliente
  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCustomer.company_name.trim()) return;

    try {
      setLoading(true);
      const payload = {
        company_name: formCustomer.company_name,
        trade_name: formCustomer.trade_name || null,
        cnpj: formCustomer.cnpj || null,
        cpf: formCustomer.cpf || null,
        profile_id: formCustomer.profile_id || null,
        address_street: formCustomer.address_street || null,
        address_number: formCustomer.address_number || null,
        address_complement: formCustomer.address_complement || null,
        address_neighborhood: formCustomer.address_neighborhood || null,
        address_city: formCustomer.address_city || null,
        address_state: formCustomer.address_state || null,
        address_zip: formCustomer.address_zip || null,
        contact_name: formCustomer.contact_name || null,
        email: formCustomer.email || null,
        phone: formCustomer.phone || null,
        whatsapp: formCustomer.whatsapp || null,
        notes: formCustomer.notes || null,
      };

      if (editingCustomer) {
        // Actualizar
        const { error: saveError } = await supabase
          .from('customers')
          .update(payload)
          .eq('id', editingCustomer.id);
        if (saveError) throw saveError;
      } else {
        // Crear
        const { error: saveError } = await supabase
          .from('customers')
          .insert(payload);
        if (saveError) throw saveError;
      }

      setIsCustomerModalOpen(false);
      setEditingCustomer(null);
      await loadData();
    } catch (err: any) {
      alert('Erro ao salvar cliente: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Eliminar cliente
  const handleDeleteCustomer = async (id: string) => {
    if (!confirm('Deseja realmente excluir este cliente? Todos os equipamentos e ordens vinculadas podem ser afetados.')) return;

    try {
      setLoading(true);
      const { error: delError } = await supabase
        .from('customers')
        .delete()
        .eq('id', id);

      if (delError) throw delError;
      
      if (selectedCustomer?.id === id) {
        setSelectedCustomer(null);
      }
      await loadData();
    } catch (err: any) {
      alert('Erro ao excluir cliente: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Manejar apertura de modal de equipo
  const openEquipmentModal = (equip: ClientEquipment | null = null) => {
    if (!selectedCustomer) return;
    setEditingEquipment(equip);
    if (equip) {
      setFormEquipment({
        name: equip.name || '',
        brand: equip.brand || '',
        model: equip.model || '',
        serial_number: equip.serial_number || '',
        installation_date: equip.installation_date || '',
        last_maintenance_date: equip.last_maintenance_date || '',
        notes: equip.notes || '',
      });
    } else {
      setFormEquipment({
        name: '',
        brand: '',
        model: '',
        serial_number: '',
        installation_date: '',
        last_maintenance_date: '',
        notes: '',
      });
    }
    setIsEquipmentModalOpen(true);
  };

  // Guardar equipo
  const handleSaveEquipment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer || !formEquipment.name.trim()) return;

    try {
      setLoading(true);
      const payload = {
        customer_id: selectedCustomer.id,
        name: formEquipment.name,
        brand: formEquipment.brand || null,
        model: formEquipment.model || null,
        serial_number: formEquipment.serial_number || null,
        installation_date: formEquipment.installation_date || null,
        last_maintenance_date: formEquipment.last_maintenance_date || null,
        notes: formEquipment.notes || null,
      };

      if (editingEquipment) {
        // Actualizar
        const { error: saveError } = await supabase
          .from('client_equipment')
          .update(payload)
          .eq('id', editingEquipment.id);
        if (saveError) throw saveError;
      } else {
        // Crear
        const { error: saveError } = await supabase
          .from('client_equipment')
          .insert(payload);
        if (saveError) throw saveError;
      }

      setIsEquipmentModalOpen(false);
      setEditingEquipment(null);
      await loadData();
      
      // Actualizar cliente seleccionado localmente para refrescar la lista de equipos
      const { data: updatedCust } = await supabase
        .from('customers')
        .select('*, profile:profiles(name, phone)')
        .eq('id', selectedCustomer.id)
        .single();
      if (updatedCust) {
        const formattedCust = {
          ...updatedCust,
          profile: Array.isArray(updatedCust.profile) ? updatedCust.profile[0] : updatedCust.profile
        } as any;
        setSelectedCustomer(formattedCust);
      }

    } catch (err: any) {
      alert('Erro ao salvar equipamento: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Eliminar equipo
  const handleDeleteEquipment = async (id: string) => {
    if (!confirm('Deseja realmente excluir este equipamento?')) return;

    try {
      setLoading(true);
      const { error: delError } = await supabase
        .from('client_equipment')
        .delete()
        .eq('id', id);

      if (delError) throw delError;
      await loadData();
    } catch (err: any) {
      alert('Erro ao excluir equipamento: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Filtrar clientes
  const filteredCustomers = customers.filter(c => {
    const text = searchTerm.toLowerCase();
    const company = c.company_name.toLowerCase();
    const trade = (c.trade_name || '').toLowerCase();
    const cnpj = (c.cnpj || '').toLowerCase();
    const cpf = (c.cpf || '').toLowerCase();
    const profileName = (c.profile?.name || '').toLowerCase();

    return company.includes(text) || 
      trade.includes(text) || 
      cnpj.includes(text) || 
      cpf.includes(text) || 
      profileName.includes(text);
  });

  const selectedCustomerEquipments = equipments.filter(
    eq => eq.customer_id === selectedCustomer?.id
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header Premium */}
      <PageHero
        title="Gestão de Clientes"
        description="Gerencie clínicas, consultórios, dentistas cadastrados e seus respectivos equipamentos odontológicos."
        badge="Administração de Clientes"
        icon={Users}
        rightElement={
          <PremiumButton
            onClick={() => openCustomerModal()}
            icon={<Plus className="w-4 h-4" />}
            variant="primary"
          >
            Novo Cliente
          </PremiumButton>
        }
      />

      {/* Métricas rápidas de clientes */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total de Clientes"
          value={customers.length}
          description="Clínicas e Dentistas"
          variant="default"
        />
        <MetricCard
          title="Equipamentos Ativos"
          value={equipments.length}
          description="Sob manutenção"
          icon={<Wrench className="w-5 h-5 text-sky-600" />}
          variant="default"
        />
        <MetricCard
          title="Contas Associadas"
          value={customers.filter(c => c.profile_id).length}
          description="Acesso ao portal liberado"
          variant="emerald"
        />
        <MetricCard
          title="Sem Conta"
          value={customers.filter(c => !c.profile_id).length}
          description="Pendente vinculação"
          variant="amber"
        />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Lista de Clientes */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-xs p-6 space-y-5">
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between pb-2 border-b border-slate-50">
              <h3 className="font-extrabold text-sm text-slate-800 flex items-center gap-1.5 text-left">
                Clientes Cadastrados ({filteredCustomers.length})
              </h3>
              
              {/* Buscador */}
              <div className="relative flex-1 max-w-sm">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar cliente, CNPJ, responsável..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-brand-clinical focus:ring-2 focus:ring-sky-100 bg-slate-50/20 transition-all text-slate-700 font-sans"
                />
              </div>
            </div>

            {loading && customers.length === 0 ? (
              <div className="text-center py-12 text-slate-400 font-medium text-xs">
                Carregando clientes...
              </div>
            ) : filteredCustomers.length === 0 ? (
              <EmptyState
                title="Nenhum cliente registrado"
                description="Cadastre o seu primeiro cliente (clínica odontológica ou cirurgião-dentista) para gerenciar chamados operacionais e equipamentos."
                icon={<UserPlus className="w-6 h-6 text-sky-600" />}
                actionLabel="Cadastrar Cliente"
                onActionClick={() => openCustomerModal()}
              />
            ) : (
              <div className="overflow-x-auto no-scrollbar">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="text-slate-400 font-bold border-b border-slate-100">
                      <th className="pb-3 pr-2 pl-2">Razão Social / Nome</th>
                      <th className="pb-3 px-2">Documento</th>
                      <th className="pb-3 px-2">Contato Responsável</th>
                      <th className="pb-3 px-2">Cidade/UF</th>
                      <th className="pb-3 pr-2 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredCustomers.map((client) => {
                      const isSelected = selectedCustomer?.id === client.id;
                      const initials = client.company_name.substring(0, 2).toUpperCase();
                      
                      const colors = [
                        'bg-sky-50 text-brand-clinical border-sky-105',
                        'bg-emerald-50 text-emerald-600 border-emerald-105',
                        'bg-indigo-50 text-indigo-600 border-indigo-105',
                        'bg-purple-50 text-purple-600 border-purple-105',
                        'bg-amber-50 text-amber-600 border-amber-105',
                      ];
                      const colorIndex = initials.charCodeAt(0) % colors.length;
                      const colorClass = colors[colorIndex];

                      return (
                        <tr 
                          key={client.id} 
                          onClick={() => setSelectedCustomer(client)}
                          className={`hover:bg-slate-50/30 transition-all duration-150 cursor-pointer ${
                            isSelected ? 'bg-sky-50/20 font-semibold border-l-2 border-brand-clinical shadow-2xs' : ''
                          }`}
                        >
                          <td className="py-4 pr-2 pl-2 text-left">
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-xl border flex items-center justify-center font-bold text-[10px] ${colorClass} flex-shrink-0`}>
                                {initials}
                              </div>
                              <div>
                                <div className="font-extrabold text-slate-800 text-xs line-clamp-1">{client.company_name}</div>
                                {client.trade_name && (
                                  <div className="text-[10px] text-slate-400 font-medium font-sans line-clamp-1">
                                    {client.trade_name}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-2 text-slate-500 font-bold font-mono">
                            {client.cnpj || client.cpf || '—'}
                          </td>
                          <td className="py-4 px-2 text-left">
                            {client.profile ? (
                              <div className="space-y-0.5">
                                <div className="font-bold text-slate-700 text-xs">{client.profile.name}</div>
                                {client.profile.phone && (
                                  <div className="text-[10px] text-slate-400 flex items-center gap-0.5 font-semibold">
                                    <Phone className="w-2.5 h-2.5" /> {client.profile.phone}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-[10px] text-slate-400 italic font-semibold bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">
                                Sem conta associada
                              </span>
                            )}
                          </td>
                          <td className="py-4 px-2 text-slate-500 font-semibold">
                            {client.address_city ? `${client.address_city} - ${client.address_state || ''}` : '—'}
                          </td>
                          <td className="py-4 pr-2 text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => openCustomerModal(client)}
                                className="p-1.5 text-slate-400 hover:text-brand-clinical rounded-lg hover:bg-slate-50 transition-colors"
                                title="Editar Cliente"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteCustomer(client.id)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-50 transition-colors"
                                title="Excluir Cliente"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                              <ChevronRight className="w-4 h-4 text-slate-300" />
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Ficha Detalhada e Equipamentos */}
        <div className="lg:col-span-1">
          {selectedCustomer ? (
            <div className="bg-gradient-to-b from-white to-slate-50/35 rounded-3xl border border-slate-200/80 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.02)] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              {/* Header Ficha Premium */}
              <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-sky-950 text-white p-5 space-y-2 relative text-left border-b border-slate-800">
                <button
                  onClick={() => setSelectedCustomer(null)}
                  className="absolute right-4 top-4 text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 p-1.5 rounded-lg border border-white/5 transition-all cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
                <div className="flex items-center gap-2">
                  <div className="bg-sky-500/10 text-sky-450 p-1.5 rounded-lg border border-sky-550/20">
                    <Building2 className="w-4 h-4 stroke-[2]" />
                  </div>
                  <span className="text-[9px] font-bold tracking-widest text-sky-400 uppercase font-mono">Ficha do Cliente</span>
                </div>
                <h2 className="font-extrabold text-sm leading-tight pr-6">{selectedCustomer.company_name}</h2>
                <p className="text-[10px] text-slate-350 font-medium">{selectedCustomer.trade_name || 'Sem nome fantasia'}</p>
              </div>

              {/* Endereço e Dados Básicos */}
              <div className="p-5 border-b border-slate-100/60 space-y-4 text-left">
                <h4 className="font-bold text-[9px] text-slate-400 uppercase tracking-widest font-mono">Dados e Endereço</h4>
                
                <div className="grid grid-cols-2 gap-4 text-[11px] font-bold text-slate-700">
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-wider mb-0.5 font-mono">Documento</span>
                    <span className="font-mono text-slate-900">{selectedCustomer.cnpj || selectedCustomer.cpf || '—'}</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-wider mb-0.5 font-mono">Telefone</span>
                    <span className="text-slate-900">{selectedCustomer.phone || selectedCustomer.profile?.phone || '—'}</span>
                  </div>
                </div>

                <div className="pt-3.5 flex gap-2.5 text-[11px] font-bold text-slate-700 border-t border-slate-100/60">
                  <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0 stroke-[2]" />
                  <div className="space-y-0.5 leading-normal text-slate-600">
                    <span className="text-slate-800">
                      {selectedCustomer.address_street || '—'}
                      {selectedCustomer.address_number ? `, ${selectedCustomer.address_number}` : ''}
                    </span>
                    {selectedCustomer.address_complement && (
                      <span className="block text-slate-450 font-medium text-[10px]">
                        {selectedCustomer.address_complement}
                      </span>
                    )}
                    <span className="block text-slate-450 font-medium text-[10px]">
                      {selectedCustomer.address_neighborhood ? `${selectedCustomer.address_neighborhood}, ` : ''}
                      {selectedCustomer.address_city ? `${selectedCustomer.address_city} - ` : ''}
                      {selectedCustomer.address_state || ''}
                    </span>
                  </div>
                </div>
              </div>

              {/* Equipamentos */}
              <div className="p-5 space-y-4 text-left">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-[9px] text-slate-400 uppercase tracking-widest flex items-center gap-1.5 font-mono">
                    <Stethoscope className="w-4 h-4 text-sky-655 stroke-[2]" />
                    Equipamentos ({selectedCustomerEquipments.length})
                  </h4>
                  <button
                    onClick={() => openEquipmentModal()}
                    className="text-[10px] font-bold text-sky-655 hover:text-sky-700 bg-sky-500/10 hover:bg-sky-500/15 px-3 py-1.5 rounded-xl border border-sky-500/20 transition-all cursor-pointer hover:scale-[1.015]"
                  >
                    + Adicionar
                  </button>
                </div>

                {selectedCustomerEquipments.length === 0 ? (
                  <EmptyState
                    title="Nenhum equipamento"
                    description="Cadastre os equipamentos desta clínica para acompanhar o histórico de manutenções preventivas e corretivas."
                    icon={<Stethoscope className="w-5 h-5 text-slate-400" />}
                    actionLabel="Adicionar Equipamento"
                    onActionClick={() => openEquipmentModal()}
                  />
                ) : (
                  <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1 no-scrollbar">
                    {selectedCustomerEquipments.map((equip) => (
                      <div 
                        key={equip.id} 
                        className="border border-slate-200 rounded-2xl p-3 bg-white hover:bg-slate-50/50 transition-all duration-200 flex justify-between items-start gap-2 group shadow-3xs"
                      >
                        <div className="space-y-1.5 text-left">
                          <h5 className="font-extrabold text-xs text-slate-800">{equip.name}</h5>
                          <div className="text-[10px] font-medium text-slate-450 space-y-0.5">
                            <p>Marca: <span className="font-bold text-slate-600">{equip.brand || '—'}</span> | Modelo: <span className="font-bold text-slate-600">{equip.model || '—'}</span></p>
                            {equip.serial_number && <p className="font-mono text-[9px] text-slate-400">N/S: {equip.serial_number}</p>}
                            {equip.installation_date && (
                              <p className="flex items-center gap-1 text-slate-400 text-[9px] pt-0.5 font-medium">
                                <Calendar className="w-2.5 h-2.5 stroke-[2]" /> Instalação: {new Date(equip.installation_date).toLocaleDateString('pt-BR')}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-0.5 opacity-60 group-hover:opacity-100 transition-opacity shrink-0">
                          <button
                            onClick={() => openEquipmentModal(equip)}
                            className="p-1.5 text-slate-400 hover:text-sky-655 hover:bg-slate-100 rounded-lg transition-all cursor-pointer"
                            title="Editar equipamento"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteEquipment(equip.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition-all cursor-pointer"
                            title="Excluir equipamento"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="py-16 px-6 text-center border border-slate-200/80 rounded-3xl bg-gradient-to-b from-white to-slate-50/30 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.02)] min-h-[350px] flex flex-col items-center justify-center">
              <EmptyState
                title="Selecione um Cliente"
                description="Escolha uma clínica ou consultório listado na tabela ao lado para visualizar os detalhes completos, contatos operacionais e histórico de equipamentos instalados."
                icon={<Building2 className="w-5 h-5 text-slate-400 stroke-[2]" />}
              />
            </div>
          )}
        </div>
      </div>


      {/* Modal Cliente */}
      <PremiumModal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        title={editingCustomer ? 'Editar Cliente' : 'Novo Cliente'}
        size="lg"
      >
        <form onSubmit={handleSaveCustomer} className="space-y-6 text-left">
          {/* Seção Dados Principais */}
          <div className="space-y-4">
            <h4 className="font-bold text-xs text-sky-600 uppercase tracking-wider">Informações Principais</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <PremiumInput
                label="Razão Social / Nome completo"
                name="company_name"
                required
                value={formCustomer.company_name}
                onChange={(e) => setFormCustomer({ ...formCustomer, company_name: e.target.value })}
                placeholder="Ex: Clínica Sorriso Lindo Ltda"
              />
              <PremiumInput
                label="Nome Fantasia"
                name="trade_name"
                value={formCustomer.trade_name}
                onChange={(e) => setFormCustomer({ ...formCustomer, trade_name: e.target.value })}
                placeholder="Ex: Sorriso Lindo"
              />
              <PremiumInput
                label="CNPJ (apenas números)"
                name="cnpj"
                value={formCustomer.cnpj}
                onChange={(e) => setFormCustomer({ ...formCustomer, cnpj: e.target.value })}
                placeholder="Ex: 12345678000190"
              />
              <PremiumInput
                label="CPF (se for pessoa física)"
                name="cpf"
                value={formCustomer.cpf}
                onChange={(e) => setFormCustomer({ ...formCustomer, cpf: e.target.value })}
                placeholder="Ex: 12345678900"
              />
              <PremiumInput
                label="Vincular Conta de Usuário (Opcional)"
                name="profile_id"
                as="select"
                value={formCustomer.profile_id}
                onChange={(e) => setFormCustomer({ ...formCustomer, profile_id: e.target.value })}
                placeholder="Nenhuma conta associada (Criar sem perfil)"
                options={getFreeProfiles().map(p => ({
                  value: p.id,
                  label: `${p.name} ${p.phone ? `(${p.phone})` : ''}`
                }))}
                className="sm:col-span-2"
              />
            </div>
          </div>

          {/* Seção Dados de Contato */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h4 className="font-bold text-xs text-sky-600 uppercase tracking-wider">Informações de Contato Operacional</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <PremiumInput
                label="Nome do Contato Principal"
                name="contact_name"
                value={formCustomer.contact_name || ''}
                onChange={(e) => setFormCustomer({ ...formCustomer, contact_name: e.target.value })}
                placeholder="Ex: Dra. Sandra Melo"
              />
              <PremiumInput
                label="E-mail de Contato"
                name="email"
                type="email"
                value={formCustomer.email || ''}
                onChange={(e) => setFormCustomer({ ...formCustomer, email: e.target.value })}
                placeholder="Ex: sandra@clinica.com"
              />
              <PremiumInput
                label="Telefone de Contato"
                name="phone"
                value={formCustomer.phone || ''}
                onChange={(e) => setFormCustomer({ ...formCustomer, phone: e.target.value })}
                placeholder="Ex: (11) 98888-7777"
              />
              <PremiumInput
                label="WhatsApp"
                name="whatsapp"
                value={formCustomer.whatsapp || ''}
                onChange={(e) => setFormCustomer({ ...formCustomer, whatsapp: e.target.value })}
                placeholder="Ex: (11) 98888-7777"
              />
              <PremiumInput
                label="Anotações Internas (Horários de atendimento, etc.)"
                name="notes"
                as="textarea"
                value={formCustomer.notes || ''}
                onChange={(e) => setFormCustomer({ ...formCustomer, notes: e.target.value })}
                placeholder="Ex: Consultório fecha às sextas à tarde..."
                className="sm:col-span-2"
                rows={2}
              />
            </div>
          </div>

          {/* Seção Endereço */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h4 className="font-bold text-xs text-sky-600 uppercase tracking-wider">Endereço de Atendimento</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <PremiumInput
                label="Rua / Avenida"
                name="address_street"
                value={formCustomer.address_street || ''}
                onChange={(e) => setFormCustomer({ ...formCustomer, address_street: e.target.value })}
                placeholder="Ex: Av. Paulista"
                className="sm:col-span-2"
              />
              <PremiumInput
                label="Número"
                name="address_number"
                value={formCustomer.address_number || ''}
                onChange={(e) => setFormCustomer({ ...formCustomer, address_number: e.target.value })}
                placeholder="Ex: 1000"
              />
              <PremiumInput
                label="Complemento"
                name="address_complement"
                value={formCustomer.address_complement || ''}
                onChange={(e) => setFormCustomer({ ...formCustomer, address_complement: e.target.value })}
                placeholder="Ex: Sala 42"
              />
              <PremiumInput
                label="Bairro"
                name="address_neighborhood"
                value={formCustomer.address_neighborhood || ''}
                onChange={(e) => setFormCustomer({ ...formCustomer, address_neighborhood: e.target.value })}
                placeholder="Ex: Bela Vista"
              />
              <PremiumInput
                label="CEP"
                name="address_zip"
                value={formCustomer.address_zip || ''}
                onChange={(e) => setFormCustomer({ ...formCustomer, address_zip: e.target.value })}
                placeholder="Ex: 01311100"
              />
              <PremiumInput
                label="Cidade"
                name="address_city"
                value={formCustomer.address_city || ''}
                onChange={(e) => setFormCustomer({ ...formCustomer, address_city: e.target.value })}
                placeholder="Ex: São Paulo"
                className="sm:col-span-2"
              />
              <PremiumInput
                label="Estado (UF)"
                name="address_state"
                value={formCustomer.address_state || ''}
                onChange={(e) => setFormCustomer({ ...formCustomer, address_state: e.target.value })}
                placeholder="Ex: SP"
              />
            </div>
          </div>

          {/* Botões Ação */}
          <div className="flex justify-end gap-3 pt-6 border-t border-slate-100 bg-slate-50 -mx-6 -mb-6 p-6 rounded-b-3xl">
            <PremiumButton
              variant="outline"
              onClick={() => setIsCustomerModalOpen(false)}
            >
              Cancelar
            </PremiumButton>
            <PremiumButton
              type="submit"
              loading={loading}
              variant="primary"
            >
              Salvar Cliente
            </PremiumButton>
          </div>
        </form>
      </PremiumModal>

      {/* Modal Equipamento */}
      <PremiumModal
        isOpen={isEquipmentModalOpen && !!selectedCustomer}
        onClose={() => setIsEquipmentModalOpen(false)}
        title={editingEquipment ? 'Editar Equipamento' : 'Adicionar Equipamento'}
      >
        <form onSubmit={handleSaveEquipment} className="space-y-4 text-left">
          <PremiumInput
            label="Nome do Equipamento"
            name="name"
            required
            value={formEquipment.name}
            onChange={(e) => setFormEquipment({ ...formEquipment, name: e.target.value })}
            placeholder="Ex: Cadeira Odontológica, Autoclave, Raio-X"
          />

          <div className="grid grid-cols-2 gap-4">
            <PremiumInput
              label="Marca"
              name="brand"
              value={formEquipment.brand || ''}
              onChange={(e) => setFormEquipment({ ...formEquipment, brand: e.target.value })}
              placeholder="Ex: Olsen, Dabi Atlante"
            />
            <PremiumInput
              label="Modelo"
              name="model"
              value={formEquipment.model || ''}
              onChange={(e) => setFormEquipment({ ...formEquipment, model: e.target.value })}
              placeholder="Ex: Premium S500"
            />
          </div>

          <PremiumInput
            label="Número de Série (N/S)"
            name="serial_number"
            value={formEquipment.serial_number || ''}
            onChange={(e) => setFormEquipment({ ...formEquipment, serial_number: e.target.value })}
            placeholder="Ex: SN-987654321"
            className="font-mono"
          />

          <div className="grid grid-cols-2 gap-4">
            <PremiumInput
              label="Data de Instalação"
              name="installation_date"
              type="date"
              value={formEquipment.installation_date || ''}
              onChange={(e) => setFormEquipment({ ...formEquipment, installation_date: e.target.value })}
            />
            <PremiumInput
              label="Última Manutenção"
              name="last_maintenance_date"
              type="date"
              value={formEquipment.last_maintenance_date || ''}
              onChange={(e) => setFormEquipment({ ...formEquipment, last_maintenance_date: e.target.value })}
            />
          </div>

          <PremiumInput
            label="Observações técnicas"
            name="notes"
            as="textarea"
            value={formEquipment.notes || ''}
            onChange={(e) => setFormEquipment({ ...formEquipment, notes: e.target.value })}
            placeholder="Histórico técnico, problemas recorrentes..."
            rows={2.5}
          />

          {/* Botões Ação */}
          <div className="flex justify-end gap-3 pt-6 border-t border-slate-100 bg-slate-50 -mx-6 -mb-6 p-6">
            <PremiumButton
              variant="outline"
              onClick={() => setIsEquipmentModalOpen(false)}
            >
              Cancelar
            </PremiumButton>
            <PremiumButton
              type="submit"
              loading={loading}
              variant="primary"
            >
              Salvar Equipamento
            </PremiumButton>
          </div>
        </form>
      </PremiumModal>
    </div>
  );
}
