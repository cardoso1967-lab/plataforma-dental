import React from 'react';
import { ProductCard } from '@/components/ui/ProductCard';
import { createSupabaseServerClient } from '@/lib/supabase-server';

export default async function ProductsPage() {
  const supabase = await createSupabaseServerClient();

  const { data: dbProducts } = await supabase
    .from('products')
    .select(`
      *,
      category:product_categories(id, name),
      images:product_images(url, is_primary)
    `)
    .eq('is_active', true)
    .order('name', { ascending: true });

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

  // Extrair categorias dinamicamente
  const categories = ['Todos'];
  formattedProducts.forEach((p) => {
    if (p.category && !categories.includes(p.category)) {
      categories.push(p.category);
    }
  });

  const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;
  const whatsappUrl = whatsappNumber 
    ? `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
        'Olá, gostaria de saber mais sobre os equipamentos odontológicos da M.MUNIZ.'
      )}`
    : null;

  return (
    <div className="py-12 bg-slate-50 flex-1">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header */}
        <div className="space-y-3">
          <span className="text-xs font-bold text-brand-clinical uppercase tracking-wider">
            Equipamentos de Alta Performance
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-brand-dark tracking-tight">
            Catálogo de Equipamentos
          </h1>
          <p className="text-sm text-slate-500 max-w-xl">
            Explore nossa seleção de equipamentos clínicos premium com assessoria de instalação e garantia de suporte técnico.
          </p>
        </div>

        {/* Categories Bar */}
        {categories.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
            {categories.map((cat, idx) => (
              <button
                key={cat}
                className={`text-xs font-bold px-4 py-2.5 rounded-full border transition-all whitespace-nowrap active:scale-95 ${
                  idx === 0
                    ? 'bg-brand-clinical text-white border-brand-clinical'
                    : 'bg-white text-slate-600 border-slate-100 hover:border-slate-300'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* Products Grid / Empty State */}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {formattedProducts.map((product) => (
              <ProductCard key={product.id} {...product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

