'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Mail, 
  MapPin, 
  Phone, 
  HelpCircle, 
  MessageCircle, 
  FileText, 
  LayoutGrid, 
  ShieldCheck, 
  CheckCircle2, 
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { MobileButton } from '@/components/ui/MobileButton';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    assunto: 'Cotação de Equipamento Novo',
    mensagem: ''
  });
  const [enviado, setEnviado] = useState(false);

  const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;

  // Lógica dos links de WhatsApp
  const urlSolicitarCotacao = whatsappNumber
    ? `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
        'Olá! Gostaria de solicitar uma cotação para equipamentos odontológicos da M.MUNIZ.'
      )}`
    : '#contato-form';

  const urlFalarEspecialista = whatsappNumber
    ? `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
        'Olá! Gostaria de falar com um especialista sobre os equipamentos odontológicos da M.MUNIZ.'
      )}`
    : '#contato-form';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulação de envio com sucesso
    setEnviado(true);
  };

  const handleScrollToForm = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const href = e.currentTarget.getAttribute('href');
    if (href && href.startsWith('#')) {
      e.preventDefault();
      const targetElement = document.getElementById(href.substring(1));
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  return (
    <div className="bg-slate-50/50 flex-1 flex flex-col">
      {/* 1. Hero Seção Comercial */}
      <section className="bg-gradient-to-b from-slate-900 to-brand-dark text-white py-16 md:py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0284c715_1px,transparent_1px),linear-gradient(to_bottom,#0284c715_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center md:text-left space-y-6">
          <div className="max-w-3xl space-y-4">
            <span className="inline-flex items-center gap-1.5 bg-brand-clinical/20 text-sky-400 text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              Assessoria & Suporte Comercial
            </span>
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight leading-tight">
              Fale com a M.MUNIZ
            </h1>
            <p className="text-sm sm:text-base md:text-lg text-slate-300 max-w-2xl leading-relaxed">
              Conecte-se com nossa equipe para tirar dúvidas sobre equipamentos e produtos odontológicos, solicitar cotações sob medida e receber suporte técnico especializado.
            </p>
          </div>

          {/* Mensagem de confiança destacada */}
          <div className="p-4 bg-white/5 border border-white/10 rounded-2xl max-w-2xl text-xs sm:text-sm text-slate-300 font-medium flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-sky-400 shrink-0" />
            <span>Atendimento profissional para clínicas, consultórios e distribuidores odontológicos.</span>
          </div>

          {/* Botões Rápidos do Hero */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start pt-2">
            <a
              href={urlSolicitarCotacao}
              onClick={!whatsappNumber ? handleScrollToForm : undefined}
              target={whatsappNumber ? '_blank' : undefined}
              rel={whatsappNumber ? 'noopener noreferrer' : undefined}
              className="inline-flex items-center justify-center bg-brand-clinical hover:bg-sky-600 text-white text-xs font-extrabold px-6 py-4 rounded-xl uppercase tracking-wider transition-all shadow-md active:scale-98 cursor-pointer"
            >
              Solicitar cotação
            </a>
            <a
              href={urlFalarEspecialista}
              onClick={!whatsappNumber ? handleScrollToForm : undefined}
              target={whatsappNumber ? '_blank' : undefined}
              rel={whatsappNumber ? 'noopener noreferrer' : undefined}
              className="inline-flex items-center justify-center bg-white/15 hover:bg-white/20 text-white border border-white/20 text-xs font-extrabold px-6 py-4 rounded-xl uppercase tracking-wider transition-all active:scale-98 cursor-pointer gap-2"
            >
              <MessageCircle className="w-4 h-4 text-emerald-400" />
              Falar com especialista
            </a>
            <Link
              href="/produtos"
              className="inline-flex items-center justify-center bg-transparent hover:bg-white/5 text-white border border-white/10 hover:border-white/30 text-xs font-extrabold px-6 py-4 rounded-xl uppercase tracking-wider transition-all active:scale-98 cursor-pointer gap-1.5"
            >
              Ver catálogo
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* 2. Conteúdo Principal */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 w-full flex-1 grid md:grid-cols-12 gap-8 items-start">
        
        {/* Lado Esquerdo: Cards de Ação Comercial (Col-span 7 no md) */}
        <div className="md:col-span-7 space-y-6">
          
          <h2 className="text-xl font-extrabold text-brand-dark tracking-tight">
            Como podemos ajudar você hoje?
          </h2>

          <div className="grid sm:grid-cols-2 gap-6">
            {/* Bloco de Cotação */}
            <div className="bg-white rounded-2xl border border-slate-100 p-6 flex flex-col justify-between space-y-5 shadow-xs hover:shadow-md transition-shadow">
              <div className="space-y-3">
                <div className="bg-sky-50 text-brand-clinical w-12 h-12 rounded-xl flex items-center justify-center border border-sky-100/30">
                  <FileText className="w-6 h-6 stroke-[1.5]" />
                </div>
                <h3 className="font-extrabold text-brand-dark text-base">Cotações Sob Medida</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Precisa equipar seu novo consultório ou adquirir equipamentos odontológicos premium? Solicite uma cotação comercial detalhada com condições exclusivas de financiamento.
                </p>
              </div>
              <a
                href={urlSolicitarCotacao}
                onClick={!whatsappNumber ? handleScrollToForm : undefined}
                target={whatsappNumber ? '_blank' : undefined}
                rel={whatsappNumber ? 'noopener noreferrer' : undefined}
                className="w-full bg-brand-clinical hover:bg-sky-600 text-white text-[11px] font-bold py-3 rounded-lg text-center uppercase tracking-wider transition-colors inline-block cursor-pointer"
              >
                Solicitar cotação
              </a>
            </div>

            {/* Bloco de Atendimento com Especialista */}
            <div className="bg-white rounded-2xl border border-slate-100 p-6 flex flex-col justify-between space-y-5 shadow-xs hover:shadow-md transition-shadow">
              <div className="space-y-3">
                <div className="bg-emerald-50 text-emerald-600 w-12 h-12 rounded-xl flex items-center justify-center border border-emerald-100/30">
                  <MessageCircle className="w-6 h-6 stroke-[1.5]" />
                </div>
                <h3 className="font-extrabold text-brand-dark text-base">Falar com Especialista</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Dúvidas sobre compatibilidade, especificações técnicas ou assessoria de instalação? Fale agora mesmo com nossa equipe técnica de consultores certificados.
                </p>
              </div>
              <a
                href={urlFalarEspecialista}
                onClick={!whatsappNumber ? handleScrollToForm : undefined}
                target={whatsappNumber ? '_blank' : undefined}
                rel={whatsappNumber ? 'noopener noreferrer' : undefined}
                className="w-full border border-slate-200 hover:border-slate-300 text-slate-700 hover:text-brand-dark text-[11px] font-bold py-3 rounded-lg text-center uppercase tracking-wider transition-all inline-block bg-white hover:bg-slate-50 cursor-pointer"
              >
                Falar com especialista
              </a>
            </div>
          </div>

          {/* Bloco de Acesso ao Catálogo */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 shadow-xs hover:shadow-md transition-shadow">
            <div className="flex gap-4 items-start sm:items-center">
              <div className="bg-indigo-50 text-indigo-600 w-12 h-12 rounded-xl flex items-center justify-center border border-indigo-100/30 shrink-0">
                <LayoutGrid className="w-6 h-6 stroke-[1.5]" />
              </div>
              <div className="space-y-1">
                <h3 className="font-extrabold text-brand-dark text-base">Nosso Catálogo Completo</h3>
                <p className="text-xs text-slate-500 max-w-md leading-relaxed">
                  Conheça nossa seleção completa de cadeiras, bombas de vácuo, compressores, periféricos e peças de mão premium.
                </p>
              </div>
            </div>
            <Link
              href="/produtos"
              className="bg-slate-950 hover:bg-slate-800 text-white text-[11px] font-bold px-5 py-3 rounded-lg text-center uppercase tracking-wider transition-colors inline-block whitespace-nowrap cursor-pointer shadow-xs active:scale-98"
            >
              Ver catálogo
            </Link>
          </div>

          {/* Bloco de Informações de Contato / Comercial */}
          <div className="bg-slate-900 text-white rounded-2xl p-6 md:p-8 space-y-6">
            <h3 className="text-base font-extrabold tracking-tight">Canais de Atendimento Oficial</h3>
            
            <div className="grid sm:grid-cols-3 gap-6">
              <div className="space-y-2 flex flex-col">
                <div className="text-sky-400 flex items-center gap-1.5">
                  <Phone className="w-4 h-4" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Central de Vendas</span>
                </div>
                <span className="text-sm font-black text-white">0800-456-7890</span>
                <span className="text-[10px] text-slate-400 leading-normal">Segunda a Sexta, das 8h às 18h</span>
              </div>

              <div className="space-y-2 flex flex-col">
                <div className="text-sky-400 flex items-center gap-1.5">
                  <Mail className="w-4 h-4" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">E-mail Comercial</span>
                </div>
                <span className="text-xs font-bold text-white break-all">vendas@plataformadental.com.br</span>
                <span className="text-[10px] text-slate-400 leading-normal">Retorno rápido comercial em até 2 horas</span>
              </div>

              <div className="space-y-2 flex flex-col">
                <div className="text-sky-400 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Sede Corporativa</span>
                </div>
                <span className="text-xs font-bold text-white">Av. Paulista, 1000</span>
                <span className="text-[10px] text-slate-400 leading-normal">Bela Vista - São Paulo / SP</span>
              </div>
            </div>
          </div>
        </div>

        {/* Lado Direito: Formulário Comercial (Col-span 5 no md) */}
        <div id="contato-form" className="md:col-span-5 bg-white rounded-2xl border border-slate-100 p-6 md:p-8 space-y-6 shadow-xs scroll-mt-20">
          <div className="space-y-1">
            <h3 className="text-lg font-black text-brand-dark flex items-center gap-2">
              <Mail className="w-5 h-5 text-brand-clinical" />
              Enviar Mensagem
            </h3>
            <p className="text-xs text-slate-400">
              Retornaremos seu contato por e-mail ou telefone o mais rápido possível.
            </p>
          </div>

          {enviado ? (
            <div className="bg-emerald-50 text-emerald-800 p-6 rounded-2xl border border-emerald-100 text-center space-y-4 animate-fadeIn">
              <div className="bg-emerald-100 text-emerald-600 w-12 h-12 rounded-full flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="space-y-2">
                <h4 className="font-extrabold text-sm">Mensagem Enviada!</h4>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  Agradecemos seu contato. Nossa equipe de consultores analisará sua mensagem e retornará em breve.
                </p>
              </div>
              <button 
                onClick={() => setEnviado(false)}
                className="text-xs text-brand-clinical font-bold hover:underline cursor-pointer"
              >
                Enviar outra mensagem
              </button>
            </div>
          ) : (
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Nome Completo</label>
                <input 
                  type="text" 
                  required
                  placeholder="Seu nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({...formData, nome: e.target.value})}
                  className="w-full text-xs border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-brand-clinical/20 focus:border-brand-clinical bg-slate-50/50 hover:bg-slate-50 transition-all placeholder-slate-400 font-medium text-slate-800" 
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">E-mail</label>
                <input 
                  type="email" 
                  required
                  placeholder="email@exemplo.com"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full text-xs border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-brand-clinical/20 focus:border-brand-clinical bg-slate-50/50 hover:bg-slate-50 transition-all placeholder-slate-400 font-medium text-slate-800" 
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Telefone / WhatsApp</label>
                <input 
                  type="tel" 
                  required
                  placeholder="(00) 00000-0000"
                  value={formData.telefone}
                  onChange={(e) => setFormData({...formData, telefone: e.target.value})}
                  className="w-full text-xs border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-brand-clinical/20 focus:border-brand-clinical bg-slate-50/50 hover:bg-slate-50 transition-all placeholder-slate-400 font-medium text-slate-800" 
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Assunto Principal</label>
                <select 
                  value={formData.assunto}
                  onChange={(e) => setFormData({...formData, assunto: e.target.value})}
                  className="w-full text-xs border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-brand-clinical/20 focus:border-brand-clinical bg-slate-50/50 hover:bg-slate-50 transition-all font-semibold text-slate-700"
                >
                  <option>Cotação de Equipamento Novo</option>
                  <option>Parceria Comercial</option>
                  <option>Dúvida Técnica sobre Equipamento</option>
                  <option>Outros Assuntos</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Mensagem</label>
                <textarea 
                  rows={4}
                  required
                  placeholder="Escreva sua dúvida ou solicitação comercial aqui..."
                  value={formData.mensagem}
                  onChange={(e) => setFormData({...formData, mensagem: e.target.value})}
                  className="w-full text-xs border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-brand-clinical/20 focus:border-brand-clinical bg-slate-50/50 hover:bg-slate-50 transition-all placeholder-slate-400 font-medium text-slate-800" 
                />
              </div>

              <div className="pt-2">
                <MobileButton variant="primary" type="submit">
                  Enviar Mensagem Comercial
                </MobileButton>
              </div>
            </form>
          )}

          {/* Quick Support technical advice */}
          <div className="bg-slate-50 rounded-2xl border border-slate-200/50 p-5 space-y-3">
            <h4 className="font-bold text-xs text-brand-dark flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-brand-clinical" />
              Precisa de ajuda com assistência técnica?
            </h4>
            <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
              Caso sua necessidade seja abertura de chamados técnicos ou manutenção preventiva de algum equipamento M.MUNIZ já adquirido, por favor acesse a nossa área de <Link href="/suporte" className="text-brand-clinical hover:underline font-bold">Suporte Técnico</Link>.
            </p>
          </div>
        </div>

      </section>
    </div>
  );
}
