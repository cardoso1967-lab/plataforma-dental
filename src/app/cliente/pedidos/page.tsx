import React from 'react';
import { ShoppingBag, Calendar, Package, Receipt } from 'lucide-react';
import { getCustomerSession } from '@/lib/customer-data';
import { PageHero } from '@/components/ui/PageHero';
import { EmptyState } from '@/components/ui/EmptyState';
import { StatusBadge } from '@/components/ui/StatusBadge';

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
  const getStatusBadgeType = (status: string) => {
    switch (status) {
      case 'pendente': return 'warning';
      case 'aprovado': return 'info';
      case 'faturado': return 'success';
      case 'cancelado': return 'error';
      default: return 'neutral';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pendente': return 'Pendente';
      case 'aprovado': return 'Aprovado';
      case 'faturado': return 'Faturado';
      case 'cancelado': return 'Cancelado';
      default: return status;
    }
  };

  return (
    <div className="space-y-8 text-left animate-in fade-in duration-300">
      {/* Header Premium */}
      <PageHero
        title="Meus Pedidos de Compra"
        description="Acompanhe o faturamento, entrega e status dos equipamentos e suprimentos adquiridos para seu consultório."
        badge="Compras"
        icon={ShoppingBag}
        variant="compact"
      />

      {!myOrders || myOrders.length === 0 ? (
        <EmptyState
          title="Nenhum pedido de compra"
          description="Você não possui pedidos de compra registrados nesta conta. Entre em contato com nosso departamento comercial para adquirir novos equipamentos odontológicos."
          icon={<ShoppingBag className="w-6 h-6 text-sky-655" />}
          actionLabel="Falar com Vendas / Suporte"
          actionHref="/cliente/suporte"
          variant="panel"
        />
      ) : (
        <div className="space-y-6">
          {myOrders.map((order) => {
            const borderColors = {
              pendente: 'border-l-4 border-l-amber-500',
              aprovado: 'border-l-4 border-l-sky-500',
              faturado: 'border-l-4 border-l-emerald-500',
              cancelado: 'border-l-4 border-l-rose-500',
            };
            const borderColorClass = borderColors[order.status as keyof typeof borderColors] || 'border-l-4 border-l-slate-400';

            const items = order.sales_order_items || [];

            return (
              <div 
                key={order.id}
                className={`bg-white border border-slate-200/60 rounded-2xl p-6 shadow-[0_2px_8px_rgba(0,0,0,0.015)] space-y-5 hover:shadow-[0_12px_30px_rgba(7,10,19,0.04)] hover:scale-[1.005] hover:border-slate-350/40 transition-all duration-300 relative overflow-hidden text-left ${borderColorClass}`}
              >
                <div className="flex justify-between items-start pt-1">
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono font-black text-sky-600 bg-sky-50/50 px-2 py-0.5 rounded border border-sky-100/50 tracking-wider inline-block leading-none">
                      PEDIDO: #{order.id.slice(0, 8).toUpperCase()}
                    </span>
                    <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5 font-sans pt-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {new Date(order.created_at).toLocaleDateString('pt-BR', { dateStyle: 'long' })}
                    </p>
                  </div>
                  <StatusBadge
                    label={getStatusLabel(order.status)}
                    type={getStatusBadgeType(order.status)}
                  />
                </div>

                {/* Listado de items del pedido */}
                <div className="space-y-3 pt-4 border-t border-slate-100/70">
                  <h4 className="font-extrabold text-slate-800 text-xs leading-snug flex items-center gap-2">
                    <Package className="w-4 h-4 text-sky-600" />
                    Produtos Adquiridos
                  </h4>
                  {items.length > 0 ? (
                    <ul className="space-y-2 font-bold text-xs text-slate-655 pl-0.5">
                      {items.map((item: any) => (
                        <li key={item.id} className="flex justify-between items-center bg-slate-50/60 p-3 rounded-xl border border-slate-150/40 hover:bg-slate-50 hover:border-slate-200/40 transition-all">
                          <span className="text-slate-700 font-semibold">
                            {item.quantity}x <strong className="text-slate-800 font-extrabold">{item.products?.name}</strong>
                          </span>
                          <span className="font-mono text-slate-500 text-[10px] bg-white border border-slate-200/50 px-2 py-0.5 rounded shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
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
                <div className="border-t border-slate-100/70 pt-4 flex items-center justify-between text-xs font-bold bg-slate-50/50 -mx-6 -mb-6 p-5 rounded-b-2xl">
                  <span className="text-slate-400 font-extrabold uppercase tracking-widest flex items-center gap-1.5">
                    <Receipt className="w-4 h-4 text-slate-400" />
                    Valor Total do Pedido
                  </span>
                  <span className="text-slate-900 font-black text-base font-sans">
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
