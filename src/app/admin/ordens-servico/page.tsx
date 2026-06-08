import React from 'react';
import { Wrench, Plus, User, Calendar } from 'lucide-react';

export default function AdminOrdensServicoPage() {
  const serviceOrders = [
    { id: 'OS-0892', client: 'Dra. Sandra Melo', equipment: 'Autoclave Digital 12L', tech: 'Carlos Técnico', priority: 'urgente', status: 'aberta' },
    { id: 'OS-0891', client: 'Clínica Sorriso Lindo', equipment: 'Compressor Isento Óleo', tech: 'Marcos Silva', priority: 'media', status: 'em_analise' },
    { id: 'OS-0890', client: 'Dr. Roberto Santos', equipment: 'Cadeira Premium S500', tech: 'Carlos Técnico', priority: 'alta', status: 'em_atendimento' },
    { id: 'OS-0889', client: 'OdontoClinic Paulista', equipment: 'Bomba de Vácuo 1/2 HP', tech: 'Não atribuído', priority: 'baixa', status: 'aberta' },
  ];

  const statusMap = {
    aberta: { label: 'Aberta', class: 'bg-blue-50 text-blue-700' },
    em_analise: { label: 'Em Análise', class: 'bg-purple-50 text-purple-700' },
    em_atendimento: { label: 'Em Atendimento', class: 'bg-sky-50 text-sky-700' },
  };

  const priorityMap = {
    baixa: { label: 'Baixa', class: 'bg-slate-100 text-slate-600' },
    media: { label: 'Média', class: 'bg-blue-50 text-blue-600' },
    alta: { label: 'Alta', class: 'bg-orange-50 text-orange-600' },
    urgente: { label: 'Urgente', class: 'bg-rose-50 text-rose-700 font-bold border border-rose-200' },
  };

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-extrabold text-brand-dark tracking-tight">
          Ordens de Serviço (OS)
        </h1>
        <p className="text-xs text-slate-500 font-medium">
          Acompanhe os chamados de assistência técnica, diagnósticos e consertos preventivos/corretivos.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-100 shadow-xs p-6 space-y-4">
        <div className="flex justify-between items-center pb-2">
          <h3 className="font-bold text-sm text-brand-dark flex items-center gap-1.5">
            <Wrench className="w-5 h-5 text-brand-clinical" />
            Fila de Ordens de Serviço ({serviceOrders.length})
          </h3>
          <button className="bg-brand-clinical hover:bg-sky-700 text-white text-xs font-bold px-3 py-2 rounded-lg transition-colors flex items-center gap-1">
            <Plus className="w-4 h-4" /> Nova OS
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="text-slate-400 font-bold border-b border-slate-100">
                <th className="pb-3">Código</th>
                <th className="pb-3">Cliente</th>
                <th className="pb-3">Equipamento</th>
                <th className="pb-3">Técnico Designado</th>
                <th className="pb-3 text-center">Prioridade</th>
                <th className="pb-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {serviceOrders.map((os) => (
                <tr key={os.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3.5 font-bold text-brand-clinical">{os.id}</td>
                  <td className="py-3.5 font-bold text-brand-dark">{os.client}</td>
                  <td className="py-3.5 font-semibold text-slate-700">{os.equipment}</td>
                  <td className="py-3.5 font-semibold text-slate-600">
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      {os.tech}
                    </span>
                  </td>
                  <td className="py-3.5 text-center">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${priorityMap[os.priority as keyof typeof priorityMap].class}`}>
                      {priorityMap[os.priority as keyof typeof priorityMap].label}
                    </span>
                  </td>
                  <td className="py-3.5 text-center">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusMap[os.status as keyof typeof statusMap].class}`}>
                      {statusMap[os.status as keyof typeof statusMap].label}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
