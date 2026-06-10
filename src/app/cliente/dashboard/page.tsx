import React from 'react';
import { ServiceOrderCard } from '@/components/ui/ServiceOrderCard';
import { ShoppingBag, Wrench, Stethoscope, ClipboardList } from 'lucide-react';
import { getCustomerSession } from '@/lib/customer-data';
import { PageHero } from '@/components/ui/PageHero';
import { MetricCard } from '@/components/ui/MetricCard';
import { ActionCard } from '@/components/ui/ActionCard';
import { EmptyState } from '@/components/ui/EmptyState';

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
    status: activeOSData[0].status as any,
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
    <div className="space-y-8 text-left animate-in fade-in duration-300">
      {/* Welcome Block Premium */}
      <PageHero
        title={`Olá, ${profile.name}`}
        description="Acompanhe a saúde dos seus equipamentos odontológicos, ordens de serviço em tempo real e faturamento de suas compras."
        badge="Portal do Cliente"
        icon={Stethoscope}
        variant="compact"
      />

      {/* Assistência Técnica em Andamento */}
      <div className="space-y-3.5">
        <h3 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest pl-1 font-sans">
          Assistência Técnica em Andamento
        </h3>
        {activeOS ? (
          <div className="hover:scale-[1.008] hover:shadow-md transition-all duration-300">
            <ServiceOrderCard {...activeOS} />
          </div>
        ) : (
          <EmptyState
            title="Tudo sob controle por aqui"
            description="Nenhum chamado de manutenção ativo no momento. Seus equipamentos clínicos estão funcionando perfeitamente."
            icon={<ClipboardList className="w-6 h-6 text-sky-600" />}
            actionLabel="Solicitar Suporte Técnico"
            actionHref="/cliente/suporte"
            variant="compact"
          />
        )}
      </div>

      {/* Grid de Resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <MetricCard
          title="Último Pedido"
          value={lastOrder 
            ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(lastOrder.total)
            : 'Nenhum pedido'
          }
          description={lastOrder ? `${lastOrder.notes} (${lastOrder.status.toUpperCase()})` : 'Nenhuma compra recente registrada'}
          icon={<ShoppingBag className="w-5 h-5 text-sky-600" />}
        />
        <MetricCard
          title="Equipamentos Registrados"
          value={equipmentsCount !== null ? `${equipmentsCount} instalado(s)` : '0 instalados'}
          description="Contratos de assistência e prevenção ativos"
          icon={<Wrench className="w-5 h-5 text-emerald-600" />}
          variant="emerald"
        />
      </div>

      {/* Ações Rápidas */}
      <div className="bg-white rounded-3xl border border-slate-100 p-6 space-y-4 shadow-xs">
        <h3 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest pl-1 font-sans">
          Ações Rápidas do Consultório
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ActionCard
            title="Solicitar Suporte Técnico"
            description="Reportar problemas e agendar visitas de manutenção preventiva."
            icon={<Wrench className="w-4.5 h-4.5" />}
            href="/cliente/suporte"
            variant="sky"
          />
          <ActionCard
            title="Meus Pedidos de Venda"
            description="Acompanhar suas compras recentes e histórico de faturamento."
            icon={<ShoppingBag className="w-4.5 h-4.5" />}
            href="/cliente/pedidos"
            variant="emerald"
          />
        </div>
      </div>
    </div>
  );
}
