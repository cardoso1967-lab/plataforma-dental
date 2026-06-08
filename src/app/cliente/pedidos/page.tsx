import React from 'react';
import { ShoppingBag, Calendar, ArrowRight } from 'lucide-react';

export default function ClientePedidosPage() {
  const myOrders = [
    { id: 'PV-0039', date: '02/06/2026', total: 4200.00, status: 'Faturado', item: 'Autoclave Digital Biossegurança 12L' },
    { id: 'PV-0021', date: '15/04/2026', total: 1150.00, status: 'Entregue', item: 'Caneta de Alta Rotação Cobra LED' },
  ];

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-xl font-extrabold text-brand-dark tracking-tight">
          Meus Pedidos de Compra
        </h1>
        <p className="text-xs text-slate-500 font-medium">
          Acompanhe o status de entrega e faturamento de seus equipamentos adquiridos.
        </p>
      </div>

      <div className="space-y-3">
        {myOrders.map((order) => (
          <div 
            key={order.id}
            className="bg-white border border-slate-100 rounded-xl p-4 shadow-xs flex flex-col justify-between gap-3 hover:shadow-md transition-shadow"
          >
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-brand-clinical">
                ID: {order.id}
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                order.status === 'Faturado' ? 'bg-blue-50 text-blue-700' : 'bg-emerald-50 text-emerald-700'
              }`}>
                {order.status}
              </span>
            </div>

            <div className="space-y-1">
              <h4 className="font-extrabold text-brand-dark text-sm leading-snug">
                {order.item}
              </h4>
              <p className="text-[10px] font-semibold text-slate-400 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                Data de compra: {order.date}
              </p>
            </div>

            <div className="border-t border-slate-50 pt-2 flex items-center justify-between text-xs font-bold">
              <span className="text-slate-400 font-semibold">Valor Total:</span>
              <span className="text-brand-dark">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(order.total)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
