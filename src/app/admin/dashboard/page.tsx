'use client';

import React, { useEffect, useState } from 'react';
import { PageHero } from '@/components/ui/PageHero';
import { MetricCard } from '@/components/ui/MetricCard';
import { ActionCard } from '@/components/ui/ActionCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { 
  TrendingUp, Wrench, Users, ShieldCheck, AlertCircle, 
  Clock, Calendar, FileText, ArrowRight, UserPlus, ClipboardList, Info, Package
} from 'lucide-react';
import Link from 'next/link';
import { createSupabaseBrowserClient } from '@/lib/supabase';
import { useAuth } from '@/components/AuthProvider';
import { getCustomerDisplayName } from '@/lib/customer-utils';


interface SalesOrder {
  id: string;
  total_amount: number;
  status: string;
  created_at: string;
  customer?: {
    company_name: string;
  } | null;
}

interface ServiceOrder {
  id: string;
  priority: string;
  status: string;
  created_at: string;
  description: string;
  scheduled_date: string | null;
  technician_id?: string | null;
  customer?: {
    company_name: string;
  } | null;
  equipment?: {
    name: string;
  } | null;
}

export default function AdminDashboardPage() {
  const supabase = createSupabaseBrowserClient();
  const { profile } = useAuth();

  // Estados de datos
  const [metrics, setMetrics] = useState({
    billingMonthly: 0,
    activeOS: 0,
    activeTechs: 0,
    totalCustomers: 0,
    noTechOS: 0,
    urgentOSCount: 0,
    todayVisits: 0,
    pendingQuotes: 0,
  });

  const [recentSales, setRecentSales] = useState<SalesOrder[]>([]);
  const [criticalOS, setCriticalOS] = useState<ServiceOrder[]>([]);
  const [loading, setLoading] = useState(true);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // 1. Cargar Órdenes de Servicio
      const { data: osData } = await supabase
        .from('service_orders')
        .select(`
          id, priority, status, created_at, description, scheduled_date, technician_id,
          customer:customers(company_name),
          equipment:client_equipment(name)
        `);

      const allOS = osData || [];
      
      const activeOS = allOS.filter(os => os.status !== 'concluida' && os.status !== 'cancelada');
      const noTechOS = activeOS.filter(os => !os.technician_id);
      const urgentOS = activeOS.filter(os => os.priority === 'urgente');
      const pendingQuotes = activeOS.filter(os => os.status === 'orcamento_pendente');

      // Calcular visitas de hoy
      const todayStr = new Date().toDateString();
      const todayVisits = activeOS.filter(os => {
        if (!os.scheduled_date) return false;
        return new Date(os.scheduled_date).toDateString() === todayStr;
      }).length;

      // 2. Cargar Técnicos Activos
      const { count: techCount } = await supabase
        .from('technicians')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      // 3. Cargar total de Clientes
      const { count: clientCount } = await supabase
        .from('customers')
        .select('*', { count: 'exact', head: true });

      // 4. Cargar Pedidos de Venta para facturación y tabla de recientes
      const { data: salesData } = await supabase
        .from('sales_orders')
        .select(`
          id, total_amount, status, created_at,
          customer:customers(company_name)
        `)
        .order('created_at', { ascending: false });

      const allSales = salesData || [];
      
      // Sumar facturación mensual (pedidos aprobados/faturados del mes en curso)
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const billingMonthly = allSales
        .filter(order => {
          const date = new Date(order.created_at);
          return date.getMonth() === currentMonth && 
            date.getFullYear() === currentYear && 
            (order.status === 'aprovado' || order.status === 'faturado');
        })
        .reduce((sum, order) => sum + Number(order.total_amount), 0);

      // Setear métricas
      setMetrics({
        billingMonthly,
        activeOS: activeOS.length,
        activeTechs: techCount || 0,
        totalCustomers: clientCount || 0,
        noTechOS: noTechOS.length,
        urgentOSCount: urgentOS.length,
        todayVisits,
        pendingQuotes: pendingQuotes.length,
      });

      // Últimos 5 pedidos
      setRecentSales(allSales.slice(0, 5) as any[]);

      // OS críticas (activas de prioridad alta o urgente)
      const criticalList = activeOS.filter(os => os.priority === 'urgente' || os.priority === 'alta');
      setCriticalOS(criticalList.slice(0, 5) as any[]);

    } catch (err) {
      console.error('Erro ao processar dados do dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  return (
    <div className="space-y-8 max-w-7xl mx-auto text-left animate-in fade-in duration-300">
      {/* Cabeçalho Executivo Premium */}
      <PageHero
        title={`Olá, ${profile?.name || 'Administrador'}`}
        description="Bem-vindo ao seu painel executivo. Acompanhe a saúde financeira, o andamento das ordens de serviço críticas e o desempenho operacional dos técnicos em tempo real."
        badge="Painel Administrativo Executivo"
        icon={Wrench}
        rightElement={
          <div className="bg-white/5 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/10 text-left md:text-right shadow-inner">
            <span className="text-[9px] text-sky-300 font-extrabold block uppercase tracking-wider">Hoje é</span>
            <span className="text-xs font-extrabold text-white">
              {new Date().toLocaleDateString('pt-BR', { dateStyle: 'full' })}
            </span>
          </div>
        }
      />

      {loading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-white rounded-2xl border border-slate-100 animate-pulse" />
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* Área de Ações Rápidas Premium */}
          <div className="space-y-4">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1 font-mono">
              Ações Rápidas Operacionais
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <ActionCard
                title="Criar Nova OS"
                description="Cadastrar chamado técnico rápido"
                icon={<Wrench className="w-5 h-5 stroke-[2]" />}
                href="/admin/ordens-servico"
                variant="sky"
              />
              <ActionCard
                title="Novo Cliente"
                description="Registrar clínica ou dentista"
                icon={<Users className="w-5 h-5 stroke-[2]" />}
                href="/admin/clientes"
                variant="emerald"
              />
              <ActionCard
                title="Novo Produto"
                description="Adicionar item ao catálogo comercial"
                icon={<Package className="w-5 h-5 stroke-[2]" />}
                href="/admin/produtos"
                variant="purple"
              />
              <ActionCard
                title="Agenda Kanban"
                description="Quadro geral de status e delegações"
                icon={<Calendar className="w-5 h-5 stroke-[2]" />}
                href="/admin/agenda"
                variant="indigo"
              />
            </div>
          </div>

          {/* Grid de Indicadores Principais Premium */}
          <div className="space-y-4 pt-2">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1 font-mono">
              Indicadores de Desempenho SaaS
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard
                title="Receita Mensal"
                value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(metrics.billingMonthly)}
                trend={{ label: 'Faturamento deste mês', type: 'up' }}
                icon={<TrendingUp className="w-5 h-5 text-sky-655 stroke-[2.5]" />}
                variant="default"
              />
              <MetricCard
                title="Atendimentos Ativos"
                value={`${metrics.activeOS} chamados`}
                description={`${metrics.noTechOS} aguardando delegação`}
                icon={<Wrench className="w-5 h-5 text-amber-600 stroke-[2]" />}
                variant="amber"
              />
              <MetricCard
                title="Equipe de Campo"
                value={`${metrics.activeTechs} técnicos`}
                description="Operando ativamente hoje"
                icon={<ShieldCheck className="w-5 h-5 text-emerald-600 stroke-[2]" />}
                variant="emerald"
              />
              <MetricCard
                title="Clientes Cadastrados"
                value={`${metrics.totalCustomers} clínicas`}
                description="Consultórios ativos cadastrados"
                icon={<Users className="w-5 h-5 text-indigo-600 stroke-[2]" />}
                variant="indigo"
              />
            </div>
          </div>

          {/* Grid de Alertas Críticos Premium */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
            <MetricCard
              title="Sem Técnico Designado"
              value={`${metrics.noTechOS} OS`}
              description="Pendentes de equipe"
              icon={<UserPlus className="w-4.5 h-4.5 text-amber-600 stroke-[2]" />}
              variant="amber"
            />
            <MetricCard
              title="Chamados Urgentes"
              value={`${metrics.urgentOSCount} chamados`}
              description="Atenção cirúrgica imediata"
              icon={<AlertCircle className="w-4.5 h-4.5 text-rose-655 stroke-[2]" />}
              variant="rose"
            />
            <MetricCard
              title="Visitas Agendadas Hoje"
              value={`${metrics.todayVisits} visitas`}
              description="Planejamento diário ativo"
              icon={<Calendar className="w-4.5 h-4.5 text-slate-500 stroke-[2]" />}
              variant="default"
            />
            <MetricCard
              title="Orçamentos Pendentes"
              value={`${metrics.pendingQuotes} propostas`}
              description="Aguardando validação do cliente"
              icon={<FileText className="w-4.5 h-4.5 text-indigo-655 stroke-[2]" />}
              variant="indigo"
            />
          </div>

          {/* Saúde Operacional & Próximas Ações */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            {/* Saúde Operacional Card */}
            <div className="md:col-span-1 bg-white border border-slate-200/60 p-4.5 rounded-2xl shadow-3xs flex flex-col justify-between text-left">
              <div>
                <h4 className="font-extrabold text-[10px] text-slate-400 uppercase tracking-widest font-mono">Saúde Operacional</h4>
                <div className="flex items-baseline gap-2 mt-3">
                  <span className="text-xl font-black text-slate-400 leading-none">Ainda não calculada</span>
                </div>
                <p className="text-[10px] text-slate-500 font-semibold mt-2 leading-relaxed">
                  Este indicador será exibido quando houver dados suficientes para cálculo do SLA.
                </p>
              </div>
              <div className="flex items-center gap-2 pt-3 border-t border-slate-100/60 mt-3 text-[9.5px] font-extrabold text-slate-400">
                <div className="w-1.5 h-1.5 bg-slate-300 rounded-full"></div>
                <span>SLA em configuração</span>
              </div>
            </div>

            {/* Próximas Ações Card */}
            <div className="md:col-span-2 bg-white border border-slate-200/60 p-4.5 rounded-2xl shadow-3xs text-left">
              <h4 className="font-extrabold text-[10px] text-slate-400 uppercase tracking-widest font-mono">Próximas Ações Recomendadas</h4>
              
              <div className="mt-3.5 space-y-2.5 text-[11px] font-semibold text-slate-655">
                {metrics.noTechOS > 0 && (
                  <div className="flex items-center gap-2 bg-slate-50/50 p-2 rounded-lg border border-slate-100">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0"></span>
                    <span>Designar técnicos para as <strong className="text-slate-800">{metrics.noTechOS} OS</strong> pendentes de equipe.</span>
                  </div>
                )}
                {metrics.urgentOSCount > 0 && (
                  <div className="flex items-center gap-2 bg-slate-50/50 p-2 rounded-lg border border-slate-100">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0 animate-pulse"></span>
                    <span>Acompanhar com prioridade as <strong className="text-slate-800">{metrics.urgentOSCount} OS urgentes</strong> ativas hoje.</span>
                  </div>
                )}
                {metrics.pendingQuotes > 0 && (
                  <div className="flex items-center gap-2 bg-slate-50/50 p-2 rounded-lg border border-slate-100">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0"></span>
                    <span>Revisar propostas e orçamentos para os <strong className="text-slate-800">{metrics.pendingQuotes} chamados</strong> sob aprovação.</span>
                  </div>
                )}
                {metrics.noTechOS === 0 && metrics.urgentOSCount === 0 && metrics.pendingQuotes === 0 && (
                  <div className="flex items-center gap-2 bg-slate-50/50 p-2 rounded-lg border border-slate-100 text-slate-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                    <span>Tudo resolvido! Sem ações urgentes pendentes de atenção no painel.</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Seções de Tablas y Listados Premium */}
          <div className="grid lg:grid-cols-2 gap-6 pt-2">
            {/* Últimos Pedidos de Venda */}
            <div className="bg-gradient-to-b from-white to-slate-50/35 rounded-3xl border border-slate-200/80 p-6 space-y-5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.02)]">
              <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                <div className="space-y-1 text-left">
                  <h3 className="font-extrabold text-sm text-slate-800 tracking-tight">Últimos Pedidos de Venda</h3>
                  <p className="text-[10px] text-slate-455 font-medium">Monitoramento de transações e contratos comerciais recentes</p>
                </div>
                <Link 
                  href="/admin/pedidos-venda"
                  className="text-[10px] text-sky-655 font-bold hover:underline flex items-center gap-1 bg-sky-50/80 hover:bg-sky-50 px-3 py-1.5 rounded-xl border border-sky-100/40 transition-colors"
                >
                  Ver todos <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
                </Link>
              </div>

              <div className="overflow-x-auto no-scrollbar">
                {recentSales.length === 0 ? (
                  <EmptyState
                    title="Nenhum pedido recente"
                    description="Quando novas ordens de venda forem faturadas ou aprovadas no sistema, elas aparecerão listadas nesta seção."
                    icon={<FileText className="w-6 h-6 text-slate-400" />}
                    actionLabel="Criar Novo Pedido"
                    actionHref="/admin/pedidos-venda"
                  />
                ) : (
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="text-slate-455 font-bold border-b border-slate-100 bg-slate-50/50 rounded-xl">
                        <th className="pb-3.5 pt-2 pl-3 font-mono text-[9px] uppercase tracking-wider">ID Pedido</th>
                        <th className="pb-3.5 pt-2 px-2 font-mono text-[9px] uppercase tracking-wider">Cliente</th>
                        <th className="pb-3.5 pt-2 text-right font-mono text-[9px] uppercase tracking-wider">Valor</th>
                        <th className="pb-3.5 pt-2 text-center pr-3 font-mono text-[9px] uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100/60">
                      {recentSales.map((order) => (
                        <tr key={order.id} className="hover:bg-slate-50/30 transition-colors duration-150">
                          <td className="py-4 pl-3 font-mono font-bold text-sky-600">
                            #{order.id.substring(0, 8).toUpperCase()}
                          </td>
                          <td className="py-4 px-2 font-bold text-slate-700">
                            {getCustomerDisplayName(order.customer)}
                          </td>
                          <td className="py-4 text-right font-extrabold text-slate-900">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(order.total_amount)}
                          </td>
                          <td className="py-4 text-center pr-3">
                            <span className={`text-[8px] font-bold px-2.5 py-0.5 rounded-full border uppercase tracking-wider shadow-3xs font-mono ${
                              order.status === 'aprovado' ? 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20' :
                              order.status === 'faturado' ? 'bg-blue-500/10 text-blue-700 border-blue-500/20' : 'bg-amber-500/10 text-amber-700 border-amber-500/20'
                            }`}>
                              {order.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {/* OS Críticas Pendentes */}
            <div className="bg-gradient-to-b from-white to-slate-50/35 rounded-3xl border border-slate-200/80 p-6 space-y-5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.02)]">
              <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                <div className="space-y-1 text-left">
                  <h3 className="font-extrabold text-sm text-slate-800 flex items-center gap-1.5 tracking-tight">
                    <AlertCircle className="w-4 h-4 text-rose-500 animate-pulse shrink-0 stroke-[2.5]" />
                    OS Críticas Pendentes ({criticalOS.length})
                  </h3>
                  <p className="text-[10px] text-slate-455 font-medium">Alertas de emergência e manutenções prioritárias</p>
                </div>
                <Link 
                  href="/admin/ordens-servico"
                  className="text-[10px] text-sky-655 font-bold hover:underline flex items-center gap-1 bg-sky-50/80 hover:bg-sky-50 px-3 py-1.5 rounded-xl border border-sky-100/40 transition-colors"
                >
                  Ver fila <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
                </Link>
              </div>

              <div className="space-y-3">
                {criticalOS.length === 0 ? (
                  <EmptyState
                    title="Tudo sob controle"
                    description="Não existem ordens de serviço de prioridade alta ou urgente pendentes no momento. A operação está estável."
                    icon={<ShieldCheck className="w-6 h-6 text-emerald-600" />}
                  />
                ) : (
                  criticalOS.map((os) => (
                    <div 
                      key={os.id} 
                      className="flex items-center justify-between p-4 rounded-2xl border border-slate-200/60 hover:border-slate-350 hover:bg-gradient-to-br hover:from-white hover:to-slate-50/10 transition-all duration-300 bg-white shadow-3xs"
                    >
                      <div className="space-y-1.5 text-left">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-xs text-slate-800">
                            {os.equipment?.name || 'Equipamento não especificado'}
                          </span>
                          <span className={`text-[8px] font-bold px-2 py-0.5 rounded-md border uppercase tracking-wider font-mono ${
                            os.priority === 'urgente' ? 'bg-rose-500/10 text-rose-700 border-rose-500/20 animate-pulse' : 'bg-amber-500/10 text-amber-700 border-amber-500/20'
                          }`}>
                            {os.priority}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-455 font-medium">
                          {getCustomerDisplayName(os.customer)} • <span className="font-mono text-sky-600 font-bold">#{os.id.substring(0, 8).toUpperCase()}</span>
                        </p>
                      </div>
                      
                      <span className={`text-[8px] font-bold px-2.5 py-0.5 rounded-full border uppercase tracking-wider font-mono shadow-3xs ${
                        os.status === 'aberta' ? 'bg-sky-500/10 text-sky-700 border-sky-500/20' : 'bg-indigo-500/10 text-indigo-700 border-indigo-500/20'
                      }`}>
                        {os.status === 'aberta' ? 'Aberta' : 'Em Campo'}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

