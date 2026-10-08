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
  description?: string;
  variants?: any[];
}

export const ProductCard: React.FC<ProductCardProps> = ({
  name,
  slug,
  price,
  category,
  imageUrl,
  sku,
  description,
  variants,
}) => {
  let displayPrice = '';
  let isMultiplePrices = false;
  let activeVariants = [];
  
  if (variants) {
    activeVariants = variants.filter(v => v.is_active).sort((a, b) => a.display_order - b.display_order);
  }
  
  const formatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
  
  if (activeVariants.length > 0) {
    const min = Math.min(...activeVariants.map(v => v.price));
    const max = Math.max(...activeVariants.map(v => v.price));
    if (min === max) {
      displayPrice = formatter.format(min);
    } else {
      isMultiplePrices = true;
      displayPrice = `${formatter.format(min)} - ${formatter.format(max)}`;
    }
  } else {
    displayPrice = formatter.format(price);
  }

  const targetHref = slug ? `/produtos/${slug}` : '/produtos';

  const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '5514997403535';
  const whatsappText = encodeURIComponent(`Olá, gostaria de saber mais sobre o produto ${name} da M.MUNIZ.`);
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${whatsappText}`;

  return (
    <div className="bg-white rounded-2xl border border-slate-100/70 shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col h-full group overflow-hidden">
      {/* Imagen del Produto / Placeholder Premium */}
      <div className={`aspect-square relative flex flex-col items-center justify-center border-b border-slate-100/50 group-hover:opacity-95 transition-opacity overflow-hidden ${
        imageUrl 
          ? 'bg-white' 
          : 'bg-gradient-to-br from-slate-50 via-sky-50/20 to-slate-100'
      }`}>
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt={name}
            className="object-contain w-full h-full p-4"
          />
        ) : (
          <div className="flex flex-col items-center justify-center space-y-3 p-4">
            {/* Círculo decorativo en el fondo del ícono */}
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
        <span className="absolute top-3 left-3 bg-brand-dark/80 backdrop-blur-xs text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider shadow-xs">
          {category}
        </span>
      </div>

      {/* Contenido */}
      <div className="p-5 flex flex-col flex-1 justify-between space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[10px] font-semibold text-slate-400 tracking-wider">
            <span>SKU: {activeVariants.length > 0 ? `${activeVariants.length} opções` : (sku || 'INDISPONÍVEL')}</span>
            <span className="text-brand-clinical/85 font-bold uppercase">{category}</span>
          </div>
          
          <Link href={targetHref} className="hover:text-brand-clinical block transition-colors">
            <h3 className="font-extrabold text-slate-800 text-base line-clamp-2 leading-snug tracking-tight group-hover:text-brand-clinical transition-colors">
              {name}
            </h3>
          </Link>

          {description && (
            <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed font-normal">
              {description}
            </p>
          )}
        </div>

        <div className="space-y-4 pt-2">
          {activeVariants.length > 0 ? (
            <div className="border-t border-slate-50 pt-3">
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-2 block">Capacidades</span>
              <div className="space-y-1.5">
                {activeVariants.slice(0, 3).map((v, i) => (
                  <div key={i} className="flex justify-between items-center text-xs">
                    <span className="text-slate-600 font-medium">{v.capacity_liters} L</span>
                    <span className="text-brand-dark font-bold">{formatter.format(v.price)}</span>
                  </div>
                ))}
                {activeVariants.length > 3 && (
                  <div className="text-[10px] text-sky-600 font-bold text-center pt-1">Ver mais opções</div>
                )}
              </div>
            </div>
          ) : (price || activeVariants.length > 0) ? (
            <div className="flex items-baseline justify-between border-t border-slate-50 pt-3">
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Preço Sugerido</span>
              <span className="text-lg font-black text-brand-dark tracking-tight">
                {displayPrice}
              </span>
            </div>
          ) : (
            <div className="flex items-baseline justify-between border-t border-slate-50 pt-3">
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Preço</span>
              <span className="text-xs font-bold text-brand-clinical uppercase tracking-wider">
                Sob Consulta
              </span>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Link 
              href={targetHref} 
              className="w-full bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white text-xs font-extrabold rounded-xl py-3 px-4 flex items-center justify-center gap-1.5 active:scale-98 transition-all shadow-xs cursor-pointer tracking-wider uppercase"
            >
              Conheça mais
            </Link>
            <Link 
              href={whatsappUrl || '/contato'} 
              target={whatsappUrl ? "_blank" : undefined}
              rel={whatsappUrl ? "noopener noreferrer" : undefined}
              className="w-full border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-700 hover:text-brand-dark text-xs font-bold rounded-xl py-2.5 px-4 flex items-center justify-center gap-1.5 active:scale-98 transition-all cursor-pointer tracking-wider uppercase"
            >
              Solicitar cotação
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
