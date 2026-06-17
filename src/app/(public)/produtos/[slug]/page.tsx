import React from 'react';
import Link from 'next/link';
import { 
  ShieldCheck, 
  ArrowLeft, 
  MessageCircle, 
  Truck, 
  ChevronRight, 
  BadgeCheck, 
  Wrench, 
  FileText, 
  Sparkles,
  Layers,
  HelpCircle
} from 'lucide-react';
import { ProductCard } from '@/components/ui/ProductCard';
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

  // Buscar outros produtos ativos para os relacionados
  const { data: relatedDb } = await supabase
    .from('products')
    .select(`
      *,
      category:product_categories(id, name),
      images:product_images(url, is_primary)
    `)
    .eq('is_active', true)
    .neq('id', product.id)
    .limit(12);

  // Filtrar relacionados da mesma categoria primeiro, preenchendo com outros se necessário
  let relatedProducts = (relatedDb || []).filter(p => p.category_id === product.category_id).slice(0, 3);
  if (relatedProducts.length < 3) {
    const currentRelatedIds = relatedProducts.map(p => p.id);
    const fillers = (relatedDb || []).filter(p => p.category_id !== product.category_id && !currentRelatedIds.includes(p.id));
    relatedProducts = [...relatedProducts, ...fillers].slice(0, 3);
  }

  const primaryImage = product.images?.find((img: any) => img.is_primary)?.url 
    || product.images?.[0]?.url 
    || null;

  const formattedPrice = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(Number(product.price));

  const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;
  
  // URL WhatsApp para Cotação
  const quoteText = encodeURIComponent(`Olá, gostaria de solicitar uma cotação para o equipamento ${product.name} (SKU: ${product.sku || 'N/A'}) da M.MUNIZ.`);
  const quoteWhatsappUrl = whatsappNumber 
    ? `https://wa.me/${whatsappNumber}?text=${quoteText}`
    : '/contato';

  // URL WhatsApp para Especialista
  const specialistText = encodeURIComponent(`Olá, gostaria de falar com um especialista sobre o equipamento ${product.name} (SKU: ${product.sku || 'N/A'}) para entender especificações e condições.`);
  const specialistWhatsappUrl = whatsappNumber 
    ? `https://wa.me/${whatsappNumber}?text=${specialistText}`
    : '/contato';

  return (
    <div className="py-10 bg-slate-50 flex-1">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        
        {/* Breadcrumb e Back link */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/60 pb-5">
          <nav className="text-[10px] sm:text-xs font-bold text-slate-400 tracking-wider flex items-center gap-1.5 uppercase select-none">
            <Link href="/" className="hover:text-brand-clinical transition-colors">Início</Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
            <Link href="/produtos" className="hover:text-brand-clinical transition-colors">Equipamentos</Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
            <span className="text-slate-500 font-extrabold truncate max-w-xs">{product.name}</span>
          </nav>

          <Link 
            href="/produtos" 
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-brand-dark transition-colors self-start sm:self-auto"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Voltar ao catálogo</span>
          </Link>
        </div>

        {/* Hero Section do Produto */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden grid grid-cols-1 lg:grid-cols-12 gap-8 p-6 sm:p-8">
          
          {/* Imagem do Produto */}
          <div className="lg:col-span-6 flex flex-col justify-center">
            <div className={`aspect-square rounded-2xl border border-slate-100 relative flex flex-col items-center justify-center overflow-hidden shadow-2xs ${
              primaryImage 
                ? 'bg-white' 
                : 'bg-gradient-to-br from-slate-50 via-sky-50/20 to-slate-100'
            }`}>
              {primaryImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={primaryImage}
                  alt={product.name}
                  className="object-contain w-full h-full p-6 transition-transform duration-500 hover:scale-105"
                />
              ) : (
                <div className="flex flex-col items-center justify-center space-y-3 p-6">
                  <div className="bg-sky-100/40 text-sky-600 w-20 h-20 rounded-3xl flex items-center justify-center shadow-xs border border-sky-100/20">
                    <svg className="w-10 h-10 text-[#0284c7]/80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2c-.8 0-1.5.5-2 1.2a4.4 4.4 0 00-.7 2.2c0 2.1.8 3 1.2 5a3.8 3.8 0 01-.3 2.7c-.8 1.4-1.9 2.5-2.5 4.1C7 19.3 7 20.3 8 21c.8.6 1.8.6 2.5.1a4.6 4.6 0 001.5-2.6 4.6 4.6 0 001.5 2.6c.7.5 1.7.5 2.5-.1 1-.7 1-1.7.3-3.8-.6-1.6-1.7-2.7-2.5-4.1a3.8 3.8 0 01-.3-2.7c.4-2 1.2-2.9 1.2-5a4.4 4.4 0 00-.7-2.2c-.5-.7-1.2-1.2-2-1.2z" />
                      <path d="M18 4.5l1 1-1 1" />
                      <path d="M5 8.5l1 1-1 1" />
                    </svg>
                  </div>
                  <div className="text-center">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block">
                      Imagem em breve
                    </span>
                    <span className="text-[10px] text-slate-455 font-semibold block mt-1">
                      M.MUNIZ Equipamentos
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Ficha Técnica Rápida e CTAs */}
          <div className="lg:col-span-6 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="bg-sky-50 text-[#0284c7] text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider border border-sky-100">
                  {product.category?.name || 'Geral'}
                </span>
                <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider border ${
                  product.stock_quantity > 0 
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                    : 'bg-amber-50 text-amber-700 border-amber-100'
                }`}>
                  {product.stock_quantity > 0 ? `${product.stock_quantity} un disponíveis` : 'Sob consulta'}
                </span>
                <span className="bg-slate-100 text-slate-600 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider border border-slate-200">
                  Ativo
                </span>
              </div>

              <h1 className="text-3xl sm:text-4xl font-extrabold text-brand-dark tracking-tight leading-none">
                {product.name}
              </h1>

              <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
                <span>SKU: {product.sku || 'NÃO INFORMADO'}</span>
                <span>•</span>
                <span className="uppercase">{product.product_type || 'Equipamento'}</span>
              </div>
            </div>

            {/* Bloco de Preço */}
            <div className="bg-slate-50/80 border border-slate-100 p-5 rounded-2xl space-y-1.5 text-left">
              <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">
                {product.price > 0 ? 'Preço Sugerido' : 'Valor'}
              </span>
              <div className="flex items-baseline gap-2">
                <h2 className="text-3xl font-black text-brand-dark">
                  {product.price > 0 ? formattedPrice : 'Sob Consulta'}
                </h2>
                {product.price > 0 && (
                  <span className="text-[10px] text-slate-400 font-medium">(Condições facilitadas de financiamento)</span>
                )}
              </div>
            </div>

            {/* Botões de Ação Hero */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Link 
                href={quoteWhatsappUrl} 
                target={whatsappNumber ? "_blank" : undefined}
                rel={whatsappNumber ? "noopener noreferrer" : undefined}
                className="flex-1 bg-gradient-to-r from-[#0284c7] to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white font-extrabold text-xs tracking-wider uppercase rounded-xl py-4 px-6 flex items-center justify-center gap-2 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 active:scale-98 cursor-pointer"
              >
                <MessageCircle className="w-4 h-4 shrink-0" />
                Solicitar Cotação
              </Link>
              <Link 
                href={specialistWhatsappUrl} 
                target={whatsappNumber ? "_blank" : undefined}
                rel={whatsappNumber ? "noopener noreferrer" : undefined}
                className="flex-1 border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-700 hover:text-brand-dark font-extrabold text-xs tracking-wider uppercase rounded-xl py-4 px-6 flex items-center justify-center gap-2 transition-all duration-200 hover:-translate-y-0.5 active:scale-98 cursor-pointer"
              >
                <HelpCircle className="w-4 h-4 shrink-0" />
                Falar com Especialista
              </Link>
            </div>
          </div>
        </div>

        {/* Descrição Comercial do Produto */}
        <div className="bg-white rounded-3xl border border-slate-100 p-6 sm:p-8 space-y-4 shadow-2xs text-left">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <FileText className="w-5 h-5 text-[#0284c7]" />
            <h3 className="font-extrabold text-lg text-brand-dark">Apresentação do Equipamento</h3>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
            {product.description || 'Este equipamento odontológico M.MUNIZ foi desenvolvido sob os mais rígidos padrões de ergonomia, biossegurança e durabilidade. Projetado para otimizar a rotina clínica do profissional e assegurar o máximo conforto ao paciente. Conta com estrutura reforçada, estofamento anatômico e tecnologias de fluxo de trabalho de última geração.'}
          </p>
        </div>

        {/* Bloco de Benefícios Premium M.MUNIZ */}
        <div className="space-y-6">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-[#0284c7] text-[10px] font-black uppercase tracking-widest">Diferenciais e Suporte</span>
            <h3 className="text-xl sm:text-2xl font-extrabold text-brand-dark">Por que adquirir seu equipamento com a M.MUNIZ?</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            <div className="bg-white border border-slate-100 p-6 rounded-2xl text-left space-y-3 hover:shadow-xs transition-shadow">
              <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <h4 className="font-extrabold text-sm text-slate-800">Venda consultiva</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Apoio técnico na escolha do equipamento ideal para a infraestrutura e demanda da sua clínica ou consultório.
              </p>
            </div>

            <div className="bg-white border border-slate-100 p-6 rounded-2xl text-left space-y-3 hover:shadow-xs transition-shadow">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Truck className="w-5 h-5" />
              </div>
              <h4 className="font-extrabold text-sm text-slate-800">Instalação orientada</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Montagem acompanhada de ponta a ponta e testes iniciais de validação executados por técnicos oficiais credenciados.
              </p>
            </div>

            <div className="bg-white border border-slate-100 p-6 rounded-2xl text-left space-y-3 hover:shadow-xs transition-shadow">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Wrench className="w-5 h-5" />
              </div>
              <h4 className="font-extrabold text-sm text-slate-800">Suporte técnico</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Abertura simplificada de chamados corretivos e preventivos direto pelo seu portal de cliente M.MUNIZ.
              </p>
            </div>

            <div className="bg-white border border-slate-100 p-6 rounded-2xl text-left space-y-3 hover:shadow-xs transition-shadow">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h4 className="font-extrabold text-sm text-slate-800">Garantia e manutenção</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Cobertura ampla contra falhas, além de ofertas de planos de manutenção preventiva para evitar paradas técnicas.
              </p>
            </div>

          </div>
        </div>

        {/* Bloco de Assistência Técnica Especializada */}
        <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 text-left relative overflow-hidden">
          {/* Fundo decorativo sutil */}
          <div className="absolute right-0 top-0 w-64 h-64 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="space-y-3 max-w-2xl relative z-10">
            <span className="text-sky-400 text-[9px] font-black uppercase tracking-widest block">Suporte Completo M.MUNIZ</span>
            <h3 className="text-xl sm:text-2xl font-extrabold tracking-tight">Manutenção Técnica e Assistência</h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              A M.MUNIZ acompanha o ciclo completo do equipamento: venda, instalação, manutenção preventiva e suporte técnico especializado.
            </p>
          </div>

          <div className="flex-shrink-0 relative z-10">
            <div className="bg-slate-800 border border-slate-700/80 px-5 py-4 rounded-2xl flex items-center gap-3">
              <BadgeCheck className="w-8 h-8 text-sky-400 flex-shrink-0" />
              <div>
                <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Rede Credenciada</span>
                <span className="text-xs font-black text-white">100% de técnicos qualificados</span>
              </div>
            </div>
          </div>
        </div>

        {/* Seção CTA Final de Conversão */}
        <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-8 sm:p-12 text-center space-y-6 relative overflow-hidden shadow-lg border border-slate-800">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-indigo-500/10 via-transparent to-transparent pointer-events-none" />
          
          <div className="space-y-2 max-w-xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-none">
              Pronto para evoluir o seu consultório?
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Fale com um consultor comercial M.MUNIZ e obtenha condições exclusivas de aquisição e planos de instalação integrada.
            </p>
          </div>

          <div className="pt-2">
            <Link 
              href={quoteWhatsappUrl}
              target={whatsappNumber ? "_blank" : undefined}
              rel={whatsappNumber ? "noopener noreferrer" : undefined}
              className="inline-flex items-center gap-2 bg-[#0284c7] hover:bg-sky-600 text-white font-extrabold text-xs tracking-wider uppercase px-8 py-4 rounded-xl shadow-md transition-all duration-200 hover:-translate-y-0.5 active:scale-98 cursor-pointer"
            >
              <MessageCircle className="w-4 h-4 shrink-0" />
              Solicitar Cotação deste Equipamento
            </Link>
          </div>
        </div>

        {/* Produtos Relacionados */}
        {relatedProducts.length > 0 && (
          <div className="space-y-6 pt-6">
            <div className="border-b border-slate-200/80 pb-3 flex items-center justify-between text-left">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-[#0284c7]" />
                <h3 className="font-extrabold text-lg text-brand-dark">Equipamentos Relacionados</h3>
              </div>
              <Link href="/produtos" className="text-xs font-bold text-[#0284c7] hover:underline uppercase tracking-wider">
                Ver todos
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedProducts.map((p) => {
                const imgUrl = p.images?.find((img: any) => img.is_primary)?.url 
                  || p.images?.[0]?.url 
                  || undefined;

                return (
                  <ProductCard 
                    key={p.id}
                    id={p.id}
                    name={p.name}
                    slug={p.slug}
                    price={Number(p.price)}
                    category={p.category?.name || 'Geral'}
                    imageUrl={imgUrl}
                    sku={p.sku || undefined}
                    description={p.description || undefined}
                  />
                );
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
