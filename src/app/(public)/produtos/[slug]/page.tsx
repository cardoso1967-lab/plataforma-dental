import React from 'react';
import Link from 'next/link';
import { ShieldCheck, ArrowLeft, MessageCircle, Truck } from 'lucide-react';
import { MobileButton } from '@/components/ui/MobileButton';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { slug } = await params;

  // Datos simulados del producto basados en el slug
  const productData = {
    name: slug
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' '),
    price: 24500.00,
    sku: 'DENT-PRO-' + slug.substring(0, 3).toUpperCase(),
    category: 'Consultório',
    description: 'Equipamento odontológico desenvolvido com tecnologia avançada para garantir máxima ergonomia ao profissional e extremo conforto ao paciente. Construído com materiais altamente duráveis de fácil higienização, respeitando rigorosamente os padrões de biossegurança.',
    specs: [
      { name: 'Alimentação', value: '110V / 220V (Bivolt Automático)' },
      { name: 'Garantia', value: '24 meses oficiais de fábrica' },
      { name: 'Registro ANVISA', value: '80123456789' },
      { name: 'Estofamento', value: 'Couro sintético com costura premium' },
      { name: 'Sistemas', value: 'Braço pantográfico com trava pneumática' }
    ]
  };

  const formattedPrice = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(productData.price);

  return (
    <div className="py-8 bg-slate-50 flex-1">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Back Link */}
        <Link 
          href="/produtos" 
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-brand-dark transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar ao catálogo</span>
        </Link>

        {/* Product Card Details */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden grid md:grid-cols-2 gap-6 p-6">
          {/* Gallery placeholder */}
          <div className="aspect-square bg-slate-50 rounded-xl border border-slate-100/50 flex flex-col items-center justify-center text-slate-300">
            <span className="text-5xl font-extrabold uppercase">{slug.substring(0, 2)}</span>
            <span className="text-[10px] uppercase font-bold tracking-wider mt-2">Imagem do Equipamento</span>
          </div>

          {/* Details */}
          <div className="flex flex-col justify-between space-y-6">
            <div className="space-y-3">
              <span className="text-[10px] font-bold text-slate-400 block tracking-wider uppercase">
                {productData.category} | SKU: {productData.sku}
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-dark tracking-tight leading-snug">
                {productData.name}
              </h1>
              <p className="text-xs text-slate-500 leading-relaxed">
                {productData.description}
              </p>
            </div>

            {/* Price block */}
            <div className="bg-slate-50 p-4 rounded-xl space-y-1">
              <span className="text-[10px] text-slate-400 font-semibold block">Preço sob consulta / sugestão</span>
              <h2 className="text-2xl font-black text-brand-dark">{formattedPrice}</h2>
            </div>

            {/* CTAs */}
            <div className="space-y-2">
              <Link href="/contato" className="block w-full">
                <MobileButton variant="primary">
                  <MessageCircle className="w-4.5 h-4.5 mr-2" />
                  Solicitar Consultoria Comercial
                </MobileButton>
              </Link>
            </div>
          </div>
        </div>

        {/* Technical Specs & Trust */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Trust points */}
          <div className="bg-slate-900 text-white rounded-2xl p-6 space-y-4 flex flex-col justify-center">
            <h3 className="font-bold text-base border-b border-slate-800 pb-2">Venda com suporte total</h3>
            
            <div className="flex gap-3 items-start">
              <ShieldCheck className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold">Entrega e Instalação Inclusas</h4>
                <p className="text-[11px] text-slate-400">Garantimos a montagem por nossa rede credenciada local.</p>
              </div>
            </div>

            <div className="flex gap-3 items-start">
              <Truck className="w-5 h-5 text-sky-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold">Pós-venda Integrado</h4>
                <p className="text-[11px] text-slate-400">Equipamento automaticamente cadastrado em sua conta para chamados de assistência.</p>
              </div>
            </div>
          </div>

          {/* Specs Sheet */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-4">
            <h3 className="font-bold text-base text-brand-dark border-b border-slate-100 pb-2">Especificações Técnicas</h3>
            <dl className="space-y-2.5">
              {productData.specs.map((spec) => (
                <div key={spec.name} className="flex justify-between text-xs border-b border-slate-50 pb-1.5 last:border-0">
                  <dt className="text-slate-400 font-medium">{spec.name}</dt>
                  <dd className="text-brand-dark font-semibold text-right">{spec.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
