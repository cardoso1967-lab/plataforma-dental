import React from 'react';
import { ShoppingBag, Calendar, AlertCircle } from 'lucide-react';
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
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
          Meus Pedidos de Compra
        </h1>
        <p className="text-xs text-slate-500 font-medium">
          Acompanhe o status de entrega e faturamento de seus equipamentos adquiridos.
        </p>
      </div>

      {!myOrders || myOrders.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-100 p-8 text-center shadow-xs">
          <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-xs font-semibold text-slate-500">Nenhum pedido de compra realizado.</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Seus novos pedidos de compra aparecerão aqui.</p>
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
                className="bg-white border border-slate-100 rounded-xl p-5 shadow-xs space-y-4 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold text-sky-500 uppercase tracking-widest block">
                      Pedido #{order.id.slice(0, 8).toUpperCase()}
                    </span>
                    <p className="text-[10px] font-semibold text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      Compra: {new Date(order.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md border ${statusStyle.bg}`}>
                    {statusStyle.label}
                  </span>
                </div>

                <div className="space-y-1.5 pt-1">
                  <h4 className="font-extrabold text-slate-800 text-sm leading-snug">
                    {itemsSummary || order.notes || 'Equipamento Odontológico'}
                  </h4>
                  {items.length > 0 && (
                    <ul className="text-[10px] text-slate-400 space-y-0.5 list-disc pl-4 font-medium">
                      {items.map((item: any) => (
                        <li key={item.id}>
                          {item.quantity}x {item.products?.name} (
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(item.unit_price))} cada
                          )
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="border-t border-slate-50 pt-3 flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-400 font-semibold">Valor Total:</span>
                  <span className="text-slate-800 text-sm">
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
