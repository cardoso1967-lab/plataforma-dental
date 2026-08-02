'use client';

import React, { useEffect, useState } from 'react';
import { 
  Users, Plus, Mail, Phone, Search, Edit2, 
  RefreshCw, Calendar, Shield, CheckCircle, XCircle, UserPlus, Power, AlertTriangle, Check
} from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { getUsersList, getTechniciansList, saveUser } from './actions';

interface UserItem {
  id: string;
  name: string;
  role: string;
  is_active: boolean;
  phone: string | null;
  created_at: string;
  email: string;
  last_sign_in_at: string | null;
}

interface TechItem {
  id: string;
  profile_id: string | null;
  is_active: boolean;
  name: string;
}

export default function AdminUsuariosPage() {
  const { profile: loggedProfile } = useAuth();

  // Estados de dados
  const [users, setUsers] = useState<UserItem[]>([]);
  const [techs, setTechs] = useState<TechItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [serviceKeyError, setServiceKeyError] = useState(false);

  // Estados de busca e filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modais e notificações customizadas
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);
  
  // Custom dialogs (no native alert/confirm)
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Confirmação de desativação
  const [userToToggleStatus, setUserToToggleStatus] = useState<UserItem | null>(null);
  const [selfDeactivateConfirmation, setSelfDeactivateConfirmation] = useState(false);

  // Formulário
  const [formUser, setFormUser] = useState({
    name: '',
    email: '',
    role: 'standard_user' as 'admin' | 'manager' | 'technician' | 'standard_user' | 'cliente',
    is_active: true,
    phone: '',
    linkedTechnicianId: '',
    password: '',
  });

  // Carregar dados
  const loadData = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      
      const [usersRes, techsRes] = await Promise.all([
        getUsersList(),
        getTechniciansList()
      ]);

      if (usersRes.error) {
        if (usersRes.serviceKeyMissing) {
          setServiceKeyError(true);
        }
        throw new Error(usersRes.error);
      }

      if (techsRes.error) {
        throw new Error(techsRes.error);
      }

      setUsers(usersRes.data || []);
      setTechs(techsRes.data || []);
      setServiceKeyError(false);
    } catch (err: any) {
      console.error('Erro ao carregar dados:', err);
      setErrorMessage(err.message || 'Erro ao carregar dados do servidor.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Abrir modal de criação ou edição
  const openModal = (user: UserItem | null = null) => {
    setEditingUser(user);
    setErrorMessage(null);
    if (user) {
      // Encontrar técnico vinculado a este usuário
      const linkedTech = techs.find(t => t.profile_id === user.id);
      
      setFormUser({
        name: user.name,
        email: user.email,
        role: (user.role === 'tecnico' ? 'technician' : user.role) as any,
        is_active: user.is_active,
        phone: user.phone || '',
        linkedTechnicianId: linkedTech ? linkedTech.id : '',
        password: '', // Não exibe senha antiga por segurança
      });
    } else {
      setFormUser({
        name: '',
        email: '',
        role: 'standard_user',
        is_active: true,
        phone: '',
        linkedTechnicianId: '',
        password: '',
      });
    }
    setIsModalOpen(true);
  };

  // Salvar usuário
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validações básicas
    if (!formUser.name || !formUser.email) {
      setErrorMessage('Nome Completo e E-mail são obrigatórios.');
      return;
    }

    // Regra obrigatória: technician precisa de técnico vinculado
    if (formUser.role === 'technician' && !formUser.linkedTechnicianId) {
      setErrorMessage('O vínculo com um registro de técnico é obrigatório para usuários com perfil Técnico.');
      return;
    }

    try {
      setSaving(true);
      const res = await saveUser({
        id: editingUser?.id,
        name: formUser.name,
        email: formUser.email,
        role: formUser.role,
        is_active: formUser.is_active,
        phone: formUser.phone,
        linkedTechnicianId: formUser.role === 'technician' ? formUser.linkedTechnicianId : undefined,
        password: formUser.password || undefined,
      });

      if (res.error) {
        setErrorMessage(res.error);
        return;
      }

      setSuccessMessage(
        editingUser 
          ? 'Usuário atualizado com sucesso!' 
          : `Usuário criado com sucesso! Senha temporária: ${res.tempPasswordCreated || 'Dental123!'}`
      );
      
      setIsModalOpen(false);
      setEditingUser(null);
      await loadData();
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao salvar alterações.');
    } finally {
      setSaving(false);
    }
  };

  // Confirmar alteração de status (desativação/ativação)
  const initiateStatusToggle = (user: UserItem) => {
    setErrorMessage(null);
    setUserToToggleStatus(user);
    
    // Alerta de auto-desativação
    if (loggedProfile?.id === user.id && user.is_active) {
      setSelfDeactivateConfirmation(true);
    } else {
      setSelfDeactivateConfirmation(false);
    }
  };

  const handleConfirmStatusToggle = async () => {
    if (!userToToggleStatus) return;

    try {
      setLoading(true);
      const newStatus = !userToToggleStatus.is_active;
      
      // Chamar saveUser apenas mudando is_active
      const res = await saveUser({
        id: userToToggleStatus.id,
        name: userToToggleStatus.name,
        email: userToToggleStatus.email,
        role: (userToToggleStatus.role === 'tecnico' ? 'technician' : userToToggleStatus.role) as any,
        is_active: newStatus,
        phone: userToToggleStatus.phone || undefined,
      });

      if (res.error) {
        setErrorMessage(res.error);
        return;
      }

      setSuccessMessage(`Acesso do usuário ${newStatus ? 'ativado' : 'desativado'} com sucesso!`);
      setUserToToggleStatus(null);
      await loadData();
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao alterar status.');
    } finally {
      setLoading(false);
    }
  };

  // Filtragem de usuários na listagem
  const filteredUsers = users.filter(u => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
      u.name.toLowerCase().includes(searchLower) || 
      u.email.toLowerCase().includes(searchLower);

    const matchesRole = roleFilter ? u.role === roleFilter : true;
    
    let matchesStatus = true;
    if (statusFilter === 'active') matchesStatus = u.is_active === true;
    else if (statusFilter === 'inactive') matchesStatus = u.is_active === false;

    return matchesSearch && matchesRole && matchesStatus;
  });

  // Mapear role para exibição amigável
  const translateRole = (role: string) => {
    switch (role) {
      case 'admin': return 'Administrador';
      case 'manager': return 'Gerente';
      case 'technician':
      case 'tecnico': return 'Técnico';
      case 'standard_user': return 'Usuário Comum';
      case 'cliente': return 'Cliente';
      case 'vendedor': return 'Vendedor';
      case 'suporte': return 'Suporte';
      default: return role;
    }
  };

  const getRoleBadgeStyle = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'manager': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'technician':
      case 'tecnico': return 'bg-cyan-50 text-cyan-700 border-cyan-200';
      case 'cliente': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-extrabold text-brand-dark tracking-tight flex items-center gap-2">
            <Users className="w-7 h-7 text-brand-clinical" />
            Controle de Usuários
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Gerencie perfis internos (Admin, Gerente, Técnico, Usuário Comum), deative contas e crie novos convites.
          </p>
        </div>
        <button
          onClick={() => openModal()}
          className="bg-brand-clinical hover:bg-sky-700 text-white text-xs font-bold px-4 py-2.5 rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-sm"
        >
          <UserPlus className="w-4 h-4" /> Convidar Usuário
        </button>
      </div>

      {/* Alerta de chave de serviço ausente */}
      {serviceKeyError && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-xl text-xs flex items-start gap-3 shadow-xs">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-bold">Chave Administrativa Não Configurada</h4>
            <p className="font-medium text-amber-700/95 leading-relaxed">
              A variável <code className="bg-amber-100/80 px-1 py-0.5 rounded font-mono font-bold">SUPABASE_SERVICE_ROLE_KEY</code> está vazia. 
              As ações de criação e convite de usuários estão desabilitadas localmente até que a chave seja configurada no arquivo <code className="bg-amber-100/80 px-1 py-0.5 rounded font-mono font-bold">.env.local</code>.
            </p>
          </div>
        </div>
      )}

      {/* Caixa de Sucesso Customizada */}
      {successMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl text-xs flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2 font-semibold">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="text-emerald-500 hover:text-emerald-700 text-xs font-bold">
            Fechar
          </button>
        </div>
      )}

      {/* Caixa de Erro Customizada */}
      {errorMessage && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-xl text-xs flex items-start gap-3 shadow-xs">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1 space-y-1">
            <h4 className="font-bold">Aviso</h4>
            <p className="font-medium text-rose-700">{errorMessage}</p>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-rose-500 hover:text-rose-700 text-xs font-bold">
            Fechar
          </button>
        </div>
      )}

      {/* Barra de Filtros e Busca */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-6 space-y-4">
        <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por nome ou e-mail..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-brand-clinical bg-slate-50/50"
            />
          </div>

          <div className="flex flex-wrap sm:flex-nowrap gap-2">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-brand-clinical bg-slate-50/50"
            >
              <option value="">Todos os Perfis</option>
              <option value="admin">Administrador</option>
              <option value="manager">Gerente</option>
              <option value="tecnico">Técnico</option>
              <option value="standard_user">Usuário Comum</option>
              <option value="cliente">Cliente</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-brand-clinical bg-slate-50/50"
            >
              <option value="">Todos os Status</option>
              <option value="active">Ativos</option>
              <option value="inactive">Inativos</option>
            </select>

            <button
              onClick={loadData}
              className="p-2.5 border border-slate-200 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-500 transition-colors flex items-center justify-center"
              title="Recarregar usuários"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Tabela de Usuários */}
        <div className="overflow-x-auto">
          {loading && users.length === 0 ? (
            <div className="py-12 text-center text-slate-400 font-medium text-xs flex flex-col items-center gap-2">
              <RefreshCw className="w-8 h-8 text-brand-clinical animate-spin" />
              <span>Buscando contas cadastradas...</span>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="py-16 text-center text-slate-400 font-medium text-xs">
              Nenhum usuário encontrado correspondente aos filtros.
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="text-slate-400 font-bold border-b border-slate-100">
                  <th className="pb-3 pl-2">Nome Completo</th>
                  <th className="pb-3">E-mail</th>
                  <th className="pb-3">Perfil</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Criação</th>
                  <th className="pb-3">Último Acesso</th>
                  <th className="pb-3 text-right pr-2">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="py-4 pl-2 font-bold text-brand-dark flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold font-mono">
                        {u.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="flex flex-col">
                        <span>{u.name}</span>
                        {u.phone && <span className="text-[10px] text-slate-400 font-normal">{u.phone}</span>}
                      </div>
                    </td>
                    <td className="py-4 font-semibold text-slate-650">{u.email}</td>
                    <td className="py-4">
                      <span className={`px-2.5 py-1 text-[10px] font-bold rounded-md border uppercase font-mono ${getRoleBadgeStyle(u.role)}`}>
                        {translateRole(u.role)}
                      </span>
                    </td>
                    <td className="py-4">
                      <span className={`flex items-center gap-1.5 font-bold ${u.is_active ? 'text-emerald-600' : 'text-slate-400'}`}>
                        {u.is_active ? (
                          <>
                            <CheckCircle className="w-3.5 h-3.5" />
                            Ativo
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3.5 h-3.5" />
                            Inativo
                          </>
                        )}
                      </span>
                    </td>
                    <td className="py-4 font-semibold text-slate-400">
                      {new Date(u.created_at).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="py-4 font-semibold text-slate-500">
                      {u.last_sign_in_at 
                        ? new Date(u.last_sign_in_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
                        : 'Sem acessos'}
                    </td>
                    <td className="py-4 text-right pr-2">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openModal(u)}
                          className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-brand-clinical rounded-lg transition-colors"
                          title="Editar perfil"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        
                        <button
                          onClick={() => initiateStatusToggle(u)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            u.is_active 
                              ? 'hover:bg-rose-50 text-rose-500 hover:text-rose-700' 
                              : 'hover:bg-emerald-50 text-slate-400 hover:text-emerald-600'
                          }`}
                          title={u.is_active ? 'Desativar acesso' : 'Reativar acesso'}
                        >
                          <Power className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* MODAL DE CRIAÇÃO / EDIÇÃO */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xl max-w-md w-full overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-extrabold text-sm text-brand-dark flex items-center gap-2">
                <Shield className="w-5 h-5 text-brand-clinical" />
                {editingUser ? 'Editar Usuário' : 'Convidar Novo Usuário'}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="text-slate-400 hover:text-slate-650 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 overflow-y-auto flex-1">
              {errorMessage && (
                <div className="bg-rose-50 border border-rose-100 text-rose-600 p-3 rounded-lg text-[10px] font-semibold leading-relaxed">
                  {errorMessage}
                </div>
              )}

              <div className="space-y-1">
                <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                  Nome Completo
                </label>
                <input
                  type="text"
                  required
                  placeholder="ex: Dr. João Silva"
                  value={formUser.name}
                  onChange={(e) => setFormUser({ ...formUser, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-brand-clinical"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                  E-mail de Login
                </label>
                <input
                  type="email"
                  required
                  placeholder="ex: joao@dental.com"
                  value={formUser.email}
                  onChange={(e) => setFormUser({ ...formUser, email: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-brand-clinical"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                    Telefone
                  </label>
                  <input
                    type="text"
                    placeholder="(11) 99999-9999"
                    value={formUser.phone}
                    onChange={(e) => setFormUser({ ...formUser, phone: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-brand-clinical"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                    Perfil de Acesso
                  </label>
                  <select
                    value={formUser.role}
                    onChange={(e) => setFormUser({ ...formUser, role: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-brand-clinical bg-white"
                  >
                    <option value="standard_user">Usuário Comum</option>
                    <option value="manager">Gerente</option>
                    <option value="technician">Técnico</option>
                    <option value="admin">Administrador</option>
                    <option value="cliente">Cliente (Portal)</option>
                  </select>
                </div>
              </div>

              {/* Vínculo obrigatório com Técnico apenas se perfil for técnico */}
              {formUser.role === 'technician' && (
                <div className="space-y-1 p-3.5 bg-cyan-50/50 rounded-xl border border-cyan-150 animate-in slide-in-from-top duration-250">
                  <label className="block text-[10px] font-extrabold text-cyan-800 uppercase tracking-wider mb-1">
                    Vincular Registro Técnico <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    value={formUser.linkedTechnicianId}
                    onChange={(e) => setFormUser({ ...formUser, linkedTechnicianId: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-cyan-200 rounded-xl focus:outline-none focus:border-brand-clinical bg-white text-slate-700"
                  >
                    <option value="">Selecione um técnico...</option>
                    {techs.map(t => {
                      // Verificar se já está vinculado a outro perfil
                      const isLinkedToOther = t.profile_id && t.profile_id !== editingUser?.id;
                      return (
                        <option key={t.id} value={t.id} disabled={!!isLinkedToOther}>
                          {t.name} {isLinkedToOther ? '(Já Vinculado)' : '(Disponível)'}
                        </option>
                      );
                    })}
                  </select>
                  <p className="text-[9px] text-cyan-700 mt-1 font-semibold leading-none">
                    O usuário técnico precisa estar vinculado a um registro técnico para receber ordens de serviço.
                  </p>
                </div>
              )}

              {/* Senha (apenas na criação) */}
              {!editingUser && (
                <div className="space-y-1">
                  <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                    Senha Provisória (Opcional)
                  </label>
                  <input
                    type="password"
                    placeholder="Mínimo 6 caracteres (Padrão: Dental123!)"
                    value={formUser.password}
                    onChange={(e) => setFormUser({ ...formUser, password: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-brand-clinical"
                  />
                </div>
              )}

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="user_active"
                  checked={formUser.is_active}
                  onChange={(e) => setFormUser({ ...formUser, is_active: e.target.checked })}
                  className="rounded text-brand-clinical focus:ring-brand-clinical"
                />
                <label htmlFor="user_active" className="text-xs font-bold text-slate-650 cursor-pointer select-none">
                  Acesso Ativo no Sistema
                </label>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-500 text-xs font-bold hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-xl bg-brand-clinical hover:bg-sky-700 text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                >
                  {saving ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    'Salvar Usuário'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRMAÇÃO DE ALTERAÇÃO DE STATUS */}
      {userToToggleStatus && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xl max-w-sm w-full overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center gap-2.5 bg-slate-50/50">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <h3 className="font-extrabold text-sm text-brand-dark">
                Confirmar Alteração
              </h3>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-xs text-slate-650 leading-relaxed font-semibold">
                Você tem certeza que deseja {userToToggleStatus.is_active ? 'DESATIVAR' : 'REATIVAR'} o acesso de{' '}
                <strong className="text-brand-dark">{userToToggleStatus.name}</strong>?
              </p>

              {selfDeactivateConfirmation && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3.5 rounded-xl text-[10px] font-semibold leading-relaxed">
                  <strong>IMPORTANTE:</strong> Você está prestes a desativar seu próprio perfil ativo. 
                  Isso irá encerrar sua sessão e você não poderá entrar novamente a menos que outro administrador reative seu acesso.
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setUserToToggleStatus(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-500 text-xs font-bold hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmStatusToggle}
                  className={`px-4 py-2 rounded-xl text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-sm ${
                    userToToggleStatus.is_active 
                      ? 'bg-rose-600 hover:bg-rose-700' 
                      : 'bg-emerald-600 hover:bg-emerald-700'
                  }`}
                >
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
