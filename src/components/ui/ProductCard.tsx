import React from 'react';
import Link from 'next/link';
import { ShoppingCart, ExternalLink } from 'lucide-react';

interface ProductCardProps {
  id: string;
  name: string;
  slug: string;
  price: number;
  category: string;
  imageUrl?: string;
  sku?: string;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  name,
  slug,
  price,
  category,
  imageUrl,
  sku,
}) => {
  const formattedPrice = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(price);

  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-xs overflow-hidden hover:shadow-lg transition-all flex flex-col h-full group">
      {/* Imagen del Producto */}
      <div className="aspect-square bg-slate-50 relative flex items-center justify-center border-b border-slate-100/50 group-hover:opacity-90 transition-opacity">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt={name}
            className="object-cover w-full h-full"
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-slate-300">
            <span className="text-4xl font-bold uppercase tracking-wider">
              {name.substring(0, 2)}
            </span>
            <span className="text-[10px] mt-1 uppercase font-semibold">Sem Imagem</span>
          </div>
        )}
        <span className="absolute top-3 left-3 bg-brand-dark/80 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
          {category}
        </span>
      </div>

      {/* Contenido */}
      <div className="p-4 flex flex-col flex-1 justify-between space-y-3">
        <div className="space-y-1">
          {sku && (
            <span className="text-[10px] font-semibold text-slate-400 block tracking-wider">
              SKU: {sku}
            </span>
          )}
          <Link href={`/produtos/${slug}`} className="hover:text-brand-clinical transition-colors">
            <h4 className="font-bold text-slate-900 text-sm line-clamp-2 leading-snug">
              {name}
            </h4>
          </Link>
        </div>

        <div className="space-y-3 pt-2">
          <div className="flex items-baseline justify-between">
            <span className="text-xs text-slate-400 font-medium">Preço sugerido</span>
            <span className="text-base font-extrabold text-brand-dark">
              {formattedPrice}
            </span>
          </div>

          <div className="grid grid-cols-5 gap-2">
            <Link 
              href={`/produtos/${slug}`} 
              className="col-span-4 bg-brand-clinical text-white text-xs font-semibold rounded-lg py-2.5 px-3 flex items-center justify-center gap-1.5 active:scale-98 transition-all hover:bg-sky-700"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>Ver Detalhes</span>
            </Link>
            <Link 
              href={`/produtos/${slug}`} 
              className="col-span-1 border border-slate-100 hover:bg-slate-50 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-900 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
