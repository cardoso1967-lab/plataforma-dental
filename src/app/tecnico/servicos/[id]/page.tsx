'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Wrench, User, Calendar, MapPin, CheckCircle2, AlertCircle, ArrowLeft, RefreshCw
} from 'lucide-react';
import { createSupabaseBrowserClient } from '@/lib/supabase';
import { useAuth } from '@/components/AuthProvider';

import { PageHero } from '@/components/ui/PageHero';
import { EmptyState } from '@/components/ui/EmptyState';
import { PremiumInput } from '@/components/ui/PremiumInput';
import { PremiumButton } from '@/components/ui/PremiumButton';
import { getCustomerDisplayName } from '@/lib/customer-utils';

export default function TecnicoServicoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const { profile } = useAuth();
  
  // Unwrap params using React.use()
  const unwrappedParams = React.use(params);
  const { id } = unwrappedParams;

  const [loading, setLoading] = useState(true);
  const [selectedOS, setSelectedOS] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [newStatus, setNewStatus] = useState('');
  const [techNotes, setTechNotes] = useState('');
  const [updating, setUpdating] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [newNotePeca, setNewNotePeca] = useState('');
  const [newNoteServico, setNewNoteServico] = useState('');
  const [addingNote, setAddingNote] = useState(false);

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 3500);
  };

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
        setLoading(false);
        return;
      }

      // 2. Obtener la orden específica y validar asignación
      const { data: osData, error: osError } = await supabase
        .from('service_orders')
        .select(`
          *,
          customer:customers(
            id, trade_name, company_name, contact_name, email, phone, whatsapp,
            address_street, address_number, address_complement, 
            address_neighborhood, address_city, address_state, address_zip
          ),
          equipment:client_equipment(id, name, brand, model, serial_number),
          notes:service_order_notes(
            id,
            note,
            category,
            created_at,
            profile:profiles(name)
          )
        `)
        .eq('id', id)
        .eq('technician_id', techData.id)
        .order('created_at', { referencedTable: 'service_order_notes', ascending: false })
        .maybeSingle();

      if (osError) throw osError;
      
      if (osData) {
        setSelectedOS(osData);
        setNewStatus(osData.status);
        setTechNotes(osData.reported_issues || '');
      } else {
        setSelectedOS(null);
      }

    } catch (err: any) {
      console.error('Erro ao carregar serviço:', err);
      setError(err.message || 'Erro ao carregar dados do serviço.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [profile, id]);

  const handleAddNote = async (osId: string, category: string, noteText: string, setter: (val: string) => void) => {
    if (!noteText.trim() || !profile?.id) return;
    try {
      setAddingNote(true);
      const { error: noteError } = await supabase
        .from('service_order_notes')
        .insert({
          service_order_id: osId,
          profile_id: profile.id,
          category: category,
          note: noteText,
        });

      if (noteError) throw noteError;
      
      setSelectedOS((prev: any) => {
        if (!prev) return prev;
        const newNote = {
          id: Math.random().toString(),
          category,
          note: noteText,
          created_at: new Date().toISOString(),
          profile: { name: profile.name || 'Você' }
        };
        return { ...prev, notes: [newNote, ...(prev.notes || [])] };
      });
      
      setter('');
      showFeedback('success', 'Atualização adicionada com sucesso.');
    } catch (err: any) {
      showFeedback('error', 'Erro ao adicionar atualização.');
      console.error(err);
    } finally {
      setAddingNote(false);
    }
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

      const { error: histError } = await supabase
        .from('service_order_status_history')
        .insert({
          service_order_id: selectedOS.id,
          status: newStatus,
          changed_by: profile.id,
          notes: techNotes ? `Status atualizado em campo: ${techNotes}` : 'Status atualizado em campo pelo técnico.'
        });

      if (histError) console.error('Erro ao registrar histórico:', histError.message);

      showFeedback('success', 'Status atualizado com sucesso.');
    } catch (err: any) {
      showFeedback('error', 'Não foi possível concluir a ação. Tente novamente.');
      console.error('Erro ao atualizar chamado:', err.message);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-400 font-medium text-xs gap-3">
        <RefreshCw className="w-8 h-8 text-sky-600 animate-spin" />
        Carregando ordem de serviço...
      </div>
    );
  }

  if (!selectedOS) {
    return (
      <div className="space-y-6 animate-in fade-in duration-300 text-left">
        <button 
          onClick={() => router.back()}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors text-sm font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </button>
        <EmptyState
          title="OS não encontrada"
          description="A ordem de serviço não existe ou não está atribuída ao seu usuário."
          icon={<AlertCircle className="w-5 h-5 text-slate-400" />}
          variant="panel"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 text-left animate-in fade-in duration-300">
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

      <div className="flex items-center justify-between">
        <button 
          onClick={() => router.back()}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors text-sm font-semibold bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </button>
      </div>

      <PageHero
        title={`OS #${selectedOS.id.slice(0, 8).toUpperCase()}`}
        description="Atualização de atendimento"
        badge="Serviços"
        icon={Wrench}
        variant="compact"
      />

      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <form onSubmit={handleUpdateStatus} className="space-y-6">
          <div className="space-y-1 bg-slate-50 p-4.5 rounded-2xl border border-slate-100 text-xs font-semibold text-slate-655 text-left">
            <p className="text-slate-800 font-black">{getCustomerDisplayName(selectedOS.customer)}</p>
            <p className="text-slate-400 font-semibold text-[10.5px] leading-relaxed">
              {selectedOS.customer?.address_street}, {selectedOS.customer?.address_number} - {selectedOS.customer?.address_city}
            </p>
            {selectedOS.customer?.phone && (
              <p className="text-sky-600 font-extrabold text-[10.5px] pt-1">
                Fone: {selectedOS.customer.phone}
              </p>
            )}
          </div>

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

          <PremiumInput
            label="Observações Técnicas / Laudo de Campo"
            name="notes"
            as="textarea"
            value={techNotes}
            onChange={(e) => setTechNotes(e.target.value)}
            placeholder="Descreva o diagnóstico, justificativas de mudança de status ou laudo final..."
            rows={2}
          />

          <div className="space-y-6 pt-4 border-t border-slate-100 mt-4">
            <h3 className="font-extrabold text-slate-800 text-sm">Histórico de Atualizações</h3>
            
            <div className="space-y-3 bg-orange-50/50 p-4 rounded-xl border border-orange-100">
              <h4 className="font-bold text-orange-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Aguardando Peça
              </h4>
              
              <div className="space-y-2 max-h-60 overflow-y-auto pr-2 no-scrollbar">
                {selectedOS.notes?.filter((n: any) => n.category === 'aguardando_peca').map((n: any) => (
                  <div key={n.id} className="bg-white p-3 rounded-lg border border-orange-100 shadow-sm text-[11px]">
                    <p className="text-slate-700 font-medium whitespace-pre-wrap">{n.note}</p>
                    <div className="flex justify-between items-center mt-2 text-[10px] text-slate-400 font-semibold">
                      <span>{n.profile?.name || 'Sistema'}</span>
                      <span>{new Date(n.created_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</span>
                    </div>
                  </div>
                ))}
                {(!selectedOS.notes || selectedOS.notes.filter((n: any) => n.category === 'aguardando_peca').length === 0) && (
                  <p className="text-[11px] text-orange-600/60 font-medium italic text-center py-2">Nenhum registro nesta categoria.</p>
                )}
              </div>

              <div className="flex gap-2 items-start pt-2">
                <textarea
                  value={newNotePeca}
                  onChange={(e) => setNewNotePeca(e.target.value)}
                  placeholder="Adicionar nota sobre peças..."
                  className="flex-1 text-[11px] p-2 rounded-lg border border-orange-200 focus:outline-none focus:border-orange-400 bg-white min-h-[60px]"
                />
                <PremiumButton
                  type="button"
                  onClick={() => handleAddNote(selectedOS.id, 'aguardando_peca', newNotePeca, setNewNotePeca)}
                  disabled={!newNotePeca.trim() || addingNote}
                  variant="primary"
                  className="shrink-0 text-[10px] py-2 px-3 h-auto"
                >
                  Adicionar
                </PremiumButton>
              </div>
            </div>

            <div className="space-y-3 bg-sky-50/50 p-4 rounded-xl border border-sky-100">
              <h4 className="font-bold text-sky-800 text-xs flex items-center gap-2">
                <Wrench className="w-4 h-4" />
                Serviços Realizados
              </h4>
              
              <div className="space-y-2 max-h-60 overflow-y-auto pr-2 no-scrollbar">
                {selectedOS.notes?.filter((n: any) => n.category === 'servicos_realizados').map((n: any) => (
                  <div key={n.id} className="bg-white p-3 rounded-lg border border-sky-100 shadow-sm text-[11px]">
                    <p className="text-slate-700 font-medium whitespace-pre-wrap">{n.note}</p>
                    <div className="flex justify-between items-center mt-2 text-[10px] text-slate-400 font-semibold">
                      <span>{n.profile?.name || 'Sistema'}</span>
                      <span>{new Date(n.created_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</span>
                    </div>
                  </div>
                ))}
                {(!selectedOS.notes || selectedOS.notes.filter((n: any) => n.category === 'servicos_realizados').length === 0) && (
                  <p className="text-[11px] text-sky-600/60 font-medium italic text-center py-2">Nenhum registro nesta categoria.</p>
                )}
              </div>

              <div className="flex gap-2 items-start pt-2">
                <textarea
                  value={newNoteServico}
                  onChange={(e) => setNewNoteServico(e.target.value)}
                  placeholder="Adicionar nota sobre serviços realizados..."
                  className="flex-1 text-[11px] p-2 rounded-lg border border-sky-200 focus:outline-none focus:border-sky-400 bg-white min-h-[60px]"
                />
                <PremiumButton
                  type="button"
                  onClick={() => handleAddNote(selectedOS.id, 'servicos_realizados', newNoteServico, setNewNoteServico)}
                  disabled={!newNoteServico.trim() || addingNote}
                  variant="primary"
                  className="shrink-0 text-[10px] py-2 px-3 h-auto bg-sky-600 hover:bg-sky-700"
                >
                  Adicionar
                </PremiumButton>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-6 border-t border-slate-100">
            <PremiumButton
              onClick={() => router.back()}
              type="button"
              variant="outline"
              className="flex-1"
            >
              Cancelar
            </PremiumButton>
            <PremiumButton
              type="submit"
              loading={updating}
              variant="primary"
              className="flex-1"
            >
              Salvar Alterações
            </PremiumButton>
          </div>
        </form>
      </div>
    </div>
  );
}
