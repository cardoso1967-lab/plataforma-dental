import React from 'react';
import { Receipt, Calendar, User, Search } from 'lucide-react';

export default function AdminPedidosVendaPage() {
  const salesOrders = [
    { id: 'PV-0042', client: 'Clínica Sorriso Lindo', date: '08/06/2026', total: 24500.00, status: 'Aprovado', seller: 'Ana Paula (Vendas)' },
    { id: 'PV-0041', client: 'Dr. Roberto Santos', date: '07/06/2026', total: 8900.00, status: 'Pendente', seller: 'Canal Direto (Web)' },
    { id: 'PV-0040', client: 'OdontoClinic Paulista', date: '06/06/2026', total: 1150.00, status: 'Faturado', seller: 'Ana Paula (Vendas)' },
    { id: 'PV-0039', client: 'Dra. Sandra Melo', date: '02/06/2026', total: 4200.00, status: 'Cancelado', seller: 'Canal Direto (Web)' },
  ];

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-extrabold text-brand-dark tracking-tight">
          Pedidos de Venda
        </h1>
        <p className="text-xs text-slate-500 font-medium">
          Acompanhe o faturamento de equipamentos e suprimentos odontológicos.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-100 shadow-xs p-6 space-y-4">
        <div className="flex justify-between items-center pb-2">
          <h3 className="font-bold text-sm text-brand-dark flex items-center gap-1.5">
            <Receipt className="w-5 h-5 text-brand-clinical" />
            Registro de Pedidos ({salesOrders.length})
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="text-slate-400 font-bold border-b border-slate-100">
                <th className="pb-3">Pedido</th>
                <th className="pb-3">Cliente</th>
                <th className="pb-3">Data</th>
                <th className="pb-3">Vendedor</th>
                <th className="pb-3 text-right">Total</th>
                <th className="pb-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {salesOrders.map((order) => (
                <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3.5 font-bold text-brand-clinical">{order.id}</td>
                  <td className="py-3.5 font-bold text-brand-dark">{order.client}</td>
                  <td className="py-3.5 text-slate-500 font-semibold">{order.date}</td>
                  <td className="py-3.5 text-slate-600 font-semibold">{order.seller}</td>
                  <td className="py-3.5 text-right font-bold text-brand-dark">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(order.total)}
                  </td>
                  <td className="py-3.5 text-center">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      order.status === 'Aprovado' ? 'bg-emerald-50 text-emerald-700' :
                      order.status === 'Faturado' ? 'bg-blue-50 text-blue-700' :
                      order.status === 'Cancelado' ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700'
                    }`}>
                      {order.status}
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
