import React from 'react';
import { BarChart3, TrendingUp, Calendar, AlertTriangle } from 'lucide-react';

export default function AdminRelatoriosPage() {
  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-extrabold text-brand-dark tracking-tight">
          Relatórios & Métricas
        </h1>
        <p className="text-xs text-slate-500 font-medium">
          Acompanhe o desempenho de vendas e a eficiência da operação de assistência técnica.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-100 shadow-xs p-6 space-y-6">
        <div className="flex justify-between items-center border-b border-slate-50 pb-4">
          <h3 className="font-bold text-sm text-brand-dark flex items-center gap-1.5">
            <BarChart3 className="w-5 h-5 text-brand-clinical" />
            Visão Geral Consolidada (Mês Atual)
          </h3>
        </div>

        {/* Informes gráficos / Analytics */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Relatorio 1 */}
          <div className="border border-slate-100 rounded-xl p-5 space-y-4">
            <h4 className="font-bold text-xs text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              Faturamento de Vendas vs Orçamentos OS
            </h4>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-600 font-semibold">Vendas Diretas:</span>
                <span className="font-bold text-brand-dark">R$ 54.200,00</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-brand-clinical h-full rounded-full" style={{ width: '75%' }}></div>
              </div>

              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-600 font-semibold">Faturamento OS:</span>
                <span className="font-bold text-brand-dark">R$ 18.650,00</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full" style={{ width: '25%' }}></div>
              </div>
            </div>
          </div>

          {/* Relatorio 2 */}
          <div className="border border-slate-100 rounded-xl p-5 space-y-4">
            <h4 className="font-bold text-xs text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Tempo Médio de Atendimento (OS)
            </h4>
            
            <div className="space-y-4 text-xs font-semibold text-slate-600">
              <div className="flex justify-between border-b border-slate-50 pb-2">
                <span>Tempo Médio até Primeiro Diagnóstico:</span>
                <span className="font-bold text-brand-dark">6.4 horas</span>
              </div>
              <div className="flex justify-between border-b border-slate-50 pb-2">
                <span>Tempo Médio para Conclusão de Reparo:</span>
                <span className="font-bold text-brand-dark">28.2 horas</span>
              </div>
              <div className="flex justify-between">
                <span>Taxa de Aprovação de Orçamentos:</span>
                <span className="font-bold text-brand-clinical">88.5%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
