import React from 'react';
import { StatusCard } from '@/components/ui/StatusCard';
import { ServiceOrderCard } from '@/components/ui/ServiceOrderCard';
import { ShoppingBag, Wrench, Shield, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function ClienteDashboardPage() {
  const activeOS = {
    id: 'OS-0892',
    osNumber: '0892',
    customerName: 'Dra. Sandra Melo',
    equipmentName: 'Autoclave Digital 12L',
    status: 'orcamento_pendente' as const,
    priority: 'urgente' as const,
    scheduledDate: '08/06/2026 às 14:00',
  };

  return (
    <div className="space-y-6">
      {/* Welcome Block */}
      <div className="space-y-1">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Portal Dental</span>
        <h1 className="text-xl sm:text-2xl font-extrabold text-brand-dark tracking-tight">
          Olá, Dra. Sandra Melo
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
        <ServiceOrderCard {...activeOS} />
      </div>

      {/* Grid de Resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatusCard
          title="Último Pedido"
          value="R$ 4.200,00"
          description="Autoclave Biossegurança"
          icon={<ShoppingBag className="w-5 h-5 text-brand-clinical" />}
          variant="light"
        />
        <StatusCard
          title="Equipamentos Registrados"
          value="3 instalados"
          description="Contrato de manutenção ativo"
          icon={<Wrench className="w-5 h-5 text-emerald-500" />}
          variant="light"
        />
      </div>

      {/* Ações Rápidas Mobile */}
      <div className="bg-white rounded-xl border border-slate-100 p-5 space-y-4 shadow-xs">
        <h3 className="text-xs font-bold text-brand-dark uppercase tracking-wider">
          Ações Rápidas
        </h3>
        
        <div className="grid gap-2">
          <Link 
            href="/cliente/suporte" 
            className="flex items-center justify-between p-3.5 border border-slate-100 hover:border-brand-clinical rounded-lg text-xs font-bold text-brand-dark transition-all active:bg-slate-50"
          >
            <span className="flex items-center gap-2">
              <Wrench className="w-4 h-4 text-brand-clinical" />
              Solicitar Conserto / Visita Técnica
            </span>
            <ArrowRight className="w-4 h-4 text-slate-300" />
          </Link>

          <Link 
            href="/cliente/pedidos" 
            className="flex items-center justify-between p-3.5 border border-slate-100 hover:border-brand-clinical rounded-lg text-xs font-bold text-brand-dark transition-all active:bg-slate-50"
          >
            <span className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-brand-clinical" />
              Ver Meus Pedidos de Compra
            </span>
            <ArrowRight className="w-4 h-4 text-slate-300" />
          </Link>
        </div>
      </div>
    </div>
  );
}
