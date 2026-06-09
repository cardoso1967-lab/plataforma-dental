'use client';

import React, { useEffect, useState } from 'react';
import { 
  Users, Mail, Phone, MapPin, Search, Plus, Edit2, 
  Trash2, Stethoscope, ChevronRight, X, Building2, 
  Layers, Calendar, ClipboardList, Info, CheckCircle, RefreshCw
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
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-100 pb-5">
        <div className="space-y-1 text-left">
          <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2.5">
            <div className="p-2 bg-sky-50 text-brand-clinical rounded-2xl shadow-2xs">
              <Users className="w-6 h-6" />
            </div>
            Gestão de Clientes
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Gerencie clínicas, consultórios, dentistas cadastrados e seus respectivos equipamentos odontológicos.
          </p>
        </div>
        <button
          onClick={() => openCustomerModal()}
          className="bg-brand-clinical hover:bg-sky-700 hover:shadow-md text-white text-xs font-bold px-4.5 py-2.5 rounded-xl transition-all duration-200 flex items-center justify-center gap-1.5 shadow-sm hover:scale-[1.02] active:scale-[0.98] self-start md:self-center"
        >
          <Plus className="w-4 h-4" /> Novo Cliente
        </button>
      </div>

      {/* Métricas rápidas de clientes */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4.5 rounded-2xl border border-slate-100 shadow-2xs text-left">
          <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest block font-sans">Total de Clientes</span>
          <p className="text-lg font-black text-slate-800">{customers.length}</p>
          <span className="text-[9.5px] text-slate-400 font-medium">Clínicas e Dentistas</span>
        </div>
        <div className="bg-white p-4.5 rounded-2xl border border-slate-100 shadow-2xs text-left">
          <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest block font-sans">Equipamentos Ativos</span>
          <p className="text-lg font-black text-slate-800">{equipments.length}</p>
          <span className="text-[9.5px] text-brand-clinical font-semibold">Sob manutenção</span>
        </div>
        <div className="bg-white p-4.5 rounded-2xl border border-slate-100 shadow-2xs text-left">
          <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest block font-sans">Contas Associadas</span>
          <p className="text-lg font-black text-emerald-600">{customers.filter(c => c.profile_id).length}</p>
          <span className="text-[9.5px] text-slate-400 font-medium font-sans">Acesso ao portal liberado</span>
        </div>
        <div className="bg-white p-4.5 rounded-2xl border border-slate-100 shadow-2xs text-left">
          <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest block font-sans">Sem Conta</span>
          <p className="text-lg font-black text-amber-600">{customers.filter(c => !c.profile_id).length}</p>
          <span className="text-[9.5px] text-slate-400 font-medium font-sans">Pendente vinculação</span>
        </div>
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
                  className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-brand-clinical focus:ring-2 focus:ring-sky-100 bg-slate-50/40 transition-all text-slate-700 font-sans"
                />
              </div>
            </div>

            {loading && customers.length === 0 ? (
              <div className="text-center py-12 text-slate-400 font-medium text-xs">
                Carregando clientes...
              </div>
            ) : filteredCustomers.length === 0 ? (
              <div className="text-center py-12 text-slate-400 font-medium text-xs border-2 border-dashed border-slate-100 rounded-2xl bg-slate-50/10">
                Nenhum cliente cadastrado ou encontrado.
              </div>
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
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden space-y-0 animate-in fade-in zoom-in-95 duration-200">
              {/* Header Ficha Premium */}
              <div className="bg-gradient-to-r from-slate-900 to-sky-950 text-white p-5 space-y-2 relative text-left">
                <button
                  onClick={() => setSelectedCustomer(null)}
                  className="absolute right-4 top-4 text-slate-400 hover:text-white bg-white/10 hover:bg-white/20 p-1.5 rounded-lg transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
                <div className="flex items-center gap-2">
                  <div className="bg-brand-clinical/20 text-sky-400 p-1.5 rounded-lg border border-sky-400/20">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-extrabold tracking-wider text-sky-400 uppercase">Ficha do Cliente</span>
                </div>
                <h2 className="font-extrabold text-sm leading-tight pr-6">{selectedCustomer.company_name}</h2>
                <p className="text-[10px] text-slate-300 font-medium">{selectedCustomer.trade_name || 'Sem nome fantasia'}</p>
              </div>

              {/* Endereço e Dados Básicos */}
              <div className="p-5 border-b border-slate-50 space-y-4 text-left">
                <h4 className="font-extrabold text-[10px] text-slate-400 uppercase tracking-widest font-sans">Dados e Endereço</h4>
                
                <div className="grid grid-cols-2 gap-4 text-[11px] font-bold text-slate-700">
                  <div>
                    <span className="text-[9px] font-extrabold text-slate-400 block uppercase tracking-wider mb-0.5">Documento</span>
                    <span className="font-mono">{selectedCustomer.cnpj || selectedCustomer.cpf || '—'}</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-extrabold text-slate-400 block uppercase tracking-wider mb-0.5">Telefone</span>
                    <span>{selectedCustomer.phone || selectedCustomer.profile?.phone || '—'}</span>
                  </div>
                </div>

                <div className="pt-2 flex gap-2 text-[11px] font-bold text-slate-700 border-t border-slate-50/50">
                  <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <div className="space-y-0.5 leading-normal">
                    <span>
                      {selectedCustomer.address_street || '—'}
                      {selectedCustomer.address_number ? `, ${selectedCustomer.address_number}` : ''}
                    </span>
                    {selectedCustomer.address_complement && (
                      <span className="block text-slate-400 font-semibold text-[10px]">
                        {selectedCustomer.address_complement}
                      </span>
                    )}
                    <span className="block text-slate-400 font-semibold text-[10px]">
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
                  <h4 className="font-extrabold text-[10px] text-slate-400 uppercase tracking-widest flex items-center gap-1.5 font-sans">
                    <Stethoscope className="w-4 h-4 text-brand-clinical" />
                    Equipamentos ({selectedCustomerEquipments.length})
                  </h4>
                  <button
                    onClick={() => openEquipmentModal()}
                    className="text-[10px] font-extrabold text-brand-clinical hover:text-sky-700 bg-sky-50 hover:bg-sky-100/70 px-3 py-1.5 rounded-xl border border-sky-100 transition-colors"
                  >
                    + Adicionar
                  </button>
                </div>

                {selectedCustomerEquipments.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-[10px] font-semibold border border-dashed border-slate-100 rounded-2xl bg-slate-50/5">
                    Nenhum equipamento cadastrado para este cliente.
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1 no-scrollbar">
                    {selectedCustomerEquipments.map((equip) => (
                      <div 
                        key={equip.id} 
                        className="border border-slate-100/80 rounded-2xl p-3 bg-slate-50/20 hover:bg-slate-50/60 transition-all duration-200 flex justify-between items-start gap-2 group shadow-2xs hover:shadow-xs animate-in fade-in duration-200"
                      >
                        <div className="space-y-1 text-left">
                          <h5 className="font-extrabold text-xs text-slate-800">{equip.name}</h5>
                          <div className="text-[10px] font-bold text-slate-500 space-y-0.5">
                            <p>Marca: {equip.brand || '—'} | Modelo: {equip.model || '—'}</p>
                            {equip.serial_number && <p className="font-mono text-[9px] text-slate-400">N/S: {equip.serial_number}</p>}
                            {equip.installation_date && (
                              <p className="flex items-center gap-0.5 text-slate-400 text-[9px] font-semibold pt-0.5">
                                <Calendar className="w-2.5 h-2.5" /> Instalação: {new Date(equip.installation_date).toLocaleDateString('pt-BR')}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-0.5 opacity-60 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => openEquipmentModal(equip)}
                            className="p-1.5 text-slate-400 hover:text-brand-clinical hover:bg-white rounded-lg border border-transparent hover:border-slate-100 transition-all shadow-2xs"
                            title="Editar equipamento"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteEquipment(equip.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-white rounded-lg border border-transparent hover:border-slate-100 transition-all shadow-2xs"
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
            <div className="bg-slate-50/40 border border-dashed border-slate-200 rounded-3xl p-8 text-center text-slate-400 space-y-2.5 shadow-2xs">
              <Building2 className="w-8 h-8 mx-auto text-slate-355" />
              <h4 className="font-extrabold text-[10px] uppercase tracking-wider text-slate-400">Nenhum cliente selecionado</h4>
              <p className="text-[10px] font-semibold text-slate-400 font-sans max-w-xs mx-auto leading-relaxed">
                Selecione um cliente na tabela ao lado para visualizar informações de contato, endereço e gerenciar equipamentos vinculados.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modal Cliente */}
      {isCustomerModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 transition-all">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-100 flex flex-col animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-extrabold text-sm text-brand-dark flex items-center gap-2">
                <Building2 className="w-5 h-5 text-brand-clinical animate-pulse" />
                {editingCustomer ? 'Editar Cliente' : 'Novo Cliente'}
              </h3>
              <button
                onClick={() => setIsCustomerModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCustomer} className="p-6 space-y-6 flex-1 text-left">
              {/* Seção Dados Principais */}
              <div className="space-y-4">
                <h4 className="font-bold text-xs text-brand-clinical uppercase tracking-wider">Informações Principais</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Razão Social / Nome completo *</label>
                    <input
                      type="text"
                      required
                      value={formCustomer.company_name}
                      onChange={(e) => setFormCustomer({ ...formCustomer, company_name: e.target.value })}
                      className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:outline-none focus:border-brand-clinical focus:ring-2 focus:ring-sky-100 transition-all bg-slate-50/20"
                      placeholder="Ex: Clínica Sorriso Lindo Ltda"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Nome Fantasia</label>
                    <input
                      type="text"
                      value={formCustomer.trade_name}
                      onChange={(e) => setFormCustomer({ ...formCustomer, trade_name: e.target.value })}
                      className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:outline-none focus:border-brand-clinical focus:ring-2 focus:ring-sky-100 transition-all bg-slate-50/20"
                      placeholder="Ex: Sorriso Lindo"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">CNPJ (apenas números)</label>
                    <input
                      type="text"
                      value={formCustomer.cnpj}
                      onChange={(e) => setFormCustomer({ ...formCustomer, cnpj: e.target.value })}
                      className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:outline-none focus:border-brand-clinical focus:ring-2 focus:ring-sky-100 transition-all bg-slate-50/20"
                      placeholder="Ex: 12345678000190"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">CPF (se for pessoa física)</label>
                    <input
                      type="text"
                      value={formCustomer.cpf}
                      onChange={(e) => setFormCustomer({ ...formCustomer, cpf: e.target.value })}
                      className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:outline-none focus:border-brand-clinical focus:ring-2 focus:ring-sky-100 transition-all bg-slate-50/20"
                      placeholder="Ex: 12345678900"
                    />
                  </div>

                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Vincular Conta de Usuário (Opcional)</label>
                    <select
                      value={formCustomer.profile_id}
                      onChange={(e) => setFormCustomer({ ...formCustomer, profile_id: e.target.value })}
                      className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:outline-none focus:border-brand-clinical focus:ring-2 focus:ring-sky-100 transition-all bg-white font-semibold"
                    >
                      <option value="">Nenhuma conta associada (Criar sem perfil)</option>
                      {getFreeProfiles().map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} {p.phone ? `(${p.phone})` : ''}
                        </option>
                      ))}
                    </select>
                    <p className="text-[9px] text-slate-400 font-medium font-sans">
                      Apenas contas registradas na plataforma com o perfil &quot;cliente&quot; que ainda não estão vinculadas a outros clientes aparecem aqui.
                    </p>
                  </div>
                </div>
              </div>

              {/* Seção Dados de Contato */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <h4 className="font-bold text-xs text-brand-clinical uppercase tracking-wider">Informações de Contato Operacional</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Nome do Contato Principal</label>
                    <input
                      type="text"
                      value={formCustomer.contact_name}
                      onChange={(e) => setFormCustomer({ ...formCustomer, contact_name: e.target.value })}
                      className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:outline-none focus:border-brand-clinical focus:ring-2 focus:ring-sky-100 transition-all bg-slate-50/20"
                      placeholder="Ex: Dra. Sandra Melo"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">E-mail de Contato</label>
                    <input
                      type="email"
                      value={formCustomer.email}
                      onChange={(e) => setFormCustomer({ ...formCustomer, email: e.target.value })}
                      className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:outline-none focus:border-brand-clinical focus:ring-2 focus:ring-sky-100 transition-all bg-slate-50/20"
                      placeholder="Ex: sandra@clinica.com"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Telefone de Contato</label>
                    <input
                      type="text"
                      value={formCustomer.phone}
                      onChange={(e) => setFormCustomer({ ...formCustomer, phone: e.target.value })}
                      className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:outline-none focus:border-brand-clinical focus:ring-2 focus:ring-sky-100 transition-all bg-slate-50/20"
                      placeholder="Ex: (11) 98888-7777"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">WhatsApp</label>
                    <input
                      type="text"
                      value={formCustomer.whatsapp}
                      onChange={(e) => setFormCustomer({ ...formCustomer, whatsapp: e.target.value })}
                      className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:outline-none focus:border-brand-clinical focus:ring-2 focus:ring-sky-100 transition-all bg-slate-50/20"
                      placeholder="Ex: (11) 98888-7777"
                    />
                  </div>

                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Anotações Internas (Horários de atendimento, etc.)</label>
                    <textarea
                      value={formCustomer.notes}
                      onChange={(e) => setFormCustomer({ ...formCustomer, notes: e.target.value })}
                      className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:outline-none focus:border-brand-clinical focus:ring-2 focus:ring-sky-100 transition-all bg-slate-50/20 min-h-[60px]"
                      placeholder="Ex: Consultório fecha às sextas à tarde..."
                    />
                  </div>
                </div>
              </div>

              {/* Seção Endereço */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <h4 className="font-bold text-xs text-brand-clinical uppercase tracking-wider">Endereço de Atendimento</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Rua / Avenida</label>
                    <input
                      type="text"
                      value={formCustomer.address_street}
                      onChange={(e) => setFormCustomer({ ...formCustomer, address_street: e.target.value })}
                      className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:outline-none focus:border-brand-clinical focus:ring-2 focus:ring-sky-100 transition-all bg-slate-50/20"
                      placeholder="Ex: Av. Paulista"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Número</label>
                    <input
                      type="text"
                      value={formCustomer.address_number}
                      onChange={(e) => setFormCustomer({ ...formCustomer, address_number: e.target.value })}
                      className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:outline-none focus:border-brand-clinical focus:ring-2 focus:ring-sky-100 transition-all bg-slate-50/20"
                      placeholder="Ex: 1000"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Complemento</label>
                    <input
                      type="text"
                      value={formCustomer.address_complement}
                      onChange={(e) => setFormCustomer({ ...formCustomer, address_complement: e.target.value })}
                      className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:outline-none focus:border-brand-clinical focus:ring-2 focus:ring-sky-100 transition-all bg-slate-50/20"
                      placeholder="Ex: Sala 42"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Bairro</label>
                    <input
                      type="text"
                      value={formCustomer.address_neighborhood}
                      onChange={(e) => setFormCustomer({ ...formCustomer, address_neighborhood: e.target.value })}
                      className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:outline-none focus:border-brand-clinical focus:ring-2 focus:ring-sky-100 transition-all bg-slate-50/20"
                      placeholder="Ex: Bela Vista"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">CEP</label>
                    <input
                      type="text"
                      value={formCustomer.address_zip}
                      onChange={(e) => setFormCustomer({ ...formCustomer, address_zip: e.target.value })}
                      className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:outline-none focus:border-brand-clinical focus:ring-2 focus:ring-sky-100 transition-all bg-slate-50/20"
                      placeholder="Ex: 01311100"
                    />
                  </div>

                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Cidade</label>
                    <input
                      type="text"
                      value={formCustomer.address_city}
                      onChange={(e) => setFormCustomer({ ...formCustomer, address_city: e.target.value })}
                      className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:outline-none focus:border-brand-clinical focus:ring-2 focus:ring-sky-100 transition-all bg-slate-50/20"
                      placeholder="Ex: São Paulo"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Estado (UF)</label>
                    <input
                      type="text"
                      value={formCustomer.address_state}
                      onChange={(e) => setFormCustomer({ ...formCustomer, address_state: e.target.value })}
                      className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:outline-none focus:border-brand-clinical focus:ring-2 focus:ring-sky-100 transition-all bg-slate-50/20"
                      placeholder="Ex: SP"
                      maxLength={2}
                    />
                  </div>
                </div>
              </div>

              {/* Botões Ação */}
              <div className="flex justify-end gap-3 pt-6 border-t border-slate-100 bg-slate-50 -mx-6 -mb-6 p-6 rounded-b-2xl">
                <button
                  type="button"
                  onClick={() => setIsCustomerModalOpen(false)}
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
                  ) : 'Salvar Cliente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Equipamento */}
      {isEquipmentModalOpen && selectedCustomer && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 transition-all">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-100 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-extrabold text-sm text-brand-dark flex items-center gap-1.5">
                <Stethoscope className="w-5 h-5 text-brand-clinical animate-pulse" />
                {editingEquipment ? 'Editar Equipamento' : 'Adicionar Equipamento'}
              </h3>
              <button
                onClick={() => setIsEquipmentModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEquipment} className="p-6 space-y-4 text-left">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Nome do Equipamento *</label>
                <input
                  type="text"
                  required
                  value={formEquipment.name}
                  onChange={(e) => setFormEquipment({ ...formEquipment, name: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:outline-none focus:border-brand-clinical focus:ring-2 focus:ring-sky-100 transition-all bg-slate-50/20"
                  placeholder="Ex: Cadeira Odontológica, Autoclave, Raio-X"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Marca</label>
                  <input
                    type="text"
                    value={formEquipment.brand}
                    onChange={(e) => setFormEquipment({ ...formEquipment, brand: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:outline-none focus:border-brand-clinical focus:ring-2 focus:ring-sky-100 transition-all bg-slate-50/20"
                    placeholder="Ex: Olsen, Dabi Atlante"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Modelo</label>
                  <input
                    type="text"
                    value={formEquipment.model}
                    onChange={(e) => setFormEquipment({ ...formEquipment, model: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:outline-none focus:border-brand-clinical focus:ring-2 focus:ring-sky-100 transition-all bg-slate-50/20"
                    placeholder="Ex: Premium S500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Número de Série (N/S)</label>
                <input
                  type="text"
                  value={formEquipment.serial_number}
                  onChange={(e) => setFormEquipment({ ...formEquipment, serial_number: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:outline-none focus:border-brand-clinical focus:ring-2 focus:ring-sky-100 transition-all bg-slate-50/20 font-mono"
                  placeholder="Ex: SN-987654321"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Data de Instalação</label>
                  <input
                    type="date"
                    value={formEquipment.installation_date}
                    onChange={(e) => setFormEquipment({ ...formEquipment, installation_date: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:outline-none focus:border-brand-clinical focus:ring-2 focus:ring-sky-100 transition-all bg-slate-50/20"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Última Manutenção</label>
                  <input
                    type="date"
                    value={formEquipment.last_maintenance_date}
                    onChange={(e) => setFormEquipment({ ...formEquipment, last_maintenance_date: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:outline-none focus:border-brand-clinical focus:ring-2 focus:ring-sky-100 transition-all bg-slate-50/20"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Observações técnicas</label>
                <textarea
                  value={formEquipment.notes}
                  onChange={(e) => setFormEquipment({ ...formEquipment, notes: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:outline-none focus:border-brand-clinical focus:ring-2 focus:ring-sky-100 transition-all bg-slate-50/20 min-h-[80px]"
                  placeholder="Histórico técnico, problemas recorrentes..."
                />
              </div>

              {/* Botões Ação */}
              <div className="flex justify-end gap-3 pt-6 border-t border-slate-100 bg-slate-50 -mx-6 -mb-6 p-6">
                <button
                  type="button"
                  onClick={() => setIsEquipmentModalOpen(false)}
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
                  ) : 'Salvar Equipamento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
