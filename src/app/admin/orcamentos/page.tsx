import React from 'react';
import { CircleDollarSign, Calendar, FileText } from 'lucide-react';

export default function AdminOrcamentosPage() {
  const quotes = [
    { id: 'ORC-0452', os: 'OS-0890', client: 'Dr. Roberto Santos', value: 1850.00, date: '08/06/2026', status: 'enviado' },
    { id: 'ORC-0451', os: 'OS-0891', client: 'Clínica Sorriso Lindo', value: 340.00, date: '07/06/2026', status: 'aprovado' },
    { id: 'ORC-0450', os: 'OS-0888', client: 'Dra. Sandra Melo', value: 2900.00, date: '05/06/2026', status: 'rejeitado' },
  ];

  const statusMap = {
    rascunho: 'bg-slate-100 text-slate-600',
    enviado: 'bg-blue-50 text-blue-700',
    aprovado: 'bg-success-bg text-success-text',
    rejeitado: 'bg-rose-50 text-rose-700',
  };

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-extrabold text-brand-dark tracking-tight">
          Orçamentos de Serviço
        </h1>
        <p className="text-xs text-slate-500 font-medium">
          Monitore as propostas de conserto enviadas aos clientes e as aprovações pendentes.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-100 shadow-xs p-6 space-y-4">
        <div className="flex justify-between items-center pb-2">
          <h3 className="font-bold text-sm text-brand-dark flex items-center gap-1.5">
            <CircleDollarSign className="w-5 h-5 text-brand-clinical" />
            Orçamentos Emitidos ({quotes.length})
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="text-slate-400 font-bold border-b border-slate-100">
                <th className="pb-3">Orçamento</th>
                <th className="pb-3">OS Vinculada</th>
                <th className="pb-3">Cliente</th>
                <th className="pb-3">Data</th>
                <th className="pb-3 text-right">Valor Total</th>
                <th className="pb-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {quotes.map((q) => (
                <tr key={q.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3.5 font-bold text-brand-clinical flex items-center gap-1">
                    <FileText className="w-4 h-4 text-slate-400" />
                    {q.id}
                  </td>
                  <td className="py-3.5 font-bold text-slate-600">{q.os}</td>
                  <td className="py-3.5 font-bold text-brand-dark">{q.client}</td>
                  <td className="py-3.5 text-slate-500 font-semibold">{q.date}</td>
                  <td className="py-3.5 text-right font-bold text-brand-dark">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(q.value)}
                  </td>
                  <td className="py-3.5 text-center">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${statusMap[q.status as keyof typeof statusMap]}`}>
                      {q.status}
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
