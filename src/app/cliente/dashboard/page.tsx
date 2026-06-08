import React from 'react';
import { StatusCard } from '@/components/ui/StatusCard';
import { ServiceOrderCard } from '@/components/ui/ServiceOrderCard';
import { ShoppingBag, Wrench, Shield, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { getCustomerSession } from '@/lib/customer-data';

export default async function ClienteDashboardPage() {
  const { supabase, profile, customer } = await getCustomerSession();

  // 1. Buscar equipamentos do cliente
  const { count: equipmentsCount } = await supabase
    .from('client_equipment')
    .select('*', { count: 'exact', head: true })
    .eq('customer_id', customer.id);

  // 2. Buscar a ordem de serviço ativa mais recente
  const { data: activeOSData } = await supabase
    .from('service_orders')
    .select(`
      id,
      status,
      priority,
      scheduled_date,
      client_equipment (
        name
      )
    `)
    .eq('customer_id', customer.id)
    .order('created_at', { ascending: false })
    .limit(1);

  const activeOS = activeOSData?.[0] ? {
    id: activeOSData[0].id,
    osNumber: activeOSData[0].id.slice(0, 8).toUpperCase(),
    customerName: profile.name,
    equipmentName: (activeOSData[0].client_equipment as any)?.name || 'Equipamento em Manutenção',
    status: activeOSData[0].status,
    priority: (activeOSData[0].priority as any) || 'media',
    scheduledDate: activeOSData[0].scheduled_date 
      ? new Date(activeOSData[0].scheduled_date).toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      : undefined,
  } : null;

  // 3. Buscar o último pedido de compra faturado ou aprovado do cliente
  const { data: lastOrderData } = await supabase
    .from('sales_orders')
    .select('total_amount, notes, status')
    .eq('customer_id', customer.id)
    .order('created_at', { ascending: false })
    .limit(1);

  const lastOrder = lastOrderData?.[0] ? {
    total: Number(lastOrderData[0].total_amount),
    notes: lastOrderData[0].notes || 'Pedido de Venda',
    status: lastOrderData[0].status,
  } : null;

  return (
    <div className="space-y-6">
      {/* Welcome Block */}
      <div className="space-y-1">
        <span className="text-[10px] font-bold text-sky-500 uppercase tracking-wider block">Portal Dental</span>
        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
          Olá, {profile.name}
        </h1>
        <p className="text-xs text-slate-500 font-medium leading-relaxed">
          Acompanhe suas compras de equipamentos, contratos de manutenção e ordens de serviço ativas.
        </p>
      </div>

      {/* OS ativa crítica */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          Assistência Técnica em Andamento
        </h3>
        {activeOS ? (
          <ServiceOrderCard {...activeOS} />
        ) : (
          <div className="bg-white rounded-xl border border-slate-100 p-6 text-center shadow-xs">
            <Wrench className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-500">Nenhum chamado de manutenção ativo.</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Seus equipamentos estão funcionando perfeitamente.</p>
          </div>
        )}
      </div>

      {/* Grid de Resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatusCard
          title="Último Pedido"
          value={lastOrder 
            ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(lastOrder.total)
            : 'Nenhum pedido'
          }
          description={lastOrder ? `${lastOrder.notes} (${lastOrder.status})` : 'Nenhuma compra recente registrada'}
          icon={<ShoppingBag className="w-5 h-5 text-sky-500" />}
          variant="light"
        />
        <StatusCard
          title="Equipamentos Registrados"
          value={equipmentsCount !== null ? `${equipmentsCount} instalado(s)` : '0 instalados'}
          description="Contratos de assistência ativos"
          icon={<Wrench className="w-5 h-5 text-emerald-500" />}
          variant="light"
        />
      </div>

      {/* Ações Rápidas Mobile */}
      <div className="bg-white rounded-xl border border-slate-100 p-5 space-y-4 shadow-xs">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
          Ações Rápidas
        </h3>
        
        <div className="grid gap-2">
          <Link 
            href="/cliente/suporte" 
            className="flex items-center justify-between p-3.5 border border-slate-100 hover:border-sky-500 rounded-lg text-xs font-bold text-slate-800 transition-all active:bg-slate-50"
          >
            <span className="flex items-center gap-2">
              <Wrench className="w-4 h-4 text-sky-500" />
              Solicitar Conserto / Visita Técnica
            </span>
            <ArrowRight className="w-4 h-4 text-slate-300" />
          </Link>

          <Link 
            href="/cliente/pedidos" 
            className="flex items-center justify-between p-3.5 border border-slate-100 hover:border-sky-500 rounded-lg text-xs font-bold text-slate-800 transition-all active:bg-slate-50"
          >
            <span className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-sky-500" />
              Ver Meus Pedidos de Compra
            </span>
            <ArrowRight className="w-4 h-4 text-slate-300" />
          </Link>
        </div>
      </div>
    </div>
  );
}
