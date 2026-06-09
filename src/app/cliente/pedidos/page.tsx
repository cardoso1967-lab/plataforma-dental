import React from 'react';
import { ShoppingBag, Calendar, AlertCircle, Package, Receipt } from 'lucide-react';
import { getCustomerSession } from '@/lib/customer-data';

export default async function ClientePedidosPage() {
  const { supabase, customer } = await getCustomerSession();

  // Buscar todos os pedidos de venda deste cliente, incluindo itens e nomes dos produtos
  const { data: myOrders, error } = await supabase
    .from('sales_orders')
    .select(`
      id,
      status,
      total_amount,
      notes,
      created_at,
      sales_order_items (
        id,
        quantity,
        unit_price,
        products (
          name
        )
      )
    `)
    .eq('customer_id', customer.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Erro ao buscar pedidos:', error);
  }

  // Mapeamento de status para exibição amigável
  const statusConfig = {
    pendente: { label: 'Pendente', bg: 'bg-amber-50 text-amber-700 border-amber-200' },
    aprovado: { label: 'Aprovado', bg: 'bg-blue-50 text-blue-700 border-blue-200' },
    faturado: { label: 'Faturado', bg: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
    cancelado: { label: 'Cancelado', bg: 'bg-rose-50 text-rose-700 border-rose-200' },
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto text-left animate-in fade-in duration-300">
      {/* Header Premium */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-100 pb-5">
        <div className="space-y-1 text-left">
          <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2.5">
            <div className="p-2 bg-sky-50 text-brand-clinical rounded-2xl shadow-2xs">
              <ShoppingBag className="w-6 h-6" />
            </div>
            Meus Pedidos de Compra
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Acompanhe o faturamento, entrega e status dos equipamentos e suprimentos adquiridos para seu consultório.
          </p>
        </div>
      </div>

      {!myOrders || myOrders.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-100 p-10 text-center shadow-xs space-y-4 hover:border-slate-200 transition-all duration-300">
          <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center mx-auto shadow-2xs">
            <ShoppingBag className="w-6 h-6 text-slate-350" />
          </div>
          <div className="space-y-1">
            <p className="text-xs font-black text-slate-800">Nenhum pedido de compra realizado</p>
            <p className="text-[10px] text-slate-400 max-w-xs mx-auto leading-normal">
              Quando você adquirir novos equipamentos e insumos com nossa equipe, eles aparecerão detalhados aqui.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          {myOrders.map((order) => {
            const statusStyle = statusConfig[order.status as keyof typeof statusConfig] || {
              label: order.status,
              bg: 'bg-slate-50 text-slate-700 border-slate-200',
            };

            const borderColors = {
              pendente: 'border-l-4 border-l-amber-500',
              aprovado: 'border-l-4 border-l-blue-500',
              faturado: 'border-l-4 border-l-emerald-500',
              cancelado: 'border-l-4 border-l-rose-500',
            };
            const borderColorClass = borderColors[order.status as keyof typeof borderColors] || 'border-l-4 border-l-slate-400';

            const items = order.sales_order_items || [];

            return (
              <div 
                key={order.id}
                className={`bg-white border border-slate-100 rounded-3xl p-6 shadow-2xs space-y-5 hover:shadow-md hover:scale-[1.008] transition-all duration-300 relative overflow-hidden text-left ${borderColorClass}`}
              >
                <div className="flex justify-between items-start pt-1">
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono font-black text-brand-clinical tracking-wider block">
                      PEDIDO: #{order.id.slice(0, 8).toUpperCase()}
                    </span>
                    <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {new Date(order.created_at).toLocaleDateString('pt-BR', { dateStyle: 'long' })}
                    </p>
                  </div>
                  <span className={`text-[9px] font-black px-3 py-1 rounded-full border uppercase tracking-wider shadow-3xs ${statusStyle.bg}`}>
                    {statusStyle.label}
                  </span>
                </div>

                {/* Listado de items del pedido */}
                <div className="space-y-3 pt-2.5 border-t border-slate-100">
                  <h4 className="font-extrabold text-slate-800 text-xs leading-snug flex items-center gap-2">
                    <Package className="w-4 h-4 text-purple-650" />
                    Produtos Adquiridos
                  </h4>
                  {items.length > 0 ? (
                    <ul className="space-y-2 font-bold text-xs text-slate-600 pl-0.5">
                      {items.map((item: any) => (
                        <li key={item.id} className="flex justify-between items-center bg-slate-50/50 p-3 rounded-2xl border border-slate-100/60 hover:bg-slate-50 transition-colors">
                          <span className="text-slate-700 font-semibold">
                            {item.quantity}x <strong className="text-slate-850 font-extrabold">{item.products?.name}</strong>
                          </span>
                          <span className="font-mono text-slate-500 text-[10px] bg-white border border-slate-100 px-2 py-0.5 rounded-lg shadow-3xs">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(item.unit_price))} cada
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-slate-500 italic pl-1">{order.notes || 'Equipamento Odontológico'}</p>
                  )}
                </div>

                {/* Total de la orden */}
                <div className="border-t border-slate-100 pt-4 flex items-center justify-between text-xs font-bold bg-slate-50/40 -mx-6 -mb-6 p-6 rounded-b-3xl">
                  <span className="text-slate-400 font-extrabold uppercase tracking-widest flex items-center gap-1.5">
                    <Receipt className="w-4 h-4 text-slate-400" />
                    Valor Total do Pedido
                  </span>
                  <span className="text-slate-900 font-black text-base">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(order.total_amount))}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
