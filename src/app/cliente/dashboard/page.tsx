import React from 'react';
import { StatusCard } from '@/components/ui/StatusCard';
import { ServiceOrderCard } from '@/components/ui/ServiceOrderCard';
import { ShoppingBag, Wrench, Shield, ArrowRight, Stethoscope, Compass, Plus } from 'lucide-react';
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
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Welcome Block Premium */}
      <div className="bg-gradient-to-r from-slate-900 to-sky-950 text-white rounded-3xl p-6 md:p-8 shadow-sm relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 pointer-events-none hidden sm:block">
          <Stethoscope className="w-full h-full text-white scale-125" />
        </div>
        <div className="space-y-2 relative z-10 max-w-xl text-left">
          <span className="text-[10px] font-bold text-sky-400 uppercase tracking-widest block">Portal do Cliente</span>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            Olá, {profile.name}
          </h1>
          <p className="text-xs text-slate-300 font-medium leading-relaxed">
            Acompanhe a saúde dos seus equipamentos odontológicos, visualize seus contratos de manutenção e ordens de serviço em tempo real.
          </p>
        </div>
      </div>

      {/* Assistência Técnica em Andamento */}
      <div className="space-y-3.5">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider text-left">
          Assistência Técnica em Andamento
        </h3>
        {activeOS ? (
          <div className="hover:scale-[1.005] transition-all duration-200">
            <ServiceOrderCard {...activeOS} />
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center shadow-xs flex flex-col items-center justify-center space-y-4">
            <div className="w-12 h-12 bg-sky-50 text-brand-clinical rounded-full flex items-center justify-center">
              <Compass className="w-6 h-6 animate-pulse" />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-extrabold text-brand-dark">Tudo sob controle por aqui</p>
              <p className="text-[10px] text-slate-400 font-medium max-w-xs mx-auto">
                Nenhum chamado de manutenção ativo. Seus equipamentos clínicos estão funcionando perfeitamente.
              </p>
            </div>
            <Link 
              href="/cliente/suporte"
              className="inline-flex items-center gap-1.5 bg-brand-clinical hover:bg-sky-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl transition-all shadow-sm hover:scale-[1.01]"
            >
              <Plus className="w-4 h-4" /> Solicitar Nova Visita Técnica
            </Link>
          </div>
        )}
      </div>

      {/* Grid de Resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="hover:scale-[1.01] transition-all duration-300">
          <StatusCard
            title="Último Pedido"
            value={lastOrder 
              ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(lastOrder.total)
              : 'Nenhum pedido'
            }
            description={lastOrder ? `${lastOrder.notes} (${lastOrder.status.toUpperCase()})` : 'Nenhuma compra recente registrada'}
            icon={<ShoppingBag className="w-5 h-5 text-brand-clinical" />}
            variant="light"
          />
        </div>
        <div className="hover:scale-[1.01] transition-all duration-300">
          <StatusCard
            title="Equipamentos Registrados"
            value={equipmentsCount !== null ? `${equipmentsCount} instalado(s)` : '0 instalados'}
            description="Contratos de assistência e prevenção ativos"
            icon={<Wrench className="w-5 h-5 text-emerald-500" />}
            variant="light"
          />
        </div>
      </div>

      {/* Ações Rápidas */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4 shadow-xs">
        <h3 className="text-xs font-bold text-brand-dark uppercase tracking-wider text-left">
          Ações Rápidas do Consultório
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-left">
          <Link 
            href="/cliente/suporte" 
            className="flex items-center justify-between p-4 border border-slate-100 hover:border-brand-clinical hover:bg-sky-50/20 rounded-xl text-xs font-bold text-slate-800 transition-all active:scale-[0.99] group shadow-2xs"
          >
            <span className="flex items-center gap-3">
              <span className="w-8 h-8 bg-sky-50 text-brand-clinical rounded-lg flex items-center justify-center group-hover:bg-brand-clinical group-hover:text-white transition-colors">
                <Wrench className="w-4.5 h-4.5" />
              </span>
              <div>
                <p className="text-brand-dark font-extrabold">Solicitar Suporte Técnico</p>
                <p className="text-[10px] text-slate-400 font-medium">Reportar problemas e agendar visitas</p>
              </div>
            </span>
            <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-brand-clinical group-hover:translate-x-0.5 transition-all" />
          </Link>

          <Link 
            href="/cliente/pedidos" 
            className="flex items-center justify-between p-4 border border-slate-100 hover:border-brand-clinical hover:bg-sky-50/20 rounded-xl text-xs font-bold text-slate-800 transition-all active:scale-[0.99] group shadow-2xs"
          >
            <span className="flex items-center gap-3">
              <span className="w-8 h-8 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                <ShoppingBag className="w-4.5 h-4.5" />
              </span>
              <div>
                <p className="text-brand-dark font-extrabold">Meus Pedidos de Venda</p>
                <p className="text-[10px] text-slate-400 font-medium">Acompanhar compras e faturamento</p>
              </div>
            </span>
            <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-brand-clinical group-hover:translate-x-0.5 transition-all" />
          </Link>
        </div>
      </div>
    </div>
  );
}
