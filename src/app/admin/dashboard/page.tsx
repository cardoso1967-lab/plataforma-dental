import React from 'react';
import { StatusCard } from '@/components/ui/StatusCard';
import { 
  TrendingUp, 
  Wrench, 
  Users, 
  ShieldCheck, 
  AlertCircle 
} from 'lucide-react';

export default function AdminDashboardPage() {
  const recentOrders = [
    { id: 'PV-0042', client: 'Clínica Sorriso Lindo', value: 24500.00, date: '08/06/2026', status: 'Aprovado' },
    { id: 'PV-0041', client: 'Dr. Roberto Santos', value: 8900.00, date: '07/06/2026', status: 'Pendente' },
    { id: 'PV-0040', client: 'OdontoClinic Paulista', value: 1150.00, date: '06/06/2026', status: 'Faturado' },
  ];

  const urgentOS = [
    { id: 'OS-0892', equipment: 'Autoclave Digital 12L', client: 'Dra. Sandra Melo', priority: 'urgente', status: 'aberta' },
    { id: 'OS-0890', equipment: 'Cadeira Premium S500', client: 'Dr. Roberto Santos', priority: 'alta', status: 'em_atendimento' },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome & Info */}
      <div className="space-y-1">
        <h1 className="text-2xl font-extrabold text-brand-dark tracking-tight">
          Painel Administrativo
        </h1>
        <p className="text-xs text-slate-500 font-medium">
          Monitore as vendas, ordens de serviço e atendimentos técnicos da Plataforma Dental.
        </p>
      </div>

      {/* Grid de Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatusCard
          title="Faturamento Mensal"
          value="R$ 72.850,00"
          description="+14% em relação ao mês anterior"
          icon={<TrendingUp className="w-5 h-5" />}
          variant="clinical"
        />
        <StatusCard
          title="OS em Andamento"
          value="18 chamados"
          description="5 sem técnico atribuído"
          icon={<Wrench className="w-5 h-5" />}
          variant="alert"
        />
        <StatusCard
          title="Técnicos Ativos"
          value="12 credenciados"
          description="9 em campo hoje"
          icon={<ShieldCheck className="w-5 h-5" />}
          variant="success"
        />
        <StatusCard
          title="Novos Clientes"
          value="45 cadastros"
          description="Este mês"
          icon={<Users className="w-5 h-5" />}
          variant="light"
        />
      </div>

      {/* Section Tables */}
      <div className="grid lg:grid-cols-2 gap-6">
        
        {/* Ultimos pedidos de venda */}
        <div className="bg-white rounded-xl border border-slate-100 p-5 space-y-4 shadow-xs">
          <div className="flex justify-between items-center border-b border-slate-50 pb-3">
            <h3 className="font-bold text-sm text-brand-dark">Últimos Pedidos de Venda</h3>
            <span className="text-[10px] text-slate-400 font-bold">Ver todos</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="text-slate-400 font-bold border-b border-slate-100">
                  <th className="pb-2">Pedido</th>
                  <th className="pb-2">Cliente</th>
                  <th className="pb-2 text-right">Valor</th>
                  <th className="pb-2 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-2.5 font-bold text-brand-clinical">{order.id}</td>
                    <td className="py-2.5 font-semibold text-slate-700">{order.client}</td>
                    <td className="py-2.5 text-right font-bold text-brand-dark">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(order.value)}
                    </td>
                    <td className="py-2.5 text-center">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        order.status === 'Aprovado' ? 'bg-emerald-50 text-emerald-700' :
                        order.status === 'Faturado' ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* OS críticas */}
        <div className="bg-white rounded-xl border border-slate-100 p-5 space-y-4 shadow-xs">
          <div className="flex justify-between items-center border-b border-slate-50 pb-3">
            <h3 className="font-bold text-sm text-brand-dark flex items-center gap-1.5">
              <AlertCircle className="w-4.5 h-4.5 text-rose-500 animate-pulse" />
              OS Críticas Pendentes
            </h3>
            <span className="text-[10px] text-slate-400 font-bold">Ver fila</span>
          </div>

          <div className="space-y-2.5">
            {urgentOS.map((os) => (
              <div 
                key={os.id} 
                className="flex items-center justify-between p-3 rounded-lg border border-slate-50 hover:bg-slate-50/30 transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-brand-dark">{os.equipment}</span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-md ${
                      os.priority === 'urgente' ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-amber-50 text-amber-700'
                    }`}>
                      {os.priority}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-semibold">{os.client} | {os.id}</p>
                </div>
                
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                  os.status === 'aberta' ? 'bg-blue-50 text-blue-700' : 'bg-sky-50 text-sky-700'
                }`}>
                  {os.status === 'aberta' ? 'Aberta' : 'Em Atendimento'}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
