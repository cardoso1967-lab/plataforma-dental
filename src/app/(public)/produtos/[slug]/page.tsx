import React from 'react';
import Link from 'next/link';
import { ShieldCheck, ArrowLeft, MessageCircle, Truck } from 'lucide-react';
import { MobileButton } from '@/components/ui/MobileButton';
import { createSupabaseServerClient } from '@/lib/supabase-server';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { slug } = await params;

  const supabase = await createSupabaseServerClient();
  
  // Buscar produto específico ativo por slug
  const { data: product } = await supabase
    .from('products')
    .select(`
      *,
      category:product_categories(id, name),
      images:product_images(url, is_primary)
    `)
    .eq('slug', slug)
    .eq('is_active', true)
    .single();

  // Caso o produto não exista ou esteja inativo, renderiza tela de erro elegante
  if (!product) {
    return (
      <div className="py-16 bg-slate-50 flex-1 flex items-center justify-center">
        <div className="max-w-md w-full mx-auto px-4 text-center space-y-6">
          <div className="bg-white rounded-2xl border border-slate-100 p-8 shadow-sm space-y-4">
            <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-xl font-extrabold text-brand-dark">Produto Não Encontrado</h2>
            <p className="text-sm text-slate-500 leading-relaxed">
              O equipamento que você está procurando não foi encontrado ou não está ativo no momento.
            </p>
            <div className="pt-2">
              <Link 
                href="/produtos" 
                className="inline-flex items-center gap-2 bg-brand-clinical text-white text-xs font-bold px-6 py-3 rounded-xl uppercase tracking-wider hover:bg-sky-700 transition-colors shadow-xs"
              >
                <ArrowLeft className="w-4 h-4" />
                Voltar ao catálogo
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const primaryImage = product.images?.find((img: any) => img.is_primary)?.url 
    || product.images?.[0]?.url 
    || null;

  const formattedPrice = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(Number(product.price));

  const specs = [
    { name: 'Garantia', value: '24 meses oficiais de fábrica' },
    { name: 'Suporte Técnico', value: 'Rede credenciada M.MUNIZ' },
    { name: 'Instalação', value: 'Inclusa por técnicos autorizados' },
    { name: 'Disponibilidade', value: product.stock_quantity > 0 ? 'Pronta Entrega' : 'Sob Consulta' },
    { name: 'Tipo', value: product.product_type ? product.product_type.toUpperCase() : 'EQUIPAMENTO' }
  ];

  const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;
  const whatsappText = encodeURIComponent(`Olá, gostaria de saber mais sobre o produto ${product.name} (SKU: ${product.sku || 'N/A'}) da M.MUNIZ.`);
  const whatsappUrl = whatsappNumber 
    ? `https://wa.me/${whatsappNumber}?text=${whatsappText}`
    : null;

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
          <div className={`aspect-square rounded-xl border border-slate-100/50 relative flex flex-col items-center justify-center overflow-hidden ${
            primaryImage 
              ? 'bg-white' 
              : 'bg-gradient-to-br from-slate-50 via-sky-50/20 to-slate-100'
          }`}>
            {primaryImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={primaryImage}
                alt={product.name}
                className="object-contain w-full h-full p-4"
              />
            ) : (
              <div className="flex flex-col items-center justify-center space-y-3 p-4">
                <div className="bg-sky-100/40 text-sky-600 w-16 h-16 rounded-2xl flex items-center justify-center shadow-xs border border-sky-100/20">
                  <svg className="w-9 h-9 text-[#0284c7]/80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2c-.8 0-1.5.5-2 1.2a4.4 4.4 0 00-.7 2.2c0 2.1.8 3 1.2 5a3.8 3.8 0 01-.3 2.7c-.8 1.4-1.9 2.5-2.5 4.1C7 19.3 7 20.3 8 21c.8.6 1.8.6 2.5.1a4.6 4.6 0 001.5-2.6 4.6 4.6 0 001.5 2.6c.7.5 1.7.5 2.5-.1 1-.7 1-1.7.3-3.8-.6-1.6-1.7-2.7-2.5-4.1a3.8 3.8 0 01-.3-2.7c.4-2 1.2-2.9 1.2-5a4.4 4.4 0 00-.7-2.2c-.5-.7-1.2-1.2-2-1.2z" />
                    <path d="M18 4.5l1 1-1 1" />
                    <path d="M5 8.5l1 1-1 1" />
                  </svg>
                </div>
                <div className="text-center">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block">
                    Imagem em breve
                  </span>
                  <span className="text-[9px] text-slate-400 font-medium block mt-0.5">
                    M.MUNIZ Equipamentos
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Details */}
          <div className="flex flex-col justify-between space-y-6">
            <div className="space-y-3">
              <span className="text-[10px] font-bold text-slate-400 block tracking-wider uppercase">
                {product.category?.name || 'Geral'} | SKU: {product.sku || 'INDISPONÍVEL'}
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-dark tracking-tight leading-snug">
                {product.name}
              </h1>
              <p className="text-xs text-slate-500 leading-relaxed">
                {product.description || 'Equipamento odontológico de alta performance projetado para oferecer a máxima ergonomia e biossegurança em sua clínica.'}
              </p>
            </div>

            {/* Price block */}
            <div className="bg-slate-50 p-4 rounded-xl space-y-1">
              <span className="text-[10px] text-slate-400 font-semibold block uppercase tracking-wider">
                {product.price > 0 ? 'Preço sugerido' : 'Preço'}
              </span>
              <h2 className="text-2xl font-black text-brand-dark">
                {product.price > 0 ? formattedPrice : 'Sob Consulta'}
              </h2>
            </div>

            {/* CTAs */}
            <div className="space-y-2">
              <Link 
                href={whatsappUrl || '/contato'} 
                target={whatsappUrl ? "_blank" : undefined}
                rel={whatsappUrl ? "noopener noreferrer" : undefined}
                className="block w-full"
              >
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
              {specs.map((spec) => (
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
