'use client';

import React, { useEffect, useState } from 'react';
import { 
  UserCog, Plus, Mail, Phone, Search, Edit2, 
  Trash2, X, ShieldCheck, CheckSquare, Square
} from 'lucide-react';
import { createSupabaseBrowserClient } from '@/lib/supabase';
import { useAuth } from '@/components/AuthProvider';

interface Profile {
  id: string;
  name: string;
  phone: string | null;
}

interface Technician {
  id: string;
  profile_id: string | null;
  specialties: string[];
  is_active: boolean;
  created_at: string;
  profile?: Profile | null;
}

const PREDEFINED_SPECIALTIES = [
  'Cadeiras Consultório',
  'Autoclaves e Biossegurança',
  'Imagem e Diagnóstico',
  'Periféricos e Peças de Mão',
  'Compressores e Bombas de Vácuo',
  'Peças de Reposição'
];

export default function AdminTecnicosPage() {
  const supabase = createSupabaseBrowserClient();
  const { profile: adminProfile } = useAuth();

  // Estados de datos
  const [techs, setTechs] = useState<Technician[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estados de búsqueda
  const [searchTerm, setSearchTerm] = useState('');

  // Estados de modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTech, setEditingTech] = useState<Technician | null>(null);

  // Formulario
  const [formTech, setFormTech] = useState<{
    profile_id: string;
    specialties: string[];
    is_active: boolean;
  }>({
    profile_id: '',
    specialties: [],
    is_active: true,
  });

  // Cargar datos
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. Obtener técnicos
      const { data: techsData, error: techsError } = await supabase
        .from('technicians')
        .select(`
          *,
          profile:profiles(id, name, phone)
        `)
        .order('created_at', { ascending: false });

      if (techsError) throw techsError;
      setTechs(techsData || []);

      // 2. Obtener perfiles con rol 'tecnico'
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, name, phone')
        .eq('role', 'tecnico');

      if (profilesError) throw profilesError;
      setProfiles(profilesData || []);

    } catch (err: any) {
      console.error('Erro ao carregar técnicos:', err);
      setError(err.message || 'Erro ao carregar dados do servidor.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtrar perfiles técnicos disponibles (no asociados a otro técnico)
  const getFreeProfiles = () => {
    const associatedProfileIds = techs
      .map(t => t.profile_id)
      .filter((id): id is string => !!id && id !== editingTech?.profile_id);

    return profiles.filter(p => !associatedProfileIds.includes(p.id));
  };

  // Abrir modal
  const openModal = (tech: Technician | null = null) => {
    setEditingTech(tech);
    if (tech) {
      setFormTech({
        profile_id: tech.profile_id || '',
        specialties: tech.specialties || [],
        is_active: tech.is_active,
      });
    } else {
      setFormTech({
        profile_id: '',
        specialties: [],
        is_active: true,
      });
    }
    setIsModalOpen(true);
  };

  // Alternar especialidad en el formulario
  const toggleSpecialty = (spec: string) => {
    const specs = [...formTech.specialties];
    const index = specs.indexOf(spec);
    if (index >= 0) {
      specs.splice(index, 1);
    } else {
      specs.push(spec);
    }
    setFormTech({ ...formTech, specialties: specs });
  };

  // Guardar técnico
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);
      const payload = {
        profile_id: formTech.profile_id || null,
        specialties: formTech.specialties,
        is_active: formTech.is_active,
      };

      if (editingTech) {
        // Actualizar
        const { error: saveError } = await supabase
          .from('technicians')
          .update(payload)
          .eq('id', editingTech.id);
        if (saveError) throw saveError;
      } else {
        // Crear
        const { error: saveError } = await supabase
          .from('technicians')
          .insert(payload);
        if (saveError) throw saveError;
      }

      setIsModalOpen(false);
      setEditingTech(null);
      await loadData();
    } catch (err: any) {
      alert('Erro ao salvar técnico: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Eliminar técnico
  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente remover este técnico? Esta ação não pode ser desfeita.')) return;

    try {
      setLoading(true);
      const { error: delError } = await supabase
        .from('technicians')
        .delete()
        .eq('id', id);

      if (delError) throw delError;
      await loadData();
    } catch (err: any) {
      alert('Erro ao excluir técnico: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Filtrar técnicos
  const filteredTechs = techs.filter(t => {
    const text = searchTerm.toLowerCase();
    const name = (t.profile?.name || '').toLowerCase();
    const phone = (t.profile?.phone || '').toLowerCase();
    const specMatch = t.specialties.some(s => s.toLowerCase().includes(text));

    return name.includes(text) || phone.includes(text) || specMatch;
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-extrabold text-brand-dark tracking-tight flex items-center gap-2">
            <UserCog className="w-7 h-7 text-brand-clinical" />
            Gestão de Técnicos
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Cadastre e gerencie a rede de técnicos credenciados, suas especialidades e perfis de acesso.
          </p>
        </div>
        <button
          onClick={() => openModal()}
          className="bg-brand-clinical hover:bg-sky-700 text-white text-xs font-bold px-4 py-2.5 rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-sm"
        >
          <Plus className="w-4 h-4" /> Novo Técnico
        </button>
      </div>

      {/* Listado de Técnicos */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between pb-2 border-b border-slate-50">
          <h3 className="font-bold text-sm text-brand-dark flex items-center gap-1.5">
            Técnicos Credenciados ({filteredTechs.length})
          </h3>
          
          {/* Buscador */}
          <div className="relative w-full sm:max-w-xs">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por nome, contato ou especialidade..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-brand-clinical bg-slate-50/50"
            />
          </div>
        </div>

        {loading && techs.length === 0 ? (
          <div className="text-center py-12 text-slate-400 font-medium text-xs">
            Carregando técnicos...
          </div>
        ) : filteredTechs.length === 0 ? (
          <div className="text-center py-12 text-slate-400 font-medium text-xs border-2 border-dashed border-slate-100 rounded-xl">
            Nenhum técnico cadastrado ou encontrado.
          </div>
        ) : (
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="text-slate-400 font-bold border-b border-slate-100">
                  <th className="pb-3">Técnico / Responsável</th>
                  <th className="pb-3 px-2">Telefone de Contato</th>
                  <th className="pb-3 px-2">Especialidades de Campo</th>
                  <th className="pb-3 text-center">Status</th>
                  <th className="pb-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredTechs.map((tech) => (
                  <tr key={tech.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 font-bold text-brand-dark">
                      {tech.profile ? (
                        <div className="flex items-center gap-2">
                          <span className="bg-sky-50 text-brand-clinical p-1.5 rounded-lg">
                            <ShieldCheck className="w-4 h-4" />
                          </span>
                          <div>
                            <p className="text-xs text-brand-dark font-bold">{tech.profile.name}</p>
                            <span className="text-[9px] text-slate-400 font-normal">ID: {tech.id.substring(0, 8)}...</span>
                          </div>
                        </div>
                      ) : (
                        <div className="text-slate-400 font-medium italic">
                          Técnico Sem Perfil Associado
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-2 font-semibold text-slate-600">
                      {tech.profile?.phone || '—'}
                    </td>
                    <td className="py-4 px-2">
                      <div className="flex flex-wrap gap-1 max-w-md">
                        {tech.specialties && tech.specialties.length > 0 ? (
                          tech.specialties.map((spec) => (
                            <span 
                              key={spec} 
                              className="text-[9px] font-bold px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md"
                            >
                              {spec}
                            </span>
                          ))
                        ) : (
                          <span className="text-[10px] text-slate-400 italic font-medium">Nenhuma especialidade definida</span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 text-center">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        tech.is_active 
                          ? 'bg-success-bg text-success-text' 
                          : 'bg-slate-100 text-slate-500'
                      }`}>
                        {tech.is_active ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openModal(tech)}
                          className="p-1.5 text-slate-400 hover:text-brand-clinical rounded-md hover:bg-slate-100 transition-colors"
                          title="Editar Técnico"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(tech.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md hover:bg-slate-100 transition-colors"
                          title="Remover Técnico"
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

      {/* Modal Técnico */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-extrabold text-sm text-brand-dark flex items-center gap-1.5">
                <UserCog className="w-5 h-5 text-brand-clinical" />
                {editingTech ? 'Editar Técnico' : 'Novo Técnico'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:bg-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-5">
              {/* Vinculação perfil */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Perfil de Usuário *</label>
                <select
                  required
                  value={formTech.profile_id}
                  onChange={(e) => setFormTech({ ...formTech, profile_id: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-brand-clinical bg-white"
                >
                  <option value="">Selecione um perfil de técnico...</option>
                  {getFreeProfiles().map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} {p.phone ? `(${p.phone})` : ''}
                    </option>
                  ))}
                </select>
                <p className="text-[9px] text-slate-400 font-medium font-sans">
                  Selecione uma conta com papel &quot;tecnico&quot; criada no sistema que ainda não esteja vinculada a outro profissional.
                </p>
              </div>

              {/* Especialidades */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase block">Especialidades Técnicas</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {PREDEFINED_SPECIALTIES.map((spec) => {
                    const isSelected = formTech.specialties.includes(spec);
                    return (
                      <button
                        type="button"
                        key={spec}
                        onClick={() => toggleSpecialty(spec)}
                        className={`flex items-center gap-2 p-2 rounded-lg text-left text-xs transition-colors border ${
                          isSelected 
                            ? 'bg-sky-50/50 border-brand-clinical text-brand-clinical font-semibold' 
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-brand-clinical flex-shrink-0" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-300 flex-shrink-0" />
                        )}
                        <span>{spec}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Status Activo */}
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formTech.is_active}
                  onChange={(e) => setFormTech({ ...formTech, is_active: e.target.checked })}
                  className="w-4 h-4 border border-slate-200 rounded text-brand-clinical focus:ring-brand-clinical"
                />
                <label htmlFor="is_active" className="text-xs font-bold text-slate-700 cursor-pointer">
                  Técnico Ativo (Disponível para receber chamados)
                </label>
              </div>

              {/* Botões Ação */}
              <div className="flex justify-end gap-3 pt-6 border-t border-slate-100 bg-slate-50 -mx-6 -mb-6 p-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="bg-transparent hover:bg-slate-100 text-slate-600 font-bold text-xs px-4 py-2.5 rounded-lg border border-slate-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-brand-clinical hover:bg-sky-700 text-white font-bold text-xs px-4 py-2.5 rounded-lg transition-colors shadow-sm disabled:opacity-50"
                >
                  {loading ? 'Salvando...' : 'Salvar Técnico'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
