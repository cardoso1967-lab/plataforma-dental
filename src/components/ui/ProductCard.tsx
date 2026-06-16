import React from 'react';
import Link from 'next/link';

interface ProductCardProps {
  id: string;
  name: string;
  slug?: string;
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

  const targetHref = slug ? `/produtos/${slug}` : '/produtos';

  const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;
  const whatsappText = encodeURIComponent(`Olá, gostaria de saber mais sobre o produto ${name} da M.MUNIZ.`);
  const whatsappUrl = whatsappNumber 
    ? `https://wa.me/${whatsappNumber}?text=${whatsappText}`
    : null;

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
          <Link href={targetHref} className="hover:text-brand-clinical transition-colors">
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

          <div className="flex flex-col gap-2">
            <Link 
              href={targetHref} 
              className="w-full bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white text-xs font-bold rounded-lg py-2.5 px-3 flex items-center justify-center gap-1.5 active:scale-98 transition-all shadow-xs cursor-pointer"
            >
              Conheça mais
            </Link>
            <Link 
              href={whatsappUrl || '/contato'} 
              target={whatsappUrl ? "_blank" : undefined}
              rel={whatsappUrl ? "noopener noreferrer" : undefined}
              className="w-full border border-slate-200 hover:bg-slate-50 text-slate-700 hover:text-brand-dark text-xs font-semibold rounded-lg py-2.5 px-3 flex items-center justify-center gap-1.5 active:scale-98 transition-all cursor-pointer"
            >
              Solicitar cotação
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
