import React from 'react';
import Link from 'next/link';
import { ShieldCheck, Wrench, Shield, ShoppingBag, ArrowRight } from 'lucide-react';
import { MobileButton } from '@/components/ui/MobileButton';
import { ProductCard } from '@/components/ui/ProductCard';
import { createSupabaseServerClient } from '@/lib/supabase-server';

export default async function HomePage() {
  const supabase = await createSupabaseServerClient();

  const { data: dbProducts } = await supabase
    .from('products')
    .select(`
      *,
      category:product_categories(id, name),
      images:product_images(url, is_primary)
    `)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(6);

  const formattedProducts = (dbProducts || []).map((p) => {
    const primaryImage = p.images?.find((img: any) => img.is_primary)?.url 
      || p.images?.[0]?.url 
      || undefined;

    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      price: Number(p.price),
      category: p.category?.name || 'Geral',
      imageUrl: primaryImage,
      sku: p.sku || undefined,
      description: p.description || undefined,
    };
  });

  const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;
  const whatsappUrl = whatsappNumber 
    ? `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
        'Olá, gostaria de saber mais sobre os equipamentos odontológicos da M.MUNIZ.'
      )}`
    : null;

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="relative bg-slate-50 py-16 lg:py-24 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-2xl space-y-6">
            <span className="bg-sky-100 text-brand-clinical text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider inline-block">
              Tecnologia e Confiança para seu Consultório
            </span>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-brand-dark tracking-tight leading-tight">
              A evolução na venda e manutenção de <span className="text-brand-clinical">Equipamentos Odontológicos</span>
            </h1>
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-xl">
              Plataforma completa para dentistas adquirirem equipamentos premium de forma consultiva e gerenciarem assistências técnicas em poucos cliques.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Link href="/produtos" className="w-full sm:w-auto">
                <MobileButton variant="primary">
                  Explorar Catálogo
                  <ShoppingBag className="w-4 h-4 ml-2" />
                </MobileButton>
              </Link>
              <Link href="/suporte" className="w-full sm:w-auto">
                <MobileButton variant="secondary">
                  Solicitar Assistência
                  <Wrench className="w-4 h-4 ml-2" />
                </MobileButton>
              </Link>
            </div>
          </div>
        </div>
        
        {/* Abstract Clinical Shape Background */}
        <div className="hidden lg:block absolute right-0 top-1/2 -translate-y-1/2 w-1/3 h-3/4 bg-brand-clinical/5 rounded-l-full filter blur-3xl" />
      </section>

      {/* Pillars Section */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-xl mx-auto space-y-3">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-brand-dark tracking-tight">
            Nossos Serviços
          </h2>
          <p className="text-sm text-slate-500 leading-relaxed">
            Unimos consultoria comercial personalizada e agilidade técnica para que seu consultório nunca pare de funcionar.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mt-12">
          {/* Pillar 1: Venda */}
          <div className="bg-slate-50 rounded-2xl border border-slate-100 p-8 space-y-5 hover:shadow-md transition-shadow flex flex-col justify-between">
            <div className="space-y-4">
              <div className="bg-sky-100 text-brand-clinical w-12 h-12 rounded-xl flex items-center justify-center">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-brand-dark">Venda Consultiva</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Adquira cadeiras odontológicas, autoclaves, compressores e periféricos das melhores marcas com assessoria técnica pré-venda. Garantimos a escolha ideal para seu fluxo e espaço.
              </p>
            </div>
            <Link href="/produtos" className="inline-flex items-center text-xs font-bold text-brand-clinical group pt-4">
              <span>Ver portfólio de produtos</span>
              <ArrowRight className="w-4 h-4 ml-1.5 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          {/* Pillar 2: Assistência */}
          <div className="bg-slate-50 rounded-2xl border border-slate-100 p-8 space-y-5 hover:shadow-md transition-shadow flex flex-col justify-between">
            <div className="space-y-4">
              <div className="bg-emerald-100 text-emerald-600 w-12 h-12 rounded-xl flex items-center justify-center">
                <Wrench className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-brand-dark">Gestão de Assistência</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Suporte ágil para consertos, manutenções preventivas e calibrações. Acompanhe a chegada do técnico em tempo real e aprove orçamentos diretamente pelo celular.
              </p>
            </div>
            <Link href="/suporte" className="inline-flex items-center text-xs font-bold text-emerald-600 group pt-4">
              <span>Abrir chamado técnico</span>
              <ArrowRight className="w-4 h-4 ml-1.5 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="py-16 bg-slate-50 border-t border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center max-w-xl mx-auto space-y-3">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-brand-dark tracking-tight">
              Equipamentos em destaque
            </h2>
            <p className="text-sm text-slate-500 leading-relaxed">
              Conheça alguns equipamentos disponíveis para venda consultiva e suporte técnico especializado.
            </p>
          </div>

          {formattedProducts.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center max-w-md mx-auto space-y-4 shadow-sm">
              <h3 className="text-lg font-extrabold text-brand-dark">
                Em breve novos equipamentos estarão disponíveis
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Enquanto isso, fale com a M.MUNIZ para receber atendimento consultivo.
              </p>
              <div className="pt-2">
                <a
                  href={whatsappUrl || '/contato'}
                  target={whatsappUrl ? "_blank" : undefined}
                  rel={whatsappUrl ? "noopener noreferrer" : undefined}
                  className="inline-flex items-center bg-brand-clinical text-white text-xs font-extrabold px-6 py-3 rounded-xl uppercase tracking-wider hover:bg-sky-700 transition-colors shadow-xs cursor-pointer"
                >
                  Falar com consultor
                </a>
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {formattedProducts.map((product) => (
                  <ProductCard key={product.id} {...product} />
                ))}
              </div>

              <div className="flex justify-center pt-4">
                <Link href="/produtos">
                  <MobileButton variant="primary">
                    Ver catálogo completo
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </MobileButton>
                </Link>
              </div>
            </>
          )}
        </div>
      </section>

      {/* Safety & Features Section */}
      <section className="bg-slate-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid sm:grid-cols-3 gap-8">
          <div className="text-center space-y-2">
            <div className="mx-auto w-10 h-10 rounded-lg bg-slate-800 text-sky-400 flex items-center justify-center mb-3">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-sm">Garantia Estendida</h4>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              Todos os equipamentos novos adquiridos possuem opção de suporte direto de fábrica.
            </p>
          </div>
          <div className="text-center space-y-2">
            <div className="mx-auto w-10 h-10 rounded-lg bg-slate-800 text-emerald-400 flex items-center justify-center mb-3">
              <Wrench className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-sm">Técnicos Credenciados</h4>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              Nossa rede técnica passa por treinamentos constantes dos fabricantes oficiais.
            </p>
          </div>
          <div className="text-center space-y-2">
            <div className="mx-auto w-10 h-10 rounded-lg bg-slate-800 text-amber-400 flex items-center justify-center mb-3">
              <Shield className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-sm">Segurança de Dados</h4>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              Portal do cliente criptografado via Supabase Auth com total rastreabilidade.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
