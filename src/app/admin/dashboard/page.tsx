'use client';

import React, { useEffect, useState } from 'react';
import { StatusCard } from '@/components/ui/StatusCard';
import { 
  TrendingUp, Wrench, Users, ShieldCheck, AlertCircle, 
  Clock, Calendar, FileText, ArrowRight, UserPlus, ClipboardList, Info
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
    <div className="space-y-8">
      {/* Welcome & Info */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-extrabold text-brand-dark tracking-tight">
            Painel Operacional
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Monitore as vendas, ordens de serviço e atendimentos técnicos da Plataforma Dental.
          </p>
        </div>
        <div className="flex gap-2">
          <Link 
            href="/admin/agenda"
            className="bg-brand-clinical hover:bg-sky-700 text-white text-xs font-bold px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Calendar className="w-4 h-4" /> Agenda Kanban
          </Link>
          <Link 
            href="/admin/ordens-servico"
            className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Wrench className="w-4 h-4" /> Criar OS
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-white rounded-2xl border border-slate-100 animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          {/* Grid de Métricas Principales */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatusCard
              title="Faturamento Mensal"
              value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(metrics.billingMonthly)}
              description="Aprovados ou faturados este mês"
              icon={<TrendingUp className="w-5 h-5" />}
              variant="clinical"
            />
            <StatusCard
              title="OS em Andamento"
              value={`${metrics.activeOS} chamados`}
              description={`${metrics.noTechOS} sem técnico atribuído`}
              icon={<Wrench className="w-5 h-5" />}
              variant="alert"
            />
            <StatusCard
              title="Técnicos Ativos"
              value={`${metrics.activeTechs} credenciados`}
              description="Disponíveis para visitas"
              icon={<ShieldCheck className="w-5 h-5" />}
              variant="success"
            />
            <StatusCard
              title="Novos Clientes"
              value={`${metrics.totalCustomers} cadastrados`}
              description="Total na plataforma"
              icon={<Users className="w-5 h-5" />}
              variant="light"
            />
          </div>

          {/* Grid de Métricas Operacionales Especializadas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-slate-100 flex items-center justify-between shadow-xs hover:shadow-md transition-shadow">
              <div className="space-y-1">
                <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest block">Sem Técnico</span>
                <h3 className="text-lg font-black text-amber-600">{metrics.noTechOS} chamados</h3>
                <p className="text-[9px] text-slate-400 font-medium">Aguardando delegação</p>
              </div>
              <div className="bg-amber-50 text-amber-600 p-2.5 rounded-lg">
                <UserPlus className="w-4 h-4" />
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-100 flex items-center justify-between shadow-xs hover:shadow-md transition-shadow">
              <div className="space-y-1">
                <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest block">Urgências Ativas</span>
                <h3 className="text-lg font-black text-rose-600">{metrics.urgentOSCount} chamados</h3>
                <p className="text-[9px] text-slate-400 font-medium">Atenção prioritária</p>
              </div>
              <div className="bg-rose-50 text-rose-600 p-2.5 rounded-lg">
                <ShieldCheck className="w-4 h-4 text-rose-600 animate-pulse" />
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-100 flex items-center justify-between shadow-xs hover:shadow-md transition-shadow">
              <div className="space-y-1">
                <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest block">Visitas de Hoje</span>
                <h3 className="text-lg font-black text-slate-900">{metrics.todayVisits} agendas</h3>
                <p className="text-[9px] text-slate-400 font-medium">Manutenção em campo</p>
              </div>
              <div className="bg-slate-50 text-slate-600 p-2.5 rounded-lg">
                <Calendar className="w-4 h-4" />
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-100 flex items-center justify-between shadow-xs hover:shadow-md transition-shadow">
              <div className="space-y-1">
                <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest block">Orçamentos Pendentes</span>
                <h3 className="text-lg font-black text-indigo-600">{metrics.pendingQuotes} propostas</h3>
                <p className="text-[9px] text-slate-400 font-medium">Aguardando aprovação</p>
              </div>
              <div className="bg-indigo-50 text-indigo-600 p-2.5 rounded-lg">
                <FileText className="w-4 h-4" />
              </div>
            </div>
          </div>
        </>
      )}

      {/* Section Tables */}
      <div className="grid lg:grid-cols-2 gap-6">
        
        {/* Ultimos pedidos de venda */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4 shadow-sm">
          <div className="flex justify-between items-center border-b border-slate-50 pb-3">
            <h3 className="font-bold text-sm text-brand-dark">Últimos Pedidos de Venda</h3>
            <Link 
              href="/admin/pedidos-venda"
              className="text-[10px] text-brand-clinical font-bold hover:underline flex items-center gap-0.5"
            >
              Ver todos <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="overflow-x-auto no-scrollbar">
            {recentSales.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs italic">
                Nenhum pedido de venda recente.
              </div>
            ) : (
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
                  {recentSales.map((order) => (
                    <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 font-bold text-brand-clinical">
                        #{order.id.substring(0, 8).toUpperCase()}
                      </td>
                      <td className="py-3 font-semibold text-slate-700">
                        {order.customer?.company_name || 'Cliente'}
                      </td>
                      <td className="py-3 text-right font-bold text-brand-dark">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(order.total_amount)}
                      </td>
                      <td className="py-3 text-center">
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                          order.status === 'aprovado' ? 'bg-success-bg text-success-text' :
                          order.status === 'faturado' ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'
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

        {/* OS críticas */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4 shadow-sm">
          <div className="flex justify-between items-center border-b border-slate-50 pb-3">
            <h3 className="font-bold text-sm text-brand-dark flex items-center gap-1.5">
              <AlertCircle className="w-4.5 h-4.5 text-rose-500 animate-pulse" />
              OS Críticas Pendentes ({criticalOS.length})
            </h3>
            <Link 
              href="/admin/ordens-servico"
              className="text-[10px] text-brand-clinical font-bold hover:underline flex items-center gap-0.5"
            >
              Ver fila <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-2.5">
            {criticalOS.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs italic">
                Nenhuma OS crítica pendente no momento.
              </div>
            ) : (
              criticalOS.map((os) => (
                <div 
                  key={os.id} 
                  className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 hover:bg-slate-50/30 transition-colors bg-slate-50/20"
                >
                  <div className="space-y-1 text-left">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-brand-dark">
                        {os.equipment?.name || 'Equipamento'}
                      </span>
                      <span className={`text-[8px] font-bold px-1.5 py-0.2 rounded-md ${
                        os.priority === 'urgente' ? 'bg-rose-50 text-rose-700 border border-rose-200 animate-pulse' : 'bg-orange-50 text-orange-700'
                      }`}>
                        {os.priority}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 font-semibold">
                      {os.customer?.company_name} | #{os.id.substring(0, 8).toUpperCase()}
                    </p>
                  </div>
                  
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md ${
                    os.status === 'aberta' ? 'bg-blue-50 text-blue-700' : 'bg-sky-50 text-sky-700'
                  }`}>
                    {os.status === 'aberta' ? 'Aberta' : 'Em Atendimento'}
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
