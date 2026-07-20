'use client';

import React, { useState } from 'react';

export interface GalleryImage {
  id?: string;
  url?: string;
  public_url?: string;
  is_primary?: boolean;
  sort_order?: number;
}

interface ProductGalleryProps {
  productName: string;
  images: GalleryImage[];
}

export const ProductGallery: React.FC<ProductGalleryProps> = ({ productName, images = [] }) => {
  // Ordenar imagens: principal primeiro, depois por sort_order
  const sortedImages = [...images].sort((a, b) => {
    if (a.is_primary) return -1;
    if (b.is_primary) return 1;
    return (a.sort_order || 0) - (b.sort_order || 0);
  });

  const getImageUrl = (img?: GalleryImage) => img?.public_url || img?.url || null;

  const [activeImage, setActiveImage] = useState<string | null>(
    getImageUrl(sortedImages[0])
  );

  const activeUrl = activeImage || getImageUrl(sortedImages[0]);

  return (
    <div className="flex flex-col space-y-4">
      {/* Imagem Destaque Principal */}
      <div className={`aspect-square rounded-2xl border border-slate-100 relative flex flex-col items-center justify-center overflow-hidden shadow-2xs ${
        activeUrl ? 'bg-white' : 'bg-gradient-to-br from-slate-50 via-sky-50/20 to-slate-100'
      }`}>
        {activeUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={activeUrl}
            alt={productName}
            className="object-contain w-full h-full p-6 transition-all duration-300 hover:scale-105"
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

      {/* Miniaturas da Galeria (apenas se houver mais de 1 imagem) */}
      {sortedImages.length > 1 && (
        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2.5 pt-1">
          {sortedImages.map((img, idx) => {
            const url = getImageUrl(img);
            if (!url) return null;
            const isSelected = activeUrl === url;

            return (
              <button
                key={img.id || idx}
                type="button"
                onClick={() => setActiveImage(url)}
                className={`aspect-square rounded-xl border p-1 overflow-hidden transition-all bg-white cursor-pointer ${
                  isSelected
                    ? 'border-sky-600 ring-2 ring-sky-100 scale-105 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 opacity-70 hover:opacity-100'
                }`}
                title={`Ver imagem ${idx + 1} de ${productName}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt={`${productName} - Imagem ${idx + 1}`}
                  className="object-contain w-full h-full rounded-lg"
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
