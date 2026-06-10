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
    <div className="space-y-8 max-w-4xl mx-auto text-left animate-in fade-in duration-300">
      {/* Header Premium */}
      <PageHero
        title="Meus Pedidos de Compra"
        description="Acompanhe o faturamento, entrega e status dos equipamentos e suprimentos adquiridos para seu consultório."
        badge="Compras"
        icon={ShoppingBag}
      />

      {!myOrders || myOrders.length === 0 ? (
        <EmptyState
          title="Nenhum pedido de compra"
          description="Você não possui pedidos de compra registrados nesta conta. Entre em contato com nosso departamento comercial para adquirir novos equipamentos odontológicos."
          icon={<ShoppingBag className="w-6 h-6 text-sky-650" />}
          actionLabel="Falar com Vendas / Suporte"
          actionHref="/cliente/suporte"
        />
      ) : (
        <div className="space-y-5">
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
                className={`bg-white border border-slate-100/80 rounded-3xl p-6 shadow-3xs space-y-5 hover:shadow-sm hover:scale-[1.008] transition-all duration-300 relative overflow-hidden text-left ${borderColorClass}`}
              >
                <div className="flex justify-between items-start pt-1">
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono font-black text-sky-650 tracking-wider block">
                      PEDIDO: #{order.id.slice(0, 8).toUpperCase()}
                    </span>
                    <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5 font-sans">
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
                <div className="space-y-3 pt-2.5 border-t border-slate-100">
                  <h4 className="font-extrabold text-slate-800 text-xs leading-snug flex items-center gap-2">
                    <Package className="w-4 h-4 text-sky-600" />
                    Produtos Adquiridos
                  </h4>
                  {items.length > 0 ? (
                    <ul className="space-y-2 font-bold text-xs text-slate-600 pl-0.5">
                      {items.map((item: any) => (
                        <li key={item.id} className="flex justify-between items-center bg-slate-50/50 p-3 rounded-2xl border border-slate-100/60 hover:bg-slate-50 transition-colors">
                          <span className="text-slate-700 font-semibold">
                            {item.quantity}x <strong className="text-slate-800 font-extrabold">{item.products?.name}</strong>
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
