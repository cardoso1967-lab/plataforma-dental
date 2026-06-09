'use client';

import React, { useEffect, useState } from 'react';
import { StatusCard } from '@/components/ui/StatusCard';
import { 
  TrendingUp, Wrench, Users, ShieldCheck, AlertCircle, 
  Clock, Calendar, FileText, ArrowRight, UserPlus, ClipboardList, Info, Package
} from 'lucide-react';
import Link from 'next/link';
import { createSupabaseBrowserClient } from '@/lib/supabase';
import { useAuth } from '@/components/AuthProvider';

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
      <div className="bg-gradient-to-br from-slate-900 via-sky-950 to-slate-950 text-white rounded-3xl p-6 md:p-8 shadow-lg relative overflow-hidden border border-slate-800">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-[0.03] pointer-events-none hidden md:block">
          <Wrench className="w-full h-full text-white scale-150 rotate-12" />
        </div>
        <div className="absolute -left-12 -top-12 w-48 h-48 bg-sky-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-brand-clinical/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <span className="text-[10px] font-extrabold text-sky-400 uppercase tracking-widest bg-sky-500/10 px-2.5 py-1 rounded-full border border-sky-500/20 inline-block">
              Painel Administrativo Executivo
            </span>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight bg-gradient-to-r from-white via-slate-100 to-sky-100 bg-clip-text text-transparent">
              Visão Geral do Negócio
            </h1>
            <p className="text-xs text-slate-300 font-medium leading-relaxed max-w-2xl">
              Monitore a saúde financeira, o andamento das ordens de serviço críticas e o desempenho operacional dos técnicos em tempo real.
            </p>
          </div>
          <div className="bg-white/5 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/10 text-left md:text-right self-start md:self-center shadow-inner">
            <span className="text-[9px] text-sky-300 font-extrabold block uppercase tracking-wider">Hoje é</span>
            <span className="text-xs font-extrabold text-white">
              {new Date().toLocaleDateString('pt-BR', { dateStyle: 'full' })}
            </span>
          </div>
        </div>
      </div>

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
          <div className="space-y-3.5">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider pl-1">
              Ações Rápidas Operacionais
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link 
                href="/admin/ordens-servico" 
                className="bg-white hover:bg-slate-50/50 border border-slate-100/80 p-5 rounded-2xl flex items-center gap-4 transition-all duration-300 shadow-xs hover:shadow-md hover:-translate-y-0.5 active:scale-[0.99] group"
              >
                <div className="w-11 h-11 rounded-xl bg-sky-50/80 text-brand-clinical flex items-center justify-center group-hover:bg-brand-clinical group-hover:text-white transition-all duration-300 shadow-2xs">
                  <Wrench className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <p className="text-xs font-extrabold text-slate-800">Criar Nova OS</p>
                  <p className="text-[10px] text-slate-400 font-medium leading-normal">Cadastrar chamado técnico</p>
                </div>
              </Link>

              <Link 
                href="/admin/clientes" 
                className="bg-white hover:bg-slate-50/50 border border-slate-100/80 p-5 rounded-2xl flex items-center gap-4 transition-all duration-300 shadow-xs hover:shadow-md hover:-translate-y-0.5 active:scale-[0.99] group"
              >
                <div className="w-11 h-11 rounded-xl bg-emerald-50/80 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300 shadow-2xs">
                  <Users className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <p className="text-xs font-extrabold text-slate-800">Novo Cliente</p>
                  <p className="text-[10px] text-slate-400 font-medium leading-normal">Registrar clínica ou dentista</p>
                </div>
              </Link>

              <Link 
                href="/admin/produtos" 
                className="bg-white hover:bg-slate-50/50 border border-slate-100/80 p-5 rounded-2xl flex items-center gap-4 transition-all duration-300 shadow-xs hover:shadow-md hover:-translate-y-0.5 active:scale-[0.99] group"
              >
                <div className="w-11 h-11 rounded-xl bg-purple-50/80 text-purple-600 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-all duration-300 shadow-2xs">
                  <Package className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <p className="text-xs font-extrabold text-slate-800">Novo Produto</p>
                  <p className="text-[10px] text-slate-400 font-medium leading-normal">Adicionar item ao catálogo</p>
                </div>
              </Link>

              <Link 
                href="/admin/agenda" 
                className="bg-white hover:bg-slate-50/50 border border-slate-100/80 p-5 rounded-2xl flex items-center gap-4 transition-all duration-300 shadow-xs hover:shadow-md hover:-translate-y-0.5 active:scale-[0.99] group"
              >
                <div className="w-11 h-11 rounded-xl bg-indigo-50/80 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300 shadow-2xs">
                  <Calendar className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <p className="text-xs font-extrabold text-slate-800">Agenda Kanban</p>
                  <p className="text-[10px] text-slate-400 font-medium leading-normal">Quadro geral de status</p>
                </div>
              </Link>
            </div>
          </div>

          {/* Grid de Indicadores Principais Premium */}
          <div className="space-y-3.5 pt-2">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider pl-1">
              Indicadores de Desempenho SaaS
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-2xl border border-slate-100/80 p-5 flex items-center justify-between shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 group">
                <div className="space-y-1">
                  <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest block">Receita Mensal</span>
                  <h3 className="text-lg font-black text-slate-900 tracking-tight">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(metrics.billingMonthly)}
                  </h3>
                  <p className="text-[9px] text-emerald-600 font-extrabold flex items-center gap-0.5">
                    <TrendingUp className="w-3 h-3" /> Faturamento deste mês
                  </p>
                </div>
                <div className="w-11 h-11 rounded-xl bg-sky-50 text-brand-clinical flex items-center justify-center group-hover:bg-brand-clinical group-hover:text-white transition-colors duration-300">
                  <TrendingUp className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-100/80 p-5 flex items-center justify-between shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 group">
                <div className="space-y-1">
                  <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest block">Atendimentos Ativos</span>
                  <h3 className="text-lg font-black text-slate-900 tracking-tight">{metrics.activeOS} chamados</h3>
                  <p className="text-[9px] text-amber-600 font-extrabold">{metrics.noTechOS} aguardando técnico</p>
                </div>
                <div className="w-11 h-11 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center group-hover:bg-orange-600 group-hover:text-white transition-colors duration-300">
                  <Wrench className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-100/80 p-5 flex items-center justify-between shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 group">
                <div className="space-y-1">
                  <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest block">Equipe de Campo</span>
                  <h3 className="text-lg font-black text-slate-900 tracking-tight">{metrics.activeTechs} técnicos</h3>
                  <p className="text-[9px] text-emerald-600 font-extrabold">Operando em campo</p>
                </div>
                <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-300">
                  <ShieldCheck className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-100/80 p-5 flex items-center justify-between shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 group">
                <div className="space-y-1">
                  <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest block">Clientes Cadastrados</span>
                  <h3 className="text-lg font-black text-slate-900 tracking-tight">{metrics.totalCustomers} clínicas</h3>
                  <p className="text-[9px] text-slate-500 font-extrabold">Consultórios credenciados</p>
                </div>
                <div className="w-11 h-11 rounded-xl bg-slate-50 text-slate-600 flex items-center justify-center group-hover:bg-slate-600 group-hover:text-white transition-colors duration-300">
                  <Users className="w-5 h-5" />
                </div>
              </div>
            </div>
          </div>

          {/* Grid de Alertas Críticos Premium */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
            <div className="bg-amber-50/40 hover:bg-amber-50/60 rounded-2xl p-5 border border-amber-100/80 flex items-center justify-between shadow-2xs transition-all duration-300">
              <div className="space-y-1 text-left">
                <span className="text-[9px] font-extrabold text-amber-500 uppercase tracking-widest block">Sem Técnico Designado</span>
                <h3 className="text-lg font-black text-amber-700">{metrics.noTechOS} chamados</h3>
                <p className="text-[9px] text-amber-600/80 font-bold">Pendente delegação de equipe</p>
              </div>
              <div className="bg-amber-100 text-amber-700 p-2.5 rounded-xl shadow-2xs">
                <UserPlus className="w-4 h-4 animate-bounce" />
              </div>
            </div>

            <div className="bg-rose-50/40 hover:bg-rose-50/60 rounded-2xl p-5 border border-rose-100/80 flex items-center justify-between shadow-2xs transition-all duration-300">
              <div className="space-y-1 text-left">
                <span className="text-[9px] font-extrabold text-rose-500 uppercase tracking-widest block">Chamados Urgentes</span>
                <h3 className="text-lg font-black text-rose-700">{metrics.urgentOSCount} chamados</h3>
                <p className="text-[9px] text-rose-600/80 font-bold">Requer atenção operacional imediata</p>
              </div>
              <div className="bg-rose-100 text-rose-700 p-2.5 rounded-xl shadow-2xs">
                <AlertCircle className="w-4 h-4 text-rose-600 animate-pulse" />
              </div>
            </div>

            <div className="bg-slate-50/50 hover:bg-slate-50 rounded-2xl p-5 border border-slate-200/60 flex items-center justify-between shadow-2xs transition-all duration-300">
              <div className="space-y-1 text-left">
                <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-widest block">Visitas Agendadas Hoje</span>
                <h3 className="text-lg font-black text-slate-800">{metrics.todayVisits} visitas</h3>
                <p className="text-[9px] text-slate-600/80 font-bold">Roteiro operacional ativo</p>
              </div>
              <div className="bg-slate-100 text-slate-600 p-2.5 rounded-xl shadow-2xs">
                <Calendar className="w-4 h-4" />
              </div>
            </div>

            <div className="bg-indigo-50/40 hover:bg-indigo-50/60 rounded-2xl p-5 border border-indigo-100/80 flex items-center justify-between shadow-2xs transition-all duration-300">
              <div className="space-y-1 text-left">
                <span className="text-[9px] font-extrabold text-indigo-500 uppercase tracking-widest block">Orçamentos Aguardando</span>
                <h3 className="text-lg font-black text-indigo-700">{metrics.pendingQuotes} propostas</h3>
                <p className="text-[9px] text-indigo-600/80 font-bold">Propostas comerciais pendentes</p>
              </div>
              <div className="bg-indigo-100 text-indigo-700 p-2.5 rounded-xl shadow-2xs">
                <FileText className="w-4 h-4" />
              </div>
            </div>
          </div>
        </>
      )}

      {/* Seções de Tablas y Listados Premium */}
      <div className="grid lg:grid-cols-2 gap-6 pt-2">
        {/* Últimos Pedidos de Venda */}
        <div className="bg-white rounded-3xl border border-slate-100/80 p-6 space-y-5 shadow-xs">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4">
            <div className="space-y-0.5 text-left">
              <h3 className="font-extrabold text-sm text-slate-800">Últimos Pedidos de Venda</h3>
              <p className="text-[10px] text-slate-400 font-semibold">Monitoramento de vendas recentes no mês</p>
            </div>
            <Link 
              href="/admin/pedidos-venda"
              className="text-[10px] text-brand-clinical font-extrabold hover:underline flex items-center gap-0.5 bg-sky-50/80 hover:bg-sky-50 px-3 py-1.5 rounded-xl border border-sky-100 transition-colors"
            >
              Ver todos <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto no-scrollbar">
            {recentSales.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs italic font-semibold border-2 border-dashed border-slate-100 rounded-2xl bg-slate-50/10">
                Nenhum pedido de venda recente.
              </div>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="text-slate-400 font-extrabold border-b border-slate-100 bg-slate-50/30 rounded-xl">
                    <th className="pb-3 pt-2 pl-3">ID Pedido</th>
                    <th className="pb-3 pt-2 px-2">Cliente / Razão</th>
                    <th className="pb-3 pt-2 text-right">Valor Total</th>
                    <th className="pb-3 pt-2 text-center pr-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {recentSales.map((order) => (
                    <tr key={order.id} className="hover:bg-slate-50/30 transition-all duration-200">
                      <td className="py-4 pl-3 font-mono font-bold text-brand-clinical">
                        #{order.id.substring(0, 8).toUpperCase()}
                      </td>
                      <td className="py-4 px-2 font-bold text-slate-700">
                        {order.customer?.company_name || 'Cliente'}
                      </td>
                      <td className="py-4 text-right font-black text-slate-900">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(order.total_amount)}
                      </td>
                      <td className="py-4 text-center pr-3">
                        <span className={`text-[9px] font-extrabold px-3 py-1 rounded-full border uppercase tracking-wider shadow-2xs ${
                          order.status === 'aprovado' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          order.status === 'faturado' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-amber-50 text-amber-700 border-amber-200'
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
        <div className="bg-white rounded-3xl border border-slate-100/80 p-6 space-y-5 shadow-xs">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4">
            <div className="space-y-0.5 text-left">
              <h3 className="font-extrabold text-sm text-slate-800 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-rose-500 animate-pulse" />
                OS Críticas Pendentes ({criticalOS.length})
              </h3>
              <p className="text-[10px] text-slate-400 font-semibold">Chamados de emergência sob monitoramento</p>
            </div>
            <Link 
              href="/admin/ordens-servico"
              className="text-[10px] text-brand-clinical font-extrabold hover:underline flex items-center gap-0.5 bg-sky-50/80 hover:bg-sky-50 px-3 py-1.5 rounded-xl border border-sky-100 transition-colors"
            >
              Ver fila <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3.5">
            {criticalOS.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs italic font-semibold border-2 border-dashed border-slate-100 rounded-2xl bg-slate-50/10">
                Nenhuma OS crítica pendente no momento.
              </div>
            ) : (
              criticalOS.map((os) => (
                <div 
                  key={os.id} 
                  className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50/20 transition-all duration-300 bg-slate-50/10 shadow-2xs hover:shadow-xs"
                >
                  <div className="space-y-1.5 text-left">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-extrabold text-xs text-slate-800">
                        {os.equipment?.name || 'Equipamento'}
                      </span>
                      <span className={`text-[8px] font-black px-2 py-0.5 rounded-md border uppercase tracking-wider ${
                        os.priority === 'urgente' ? 'bg-rose-500 text-white border-rose-600 animate-pulse' : 'bg-orange-50 text-orange-700 border-orange-200'
                      }`}>
                        {os.priority}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 font-semibold">
                      {os.customer?.company_name} • <span className="font-mono text-brand-clinical font-bold">#{os.id.substring(0, 8).toUpperCase()}</span>
                    </p>
                  </div>
                  
                  <span className={`text-[9px] font-extrabold px-3 py-1 rounded-full border uppercase tracking-wider shadow-2xs ${
                    os.status === 'aberta' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-sky-50 text-sky-700 border-sky-200'
                  }`}>
                    {os.status === 'aberta' ? 'Aberta' : 'Em Campo'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
