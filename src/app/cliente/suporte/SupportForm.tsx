'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase';
import { LifeBuoy, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

interface Equipment {
  id: string;
  name: string;
  brand: string | null;
  serial_number: string | null;
}

interface SupportFormProps {
  equipments: Equipment[];
  customerId: string;
}

export function SupportForm({ equipments, customerId }: SupportFormProps) {
  const [equipmentId, setEquipmentId] = useState(equipments[0]?.id || '');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'baixa' | 'media' | 'alta' | 'urgente'>('media');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      setError('Por favor, descreva o problema.');
      return;
    }
    if (!equipmentId) {
      setError('Por favor, selecione um equipamento.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Cria a Ordem de Serviço na tabela service_orders
      const { data: newOS, error: osError } = await supabase
        .from('service_orders')
        .insert({
          customer_id: customerId,
          equipment_id: equipmentId,
          status: 'aberta',
          priority: priority,
          description: description.trim(),
          reported_issues: description.trim(),
        })
        .select()
        .single();

      if (osError) {
        setError(osError.message);
        setLoading(false);
        return;
      }

      // Registra a alteração inicial no histórico de status (tabela service_order_status_history)
      await supabase
        .from('service_order_status_history')
        .insert({
          service_order_id: newOS.id,
          status: 'aberta',
          notes: 'Abertura de chamado pelo Portal do Cliente',
        });

      setSuccess(true);
      setDescription('');
      setPriority('media');
      setLoading(false);

      // Atualiza os dados da página
      router.refresh();
    } catch (err: any) {
      setError('Erro de conexão ao enviar chamado.');
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-100 p-5 space-y-4 shadow-xs">
      <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-50 pb-3">
        <LifeBuoy className="w-4 h-4 text-sky-500" />
        Novo Chamado de Assistência
      </h3>

      {success && (
        <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 p-4 rounded-xl text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4.5 h-4.5 shrink-0" />
          <span>Chamado aberto com sucesso! Nossa equipe técnica entrará em contato em breve.</span>
        </div>
      )}

      {error && (
        <div className="bg-rose-50 border border-rose-100 text-rose-700 p-4 rounded-xl text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4.5 h-4.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {equipments.length === 0 ? (
        <p className="text-xs text-slate-400 font-medium text-center py-4 leading-relaxed">
          Você precisa de pelo menos um equipamento cadastrado para abrir um chamado de suporte.
        </p>
      ) : (
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
              Selecione o Equipamento
            </label>
            <select
              value={equipmentId}
              onChange={(e) => setEquipmentId(e.target.value)}
              disabled={loading}
              className="w-full text-xs border border-slate-200 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 bg-slate-50/50 text-slate-800"
            >
              {equipments.map((eq) => (
                <option key={eq.id} value={eq.id}>
                  {eq.name} {eq.serial_number ? `(S/N: ${eq.serial_number})` : ''} {eq.brand ? `- ${eq.brand}` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
              Prioridade
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(['baixa', 'media', 'alta', 'urgente'] as const).map((p) => {
                const colors = {
                  baixa: 'border-slate-200 text-slate-600 hover:bg-slate-50 peer-checked:bg-slate-100 peer-checked:border-slate-300',
                  media: 'border-slate-200 text-slate-600 hover:bg-blue-50/30 peer-checked:bg-blue-50 peer-checked:text-blue-700 peer-checked:border-blue-200',
                  alta: 'border-slate-200 text-slate-600 hover:bg-orange-50/30 peer-checked:bg-orange-50 peer-checked:text-orange-700 peer-checked:border-orange-200',
                  urgente: 'border-slate-200 text-slate-600 hover:bg-rose-50/30 peer-checked:bg-rose-50 peer-checked:text-rose-700 peer-checked:border-rose-200 peer-checked:font-bold',
                };
                return (
                  <label key={p} className="cursor-pointer">
                    <input
                      type="radio"
                      name="priority"
                      value={p}
                      checked={priority === p}
                      onChange={() => setPriority(p)}
                      disabled={loading}
                      className="sr-only peer"
                    />
                    <div className={`text-center py-2.5 rounded-lg border text-[10px] uppercase font-bold tracking-wider transition-all peer-checked:shadow-xs active:scale-95 ${colors[p]}`}>
                      {p === 'media' ? 'média' : p}
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
              Descreva o Problema / Sintoma
            </label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={loading}
              placeholder="Ex: A autoclave não está atingindo a pressão correta de esterilização..."
              className="w-full text-xs border border-slate-200 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 bg-slate-50/50 text-slate-800"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-sky-500 hover:bg-sky-600 text-white py-3.5 px-4 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-md shadow-sky-500/10 active:scale-99 flex items-center justify-center gap-2 disabled:opacity-75"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Enviando Chamado...
              </>
            ) : (
              'Enviar Chamado'
            )}
          </button>
        </form>
      )}
    </div>
  );
}
