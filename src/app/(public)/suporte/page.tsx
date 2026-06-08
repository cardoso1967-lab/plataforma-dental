'use client';

import React from 'react';
import { MobileButton } from '@/components/ui/MobileButton';
import { Wrench, PhoneCall, HelpCircle, CheckCircle2 } from 'lucide-react';

export default function SupportPage() {
  return (
    <div className="py-12 bg-slate-50 flex-1">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Intro */}
        <div className="text-center space-y-3 max-w-xl mx-auto">
          <span className="text-xs font-bold text-brand-clinical uppercase tracking-wider block">
            Assistência Técnica Especializada
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-brand-dark tracking-tight">
            Suporte e Conserto de Equipamentos
          </h1>
          <p className="text-sm text-slate-500">
            Abra chamados para manutenções corretivas, preventivas ou calibração de equipamentos odontológicos.
          </p>
        </div>

        {/* Layout de Form + Cards */}
        <div className="grid md:grid-cols-5 gap-8">
          
          {/* Form */}
          <div className="md:col-span-3 bg-white rounded-2xl border border-slate-100 p-6 space-y-5 shadow-xs">
            <h3 className="text-lg font-bold text-brand-dark flex items-center gap-2">
              <Wrench className="w-5 h-5 text-brand-clinical" />
              Solicitar Assistência Rápida
            </h3>

            <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Nome Completo</label>
                  <input 
                    type="text" 
                    placeholder="Dr(a). Nome"
                    className="w-full text-xs border border-slate-200 rounded-lg p-3 focus:outline-none focus:ring-1 focus:ring-brand-clinical bg-slate-50/50" 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">WhatsApp / Telefone</label>
                  <input 
                    type="tel" 
                    placeholder="(00) 00000-0000"
                    className="w-full text-xs border border-slate-200 rounded-lg p-3 focus:outline-none focus:ring-1 focus:ring-brand-clinical bg-slate-50/50" 
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">E-mail</label>
                <input 
                  type="email" 
                  placeholder="exemplo@clinica.com"
                  className="w-full text-xs border border-slate-200 rounded-lg p-3 focus:outline-none focus:ring-1 focus:ring-brand-clinical bg-slate-50/50" 
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Equipamento com Defeito</label>
                <input 
                  type="text" 
                  placeholder="Ex: Cadeira S500, Autoclave 12L..."
                  className="w-full text-xs border border-slate-200 rounded-lg p-3 focus:outline-none focus:ring-1 focus:ring-brand-clinical bg-slate-50/50" 
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Descrição do Problema</label>
                <textarea 
                  rows={4}
                  placeholder="Descreva detalhadamente o comportamento ou erro apresentado..."
                  className="w-full text-xs border border-slate-200 rounded-lg p-3 focus:outline-none focus:ring-1 focus:ring-brand-clinical bg-slate-50/50" 
                />
              </div>

              <MobileButton variant="primary" type="button">
                Enviar Solicitação
              </MobileButton>
            </form>
          </div>

          {/* Sidebar / Info */}
          <div className="md:col-span-2 space-y-6">
            
            {/* Quick Contact Card */}
            <div className="bg-slate-900 text-white rounded-2xl p-6 space-y-4">
              <h4 className="font-bold text-sm flex items-center gap-2">
                <PhoneCall className="w-4.5 h-4.5 text-sky-400" />
                Canais de Emergência
              </h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Seu consultório possui uma urgência que impede o atendimento de pacientes? Fale direto por telefone.
              </p>
              <div className="space-y-2 pt-2 text-xs">
                <div className="flex justify-between border-b border-slate-800 pb-1.5">
                  <span className="text-slate-400">Telefone / Central:</span>
                  <span className="font-bold">0800-123-4567</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">WhatsApp Técnico:</span>
                  <span className="font-bold text-emerald-400">(11) 99999-8888</span>
                </div>
              </div>
            </div>

            {/* How it works */}
            <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-4">
              <h4 className="font-bold text-sm text-brand-dark flex items-center gap-2">
                <HelpCircle className="w-4.5 h-4.5 text-brand-clinical" />
                Como funciona?
              </h4>
              <ul className="space-y-3 text-xs">
                <li className="flex items-start gap-2 text-slate-600">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <span><strong>1. Envio dos Dados:</strong> Você preenche a ficha descrevendo a falha.</span>
                </li>
                <li className="flex items-start gap-2 text-slate-600">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <span><strong>2. Análise Técnica:</strong> Nossa equipe avalia e cria a ordem de serviço.</span>
                </li>
                <li className="flex items-start gap-2 text-slate-600">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <span><strong>3. Agendamento:</strong> Agendamos uma data via WhatsApp para o técnico ir ao consultório.</span>
                </li>
              </ul>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
