'use client';

import React from 'react';
import { MobileButton } from '@/components/ui/MobileButton';
import { Mail, MapPin, Phone, HelpCircle } from 'lucide-react';

export default function ContactPage() {
  return (
    <div className="py-12 bg-slate-50 flex-1">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Title */}
        <div className="text-center space-y-3 max-w-xl mx-auto">
          <span className="text-xs font-bold text-brand-clinical uppercase tracking-wider block">
            Fale Conosco
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-brand-dark tracking-tight">
            Contato Comercial
          </h1>
          <p className="text-sm text-slate-500">
            Dúvidas sobre produtos, negociações ou parcerias? Envie uma mensagem para nosso time de consultores.
          </p>
        </div>

        {/* Content grid */}
        <div className="grid md:grid-cols-5 gap-8">
          
          {/* Form */}
          <div className="md:col-span-3 bg-white rounded-2xl border border-slate-100 p-6 space-y-5 shadow-xs">
            <h3 className="text-lg font-bold text-brand-dark flex items-center gap-2">
              <Mail className="w-5 h-5 text-brand-clinical" />
              Enviar Mensagem
            </h3>

            <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Nome Completo</label>
                <input 
                  type="text" 
                  placeholder="Seu nome"
                  className="w-full text-xs border border-slate-200 rounded-lg p-3 focus:outline-none focus:ring-1 focus:ring-brand-clinical bg-slate-50/50" 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">E-mail</label>
                  <input 
                    type="email" 
                    placeholder="email@exemplo.com"
                    className="w-full text-xs border border-slate-200 rounded-lg p-3 focus:outline-none focus:ring-1 focus:ring-brand-clinical bg-slate-50/50" 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Telefone / WhatsApp</label>
                  <input 
                    type="tel" 
                    placeholder="(00) 00000-0000"
                    className="w-full text-xs border border-slate-200 rounded-lg p-3 focus:outline-none focus:ring-1 focus:ring-brand-clinical bg-slate-50/50" 
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Assunto</label>
                <select className="w-full text-xs border border-slate-200 rounded-lg p-3 focus:outline-none focus:ring-1 focus:ring-brand-clinical bg-slate-50/50">
                  <option>Cotação de Equipamento Novo</option>
                  <option>Parceria Comercial</option>
                  <option>Outros Assuntos</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Sua Mensagem</label>
                <textarea 
                  rows={4}
                  placeholder="Escreva sua dúvida ou solicitação comercial aqui..."
                  className="w-full text-xs border border-slate-200 rounded-lg p-3 focus:outline-none focus:ring-1 focus:ring-brand-clinical bg-slate-50/50" 
                />
              </div>

              <MobileButton variant="primary" type="button">
                Enviar Mensagem
              </MobileButton>
            </form>
          </div>

          {/* Sidebar / Info */}
          <div className="md:col-span-2 space-y-6">
            
            {/* Info Card */}
            <div className="bg-slate-900 text-white rounded-2xl p-6 space-y-5">
              <h4 className="font-bold text-sm">Informações Gerais</h4>
              
              <div className="space-y-4 text-xs">
                <div className="flex gap-3 items-start">
                  <Phone className="w-4 h-4 text-sky-400 mt-0.5" />
                  <div>
                    <h5 className="font-bold text-slate-300">Central de Vendas</h5>
                    <p className="text-[11px] text-slate-400">0800-456-7890</p>
                  </div>
                </div>

                <div className="flex gap-3 items-start">
                  <Mail className="w-4 h-4 text-sky-400 mt-0.5" />
                  <div>
                    <h5 className="font-bold text-slate-300">E-mail Comercial</h5>
                    <p className="text-[11px] text-slate-400">vendas@plataformadental.com.br</p>
                  </div>
                </div>

                <div className="flex gap-3 items-start">
                  <MapPin className="w-4 h-4 text-sky-400 mt-0.5" />
                  <div>
                    <h5 className="font-bold text-slate-300">Sede Corporativa</h5>
                    <p className="text-[11px] text-slate-400">Av. Paulista, 1000 - Bela Vista - São Paulo / SP</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick help */}
            <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-3">
              <h4 className="font-bold text-sm text-brand-dark flex items-center gap-2">
                <HelpCircle className="w-4.5 h-4.5 text-brand-clinical" />
                Precisa de ajuda rápida?
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Acesse a aba de Suporte Técnico caso seu problema seja operacional ou de quebra de algum equipamento odontológico.
              </p>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
