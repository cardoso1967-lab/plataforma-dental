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
    <div className="space-y-6 max-w-4xl mx-auto text-left">
      <div className="space-y-1">
        <h1 className="text-2xl font-extrabold text-brand-dark tracking-tight flex items-center gap-2">
          <ShoppingBag className="w-7 h-7 text-brand-clinical" />
          Meus Pedidos de Compra
        </h1>
        <p className="text-xs text-slate-500 font-medium">
          Acompanhe o faturamento, entrega e status dos equipamentos e suprimentos adquiridos para seu consultório.
        </p>
      </div>

      {!myOrders || myOrders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-10 text-center shadow-xs space-y-4">
          <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <p className="text-xs font-extrabold text-brand-dark">Nenhum pedido de compra realizado</p>
            <p className="text-[10px] text-slate-400 max-w-xs mx-auto">
              Quando você adquirir novos equipamentos e insumos com nossa equipe, eles aparecerão detalhados aqui.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {myOrders.map((order) => {
            const statusStyle = statusConfig[order.status as keyof typeof statusConfig] || {
              label: order.status,
              bg: 'bg-slate-50 text-slate-700 border-slate-200',
            };

            // Determinar o item principal a exibir ou resumo de itens
            const items = order.sales_order_items || [];
            const itemsSummary = items.map((item: any) => {
              const productName = item.products?.name || 'Equipamento';
              return `${item.quantity}x ${productName}`;
            }).join(', ');

            return (
              <div 
                key={order.id}
                className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs space-y-4 hover:shadow-md hover:scale-[1.005] transition-all duration-300 relative overflow-hidden"
              >
                {/* Decoración superior sutil */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-sky-400 to-brand-clinical" />

                <div className="flex justify-between items-start pt-1">
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono font-bold text-slate-400 block">
                      PEDIDO: #{order.id.slice(0, 8).toUpperCase()}
                    </span>
                    <p className="text-[10px] font-semibold text-slate-500 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {new Date(order.created_at).toLocaleDateString('pt-BR', { dateStyle: 'long' })}
                    </p>
                  </div>
                  <span className={`text-[9px] font-extrabold px-2.5 py-1 rounded-full border uppercase tracking-wider ${statusStyle.bg}`}>
                    {statusStyle.label}
                  </span>
                </div>

                {/* Listado de items del pedido */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <h4 className="font-extrabold text-brand-dark text-sm leading-snug flex items-center gap-1.5">
                    <Package className="w-4 h-4 text-brand-clinical" />
                    Produtos Adquiridos
                  </h4>
                  {items.length > 0 ? (
                    <ul className="space-y-2 font-medium text-xs text-slate-600 pl-1">
                      {items.map((item: any) => (
                        <li key={item.id} className="flex justify-between items-center bg-slate-50 p-2.5 rounded-xl border border-slate-100/50">
                          <span>
                            {item.quantity}x <strong className="text-slate-800 font-bold">{item.products?.name}</strong>
                          </span>
                          <span className="font-mono text-slate-500 text-[11px]">
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
                <div className="border-t border-slate-100 pt-3.5 flex items-center justify-between text-xs font-bold bg-slate-50/50 -mx-5 -mb-5 p-5 rounded-b-2xl">
                  <span className="text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <Receipt className="w-4 h-4 text-slate-400" />
                    Valor Total do Pedido
                  </span>
                  <span className="text-brand-dark font-extrabold text-base">
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
