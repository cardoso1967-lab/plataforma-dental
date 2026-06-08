import React from 'react';
import { Package, Plus, Search } from 'lucide-react';

export default function AdminProdutosPage() {
  const products = [
    { id: '1', name: 'Cadeira Odontológica Premium S500', price: 24500.00, stock: 8, sku: 'CAD-S500', type: 'Equipamento', active: true },
    { id: '2', name: 'Autoclave Digital Biossegurança 12L', price: 4200.00, stock: 15, sku: 'AUT-12L', type: 'Equipamento', active: true },
    { id: '3', name: 'Aparelho de Raio-X Intraoral Parede', price: 8900.00, stock: 4, sku: 'XRAY-INTRA', type: 'Equipamento', active: true },
    { id: '4', name: 'Caneta de Alta Rotação Cobra LED', price: 1150.00, stock: 50, sku: 'PEN-LED', type: 'Peça', active: true },
  ];

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-extrabold text-brand-dark tracking-tight">
          Gestão de Produtos
        </h1>
        <p className="text-xs text-slate-500 font-medium">
          Gerencie o catálogo de equipamentos odontológicos e peças expostas no portal público.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-100 shadow-xs p-6 space-y-5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-50 pb-4">
          <h3 className="font-bold text-sm text-brand-dark flex items-center gap-1.5">
            <Package className="w-5 h-5 text-brand-clinical" />
            Portfólio de Vendas ({products.length})
          </h3>
          <div className="flex gap-2 w-full sm:w-auto">
            <button className="bg-brand-clinical hover:bg-sky-700 text-white text-xs font-bold px-3 py-2 rounded-lg transition-colors flex items-center gap-1">
              <Plus className="w-4 h-4" /> Novo Produto
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="text-slate-400 font-bold border-b border-slate-100">
                <th className="pb-3">SKU</th>
                <th className="pb-3">Produto</th>
                <th className="pb-3">Tipo</th>
                <th className="pb-3 text-right">Preço</th>
                <th className="pb-3 text-center">Estoque</th>
                <th className="pb-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3.5 font-bold text-slate-500">{product.sku}</td>
                  <td className="py-3.5 font-bold text-brand-dark">{product.name}</td>
                  <td className="py-3.5 font-semibold text-slate-600">{product.type}</td>
                  <td className="py-3.5 text-right font-bold text-brand-dark">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.price)}
                  </td>
                  <td className="py-3.5 text-center font-bold text-slate-800">{product.stock} un</td>
                  <td className="py-3.5 text-center">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-success-bg text-success-text">
                      Ativo
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
