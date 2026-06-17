import React from 'react';
import { ProductCatalog } from '@/components/ProductCatalog';
import { createSupabaseServerClient } from '@/lib/supabase-server';

export default async function ProductsPage() {
  const supabase = await createSupabaseServerClient();

  // 1. Buscar produtos ativos com categoria e imagens
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

  // 2. Buscar categorias reais do banco de dados (product_categories)
  const { data: dbCategories } = await supabase
    .from('product_categories')
    .select('name')
    .order('name', { ascending: true });

  let categories = (dbCategories || []).map((cat) => cat.name);

  // Fallback: Se não houver categorias na tabela, extrair dos produtos
  if (categories.length === 0) {
    const extracted = new Set<string>();
    formattedProducts.forEach((p) => {
      if (p.category) {
        extracted.add(p.category);
      }
    });
    categories = Array.from(extracted);
  }

  const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;

  return (
    <ProductCatalog
      initialProducts={formattedProducts}
      categories={categories}
      whatsappNumber={whatsappNumber}
    />
  );
}
