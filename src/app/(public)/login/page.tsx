import React from 'react';
import Link from 'next/link';
import { Stethoscope, User, ShieldAlert, Wrench, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  return (
    <div className="py-12 sm:py-16 bg-slate-50 flex-1 flex flex-col justify-center items-center">
      <div className="max-w-md w-full px-4 space-y-8">
        
        {/* Logo and Intro */}
        <div className="text-center space-y-3">
          <div className="mx-auto bg-brand-clinical text-white p-3 rounded-2xl w-fit shadow-md shadow-sky-500/10">
            <Stethoscope className="w-8 h-8" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-brand-dark tracking-tight">
            Acesse sua Conta
          </h2>
          <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
            Faça login para gerenciar suas compras, agendamentos de assistência técnica ou atendimentos.
          </p>
        </div>

        {/* Simulador de Acessos Rápidos (Demo) */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-6 shadow-sm">
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider text-center">
              Acessos Rápidos de Demonstração
            </h3>

            <div className="grid gap-3">
              {/* Admin */}
              <Link 
                href="/admin/dashboard"
                className="flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:border-brand-clinical hover:bg-slate-50/50 transition-all group active:scale-99"
              >
                <div className="flex items-center gap-3">
                  <div className="bg-slate-900 text-white p-2 rounded-lg">
                    <ShieldAlert className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-brand-dark">Administrador / Staff</h4>
                    <p className="text-[10px] text-slate-400">Dashboard geral, vendas e OS</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-brand-clinical group-hover:translate-x-0.5 transition-all" />
              </Link>

              {/* Técnico */}
              <Link 
                href="/tecnico/dashboard"
                className="flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:border-brand-clinical hover:bg-slate-50/50 transition-all group active:scale-99"
              >
                <div className="flex items-center gap-3">
                  <div className="bg-cyan-50 text-brand-clinical p-2 rounded-lg">
                    <Wrench className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-brand-dark">Técnico de Campo</h4>
                    <p className="text-[10px] text-slate-400">Ver serviços de hoje e agenda mobile</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-brand-clinical group-hover:translate-x-0.5 transition-all" />
              </Link>

              {/* Cliente */}
              <Link 
                href="/cliente/dashboard"
                className="flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:border-brand-clinical hover:bg-slate-50/50 transition-all group active:scale-99"
              >
                <div className="flex items-center gap-3">
                  <div className="bg-emerald-50 text-emerald-600 p-2 rounded-lg">
                    <User className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-brand-dark">Portal do Cliente</h4>
                    <p className="text-[10px] text-slate-400">Acompanhar pedidos e suporte pelo celular</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-brand-clinical group-hover:translate-x-0.5 transition-all" />
              </Link>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
