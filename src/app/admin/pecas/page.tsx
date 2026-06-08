import React from 'react';
import { Settings, Plus, Search } from 'lucide-react';

export default function AdminPecasPage() {
  const parts = [
    { id: '1', code: 'PE-MANG01', name: 'Mangueira de Sucção de Silicone 1,5m', price: 85.00, stock: 42 },
    { id: '2', code: 'PE-VALV02', name: 'Válvula Reguladora de Pressão Compressores', price: 145.00, stock: 12 },
    { id: '3', code: 'PE-LAMP03', name: 'Lâmpada LED de Foco Clínico', price: 290.00, stock: 8 },
    { id: '4', code: 'PE-FILT04', name: 'Filtro de Ar para Compressor', price: 45.00, stock: 25 },
  ];

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-extrabold text-brand-dark tracking-tight">
          Peças de Reposição
        </h1>
        <p className="text-xs text-slate-500 font-medium">
          Monitore o estoque físico de peças técnicas usadas pelos técnicos de campo.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-100 shadow-xs p-6 space-y-4">
        <div className="flex justify-between items-center pb-2">
          <h3 className="font-bold text-sm text-brand-dark flex items-center gap-1.5">
            <Settings className="w-5 h-5 text-brand-clinical" />
            Estoque de Peças ({parts.length})
          </h3>
          <button className="bg-brand-clinical hover:bg-sky-700 text-white text-xs font-bold px-3 py-2 rounded-lg transition-colors flex items-center gap-1">
            <Plus className="w-4 h-4" /> Nova Peça
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="text-slate-400 font-bold border-b border-slate-100">
                <th className="pb-3">Código</th>
                <th className="pb-3">Peça / Descrição</th>
                <th className="pb-3 text-right">Preço de Reposição</th>
                <th className="pb-3 text-center">Quantidade Estoque</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {parts.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3.5 font-bold text-slate-500">{p.code}</td>
                  <td className="py-3.5 font-bold text-brand-dark">{p.name}</td>
                  <td className="py-3.5 text-right font-bold text-brand-dark">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(p.price)}
                  </td>
                  <td className={`py-3.5 text-center font-bold ${p.stock <= 15 ? 'text-amber-600' : 'text-slate-800'}`}>
                    {p.stock} un
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
