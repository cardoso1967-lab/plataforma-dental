'use client';

import React from 'react';
import { PageHero } from '@/components/ui/PageHero';
import { MetricCard } from '@/components/ui/MetricCard';
import { 
  BarChart3, TrendingUp, Calendar, AlertTriangle, 
  ShieldCheck, Clock, CheckCircle, ArrowUpRight, FileText
} from 'lucide-react';

export default function AdminRelatoriosPage() {
  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Page Header */}
      <PageHero
        title="Relatórios & Métricas"
        description="Acompanhe a performance comercial de faturamento, eficiência e SLAs operacionais de campo."
        badge="Analytics e Gestão"
        icon={BarChart3}
        variant="compact"
      />

      {/* KPI metrics at the top */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Receita Consolidada"
          value="Aguardando dados reais"
          description="Faturamento consolidado"
          icon={<TrendingUp className="w-4 h-4 text-emerald-600" />}
          variant="emerald"
        />
        <MetricCard
          title="Aprovação de Orçamentos"
          value="Aguardando dados reais"
          description="Taxa de conversão comercial"
          icon={<ArrowUpRight className="w-4 h-4 text-sky-600" />}
          variant="default"
        />
        <MetricCard
          title="Tempo de Resposta"
          value="Ainda não calculado"
          description="Média até primeiro diagnóstico"
          icon={<Clock className="w-4 h-4 text-amber-600" />}
          variant="amber"
        />
        <MetricCard
          title="Resolução de OS"
          value="Aguardando dados reais"
          description="SLAs operacionais cumpridos"
          icon={<ShieldCheck className="w-4 h-4 text-indigo-650" />}
          variant="indigo"
        />
      </div>

      {/* Analytics Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Panel 1: Faturamento e Conversões */}
        <div className="bg-white rounded-3xl border border-slate-200/60 p-6 space-y-6 shadow-3xs text-left">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="font-extrabold text-sm text-slate-800 tracking-tight flex items-center gap-2">
              <TrendingUp className="w-4.5 h-4.5 text-emerald-600 stroke-[2.5]" />
              Faturamento de Vendas & Manutenções
            </h3>
            <p className="text-[10px] text-slate-450 font-medium mt-0.5">Visão consolidada comparativa do mês corrente</p>
          </div>

          <div className="space-y-5">
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-bold">
                <span className="text-slate-600">Vendas Diretas de Equipamentos</span>
                <span className="text-slate-400 italic text-[11px] font-semibold">Aguardando dados reais</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-sky-500 h-full rounded-full" style={{ width: '0%' }}></div>
              </div>
              <p className="text-[9.5px] text-slate-400 font-semibold">Faturamento pendente de integração com o sistema de vendas.</p>
            </div>

            <div className="space-y-2 pt-2">
              <div className="flex justify-between items-center text-xs font-bold">
                <span className="text-slate-600">Serviços e Contratos de Campo</span>
                <span className="text-slate-400 italic text-[11px] font-semibold">Aguardando dados reais</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full" style={{ width: '0%' }}></div>
              </div>
              <p className="text-[9.5px] text-slate-400 font-semibold">Faturamento de ordens de serviço aguardando conclusão do período.</p>
            </div>

            <div className="pt-4 border-t border-slate-100/80 space-y-3.5">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Conversão Comercial</h4>
              <div className="grid grid-cols-2 gap-4 text-xs font-bold text-slate-700">
                <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                  <span className="text-[9px] text-slate-400 block font-mono uppercase">Orçamentos Gerados</span>
                  <span className="text-[11px] font-semibold text-slate-500 italic">Aguardando dados reais</span>
                </div>
                <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                  <span className="text-[9px] text-slate-450 block font-mono uppercase">Propostas Aprovadas</span>
                  <span className="text-[11px] font-semibold text-slate-500 italic">Aguardando dados reais</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Panel 2: Eficiência Operacional e SLAs */}
        <div className="bg-white rounded-3xl border border-slate-200/60 p-6 space-y-6 shadow-3xs text-left">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="font-extrabold text-sm text-slate-800 tracking-tight flex items-center gap-2">
              <Clock className="w-4.5 h-4.5 text-indigo-650 stroke-[2.5]" />
              Eficiência e Tempos de SLA
            </h3>
            <p className="text-[10px] text-slate-450 font-medium mt-0.5">Indicadores operacionais técnicos de campo</p>
          </div>

          <div className="space-y-4 text-xs font-semibold text-slate-600">
            <div className="flex justify-between items-center border-b border-slate-100/60 pb-3">
              <span className="text-slate-500 font-medium">Tempo Médio de Atribuição de Técnico:</span>
              <span className="font-bold text-slate-400 italic bg-slate-100 px-2.5 py-0.5 rounded text-[10.5px]">Ainda não calculado</span>
            </div>
            
            <div className="flex justify-between items-center border-b border-slate-100/60 pb-3">
              <span className="text-slate-500 font-medium">Tempo de Deslocamento Médio:</span>
              <span className="font-bold text-slate-400 italic bg-slate-100 px-2.5 py-0.5 rounded text-[10.5px]">Ainda não calculado</span>
            </div>

            <div className="flex justify-between items-center border-b border-slate-100/60 pb-3">
              <span className="text-slate-500 font-medium">Tempo Médio em Atendimento Local:</span>
              <span className="font-bold text-slate-400 italic bg-slate-100 px-2.5 py-0.5 rounded text-[10.5px]">Ainda não calculado</span>
            </div>

            <div className="flex justify-between items-center border-b border-slate-100/60 pb-3">
              <span className="text-slate-500 font-medium">SLA de Visita no Mesmo Dia (Urgentes):</span>
              <span className="font-bold text-slate-400 italic bg-slate-100 px-2.5 py-0.5 rounded text-[10.5px]">Aguardando dados reais</span>
            </div>

            <div className="flex justify-between items-center pt-1">
              <span className="text-slate-500 font-medium">Taxa de Resolução de Primeiro Contato:</span>
              <span className="font-bold text-slate-400 italic bg-slate-100 px-2.5 py-0.5 rounded text-[10.5px]">Aguardando dados reais</span>
            </div>
          </div>

          <div className="bg-amber-50/40 rounded-xl p-3.5 border border-amber-100/60 text-[10.5px] font-semibold text-amber-800 leading-relaxed flex gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>Aguardando consolidação de dados operacionais e ordens de serviço para cálculo de conformidade de SLAs.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
