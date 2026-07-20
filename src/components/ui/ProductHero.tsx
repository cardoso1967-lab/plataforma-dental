'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { MessageCircle, HelpCircle, PackageCheck, AlertCircle, Play, Film } from 'lucide-react';

export interface GalleryImage {
  id?: string;
  url?: string;
  public_url?: string;
  is_primary?: boolean;
  sort_order?: number;
}

export interface GalleryVideo {
  id?: string;
  public_url: string;
  storage_path?: string;
  title?: string | null;
  poster_url?: string | null;
  sort_order?: number;
}

export interface ProductHeroData {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  price: number;
  sku?: string | null;
  stock_quantity: number;
  product_type?: string | null;
  financing_details?: string | null;
  category?: { id: string; name: string } | null;
  images?: GalleryImage[];
  videos?: GalleryVideo[];
}

interface ProductHeroProps {
  product: ProductHeroData;
  quoteWhatsappUrl: string;
  specialistWhatsappUrl: string;
  whatsappNumber?: string;
}

export interface MediaItem {
  type: 'image' | 'video';
  id: string;
  url: string;
  posterUrl?: string | null;
  title?: string | null;
  sortOrder: number;
}

export const ProductHero: React.FC<ProductHeroProps> = ({
  product,
  quoteWhatsappUrl,
  specialistWhatsappUrl,
  whatsappNumber,
}) => {
  // 1. Organizar imagens: principal primeiro, depois por sort_order
  const sortedImages = [...(product.images || [])].sort((a, b) => {
    if (a.is_primary) return -1;
    if (b.is_primary) return 1;
    return (a.sort_order || 0) - (b.sort_order || 0);
  });

  const getImageUrl = (img?: GalleryImage) => img?.public_url || img?.url || null;
  const primaryImageUrl = getImageUrl(sortedImages[0]) || '';

  const mediaImages: MediaItem[] = sortedImages
    .map((img, idx): MediaItem | null => {
      const url = getImageUrl(img);
      if (!url) return null;
      return {
        type: 'image',
        id: img.id || `img-${idx}`,
        url,
        sortOrder: img.is_primary ? -100 : (img.sort_order || idx),
      };
    })
    .filter((item): item is MediaItem => item !== null);

  const mediaVideos: MediaItem[] = [...(product.videos || [])]
    .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
    .map((vid, idx) => ({
      type: 'video' as const,
      id: vid.id || `vid-${idx}`,
      url: vid.public_url,
      posterUrl: vid.poster_url || primaryImageUrl,
      title: vid.title || null,
      sortOrder: vid.sort_order !== undefined ? vid.sort_order : 100 + idx,
    }));

  const allMediaItems: MediaItem[] = [...mediaImages, ...mediaVideos];

  const [activeMediaIndex, setActiveMediaIndex] = useState<number>(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  const activeMedia = allMediaItems[activeMediaIndex] || allMediaItems[0];

  // Pausar vídeo ao trocar a seleção da mídia
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.pause();
    }
  }, [activeMediaIndex]);

  const handleSelectMedia = (idx: number) => {
    if (videoRef.current) {
      videoRef.current.pause();
    }
    setActiveMediaIndex(idx);
  };

  const formattedPrice = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(Number(product.price));

  const hasDescription = !!product.description && product.description.trim().length > 0;
  const hasFinancing = !!product.financing_details && product.financing_details.trim().length > 0;

  return (
    <div className="w-full">
      {/* ================= DESKTOP VIEW (≥ lg) ================= */}
      <div className="hidden lg:grid grid-cols-12 bg-[#0B192C] rounded-3xl border border-slate-800 shadow-sm overflow-hidden min-h-[520px]">
        {/* Painel Esquerdo (~42%): Azul-Marinho Profundo */}
        <div className="col-span-5 p-10 flex flex-col justify-between space-y-6 z-10 bg-[#0B192C]">
          <div className="space-y-4">
            {/* Categoria */}
            <div className="flex items-center gap-2">
              <span className="text-sky-400 font-bold uppercase tracking-widest text-[11px]">
                {product.category?.name || 'Equipamentos Odontológicos'}
              </span>
            </div>

            {/* Nome do Produto */}
            <h1 className="text-3xl xl:text-4xl font-extrabold text-white tracking-tight leading-tight">
              {product.name}
            </h1>

            {/* Descrição Real (se cadastrada) */}
            {hasDescription && (
              <p className="text-slate-300 text-xs xl:text-sm font-light leading-relaxed whitespace-pre-line text-left line-clamp-4">
                {product.description}
              </p>
            )}

            {/* SKU & Estoque */}
            <div className="pt-2 flex flex-wrap items-center gap-3 border-t border-slate-800/80">
              <span className="text-slate-400 font-mono text-xs font-semibold">
                SKU: {product.sku || 'N/A'}
              </span>
              <span className="text-slate-700">•</span>
              <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 ${
                product.stock_quantity > 0 
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
              }`}>
                {product.stock_quantity > 0 ? (
                  <>
                    <PackageCheck className="w-3.5 h-3.5" />
                    Em Estoque ({product.stock_quantity} un)
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-3.5 h-3.5" />
                    Sob Encomenda
                  </>
                )}
              </span>
            </div>
          </div>

          {/* Preço e Botões */}
          <div className="space-y-5 pt-4 border-t border-slate-800/80">
            {/* Bloco de Preço */}
            <div>
              <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest block mb-1">
                {product.price > 0 ? 'Valor do Equipamento' : 'Preço'}
              </span>
              <div className="flex items-baseline gap-3">
                <h2 className="text-3xl xl:text-4xl font-black text-white tracking-tight">
                  {product.price > 0 ? formattedPrice : 'Sob Consulta'}
                </h2>
              </div>
              {hasFinancing && (
                <p className="text-sky-300 text-xs font-medium mt-1">
                  {product.financing_details}
                </p>
              )}
            </div>

            {/* Ações em Desktop */}
            <div className="grid grid-cols-2 gap-3">
              <Link
                href={quoteWhatsappUrl}
                target={whatsappNumber ? "_blank" : undefined}
                rel={whatsappNumber ? "noopener noreferrer" : undefined}
                className="bg-sky-500 hover:bg-sky-600 text-white font-extrabold text-xs uppercase tracking-wider py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all duration-200 hover:-translate-y-0.5 cursor-pointer text-center"
              >
                <MessageCircle className="w-4 h-4 shrink-0" />
                Solicitar cotação
              </Link>
              <Link
                href={specialistWhatsappUrl}
                target={whatsappNumber ? "_blank" : undefined}
                rel={whatsappNumber ? "noopener noreferrer" : undefined}
                className="bg-white/10 hover:bg-white/20 text-white border border-white/20 font-extrabold text-xs uppercase tracking-wider py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all duration-200 hover:-translate-y-0.5 cursor-pointer text-center"
              >
                <HelpCircle className="w-4 h-4 shrink-0" />
                Falar com especialista
              </Link>
            </div>
          </div>
        </div>

        {/* Painel Direito (~58%): Cinza Clínico Claro + Palco de Mídia (Imagem ou Player de Vídeo) */}
        <div className="col-span-7 bg-[#F8FAFC] p-10 flex flex-col justify-between items-center relative overflow-visible">
          {/* Mídia Principal Flutuante */}
          <div className="flex-1 w-full flex flex-col items-center justify-center -ml-16 z-20 relative py-4">
            {activeMedia ? (
              activeMedia.type === 'video' ? (
                <div className="w-full max-w-[540px] space-y-2">
                  <div className="w-full aspect-video rounded-2xl overflow-hidden shadow-lg border border-slate-200 bg-black">
                    <video
                      ref={videoRef}
                      src={activeMedia.url}
                      poster={activeMedia.posterUrl || primaryImageUrl}
                      controls
                      playsInline
                      preload="metadata"
                      autoPlay={false}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  {activeMedia.title && (
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-700 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs w-fit mx-auto">
                      <Film className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                      <span>{activeMedia.title}</span>
                    </div>
                  )}
                </div>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={activeMedia.url}
                  alt={product.name}
                  className="object-contain max-h-[440px] w-auto mx-auto filter drop-shadow-md transition-all duration-300 hover:scale-102"
                />
              )
            ) : (
              <div className="flex flex-col items-center justify-center space-y-3 p-8">
                <div className="bg-sky-100/60 text-sky-600 w-20 h-20 rounded-3xl flex items-center justify-center shadow-xs">
                  <svg className="w-10 h-10 text-sky-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M12 2c-.8 0-1.5.5-2 1.2a4.4 4.4 0 00-.7 2.2c0 2.1.8 3 1.2 5a3.8 3.8 0 01-.3 2.7c-.8 1.4-1.9 2.5-2.5 4.1C7 19.3 7 20.3 8 21c.8.6 1.8.6 2.5.1a4.6 4.6 0 001.5-2.6 4.6 4.6 0 001.5 2.6c.7.5 1.7.5 2.5-.1 1-.7 1-1.7.3-3.8-.6-1.6-1.7-2.7-2.5-4.1a3.8 3.8 0 01-.3-2.7c.4-2 1.2-2.9 1.2-5a4.4 4.4 0 00-.7-2.2c-.5-.7-1.2-1.2-2-1.2z" />
                  </svg>
                </div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                  Mídia em breve
                </span>
              </div>
            )}
          </div>

          {/* Miniaturas da Galeria em Desktop */}
          {allMediaItems.length > 1 && (
            <div className="flex items-center justify-center gap-3 z-30 pt-2 flex-wrap">
              {allMediaItems.map((item, idx) => {
                const isSelected = activeMediaIndex === idx;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectMedia(idx)}
                    className={`w-14 h-14 rounded-xl border p-1 transition-all bg-white cursor-pointer relative overflow-hidden ${
                      isSelected
                        ? 'border-sky-500 ring-2 ring-sky-200 shadow-xs scale-105 opacity-100'
                        : 'border-slate-200 hover:border-slate-300 opacity-60 hover:opacity-100'
                    }`}
                    title={item.type === 'video' ? (item.title || `Vídeo ${idx + 1}`) : `Imagem ${idx + 1}`}
                  >
                    {item.type === 'video' ? (
                      <div className="w-full h-full relative flex items-center justify-center bg-slate-900 rounded-lg overflow-hidden">
                        {item.posterUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={item.posterUrl}
                            alt={item.title || 'Vídeo'}
                            className="object-cover w-full h-full opacity-60"
                          />
                        ) : (
                          <div className="w-full h-full bg-slate-800" />
                        )}
                        <Play className="w-5 h-5 text-white absolute fill-white" />
                      </div>
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.url}
                        alt={`${product.name} - Imagem ${idx + 1}`}
                        className="object-contain w-full h-full rounded-lg"
                      />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ================= MOBILE VIEW (< lg) ================= */}
      <div className="lg:hidden flex flex-col space-y-6 bg-[#0B192C] rounded-2xl p-5 border border-slate-800 text-white">
        
        {/* 1 & 2. Categoria e Nome do Produto */}
        <div className="space-y-2 text-left">
          <span className="text-sky-400 font-bold uppercase tracking-widest text-[10px]">
            {product.category?.name || 'Equipamentos Odontológicos'}
          </span>
          <h1 className="text-2xl font-extrabold text-white leading-tight">
            {product.name}
          </h1>
          <div className="flex items-center gap-2 pt-1 text-slate-400 font-mono text-[11px]">
            <span>SKU: {product.sku || 'N/A'}</span>
            <span>•</span>
            <span className={product.stock_quantity > 0 ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
              {product.stock_quantity > 0 ? `Em Estoque (${product.stock_quantity} un)` : 'Sob Encomenda'}
            </span>
          </div>
        </div>

        {/* 3. Mídia Principal (Imagem ou Player de Vídeo) */}
        <div className="bg-[#F8FAFC] rounded-xl p-3 flex flex-col items-center justify-center min-h-[240px] shadow-xs">
          {activeMedia ? (
            activeMedia.type === 'video' ? (
              <div className="w-full space-y-2">
                <div className="w-full aspect-video rounded-lg overflow-hidden bg-black shadow-inner">
                  <video
                    ref={videoRef}
                    src={activeMedia.url}
                    poster={activeMedia.posterUrl || primaryImageUrl}
                    controls
                    playsInline
                    preload="metadata"
                    autoPlay={false}
                    className="w-full h-full object-contain"
                  />
                </div>
                {activeMedia.title && (
                  <div className="flex items-center justify-center gap-1.5 text-[11px] font-bold text-slate-700 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                    <Film className="w-3 h-3 text-sky-600 shrink-0" />
                    <span className="truncate">{activeMedia.title}</span>
                  </div>
                )}
              </div>
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={activeMedia.url}
                alt={product.name}
                className="object-contain max-h-[260px] w-auto mx-auto filter drop-shadow-sm"
              />
            )
          ) : (
            <div className="flex flex-col items-center justify-center space-y-2 py-8">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                Mídia em breve
              </span>
            </div>
          )}
        </div>

        {/* 4. Miniaturas da Galeria (se houver mais de 1) */}
        {allMediaItems.length > 1 && (
          <div className="flex items-center justify-center gap-2 overflow-x-auto no-scrollbar py-1">
            {allMediaItems.map((item, idx) => {
              const isSelected = activeMediaIndex === idx;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelectMedia(idx)}
                  className={`w-12 h-12 rounded-lg border p-1 transition-all bg-white shrink-0 cursor-pointer relative overflow-hidden ${
                    isSelected
                      ? 'border-sky-500 ring-2 ring-sky-200 opacity-100 scale-105'
                      : 'border-slate-200 opacity-60'
                  }`}
                >
                  {item.type === 'video' ? (
                    <div className="w-full h-full relative flex items-center justify-center bg-slate-900 rounded overflow-hidden">
                      {item.posterUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.posterUrl}
                          alt={item.title || 'Vídeo'}
                          className="object-cover w-full h-full opacity-60"
                        />
                      ) : (
                        <div className="w-full h-full bg-slate-800" />
                      )}
                      <Play className="w-4 h-4 text-white absolute fill-white" />
                    </div>
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.url}
                      alt={`${product.name} - ${idx + 1}`}
                      className="object-contain w-full h-full rounded"
                    />
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* 5. Descrição (apenas se cadastrada no banco) */}
        {hasDescription && (
          <div className="text-left text-slate-300 text-xs font-normal leading-relaxed whitespace-pre-line border-t border-slate-800 pt-4">
            {product.description}
          </div>
        )}

        {/* 6. Preço */}
        <div className="text-left border-t border-slate-800 pt-4 space-y-1">
          <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest block">
            {product.price > 0 ? 'Preço Sugerido' : 'Valor'}
          </span>
          <h2 className="text-2xl font-black text-white">
            {product.price > 0 ? formattedPrice : 'Sob Consulta'}
          </h2>
          {hasFinancing && (
            <p className="text-sky-300 text-xs font-medium">
              {product.financing_details}
            </p>
          )}
        </div>

        {/* 7. Botões em Largura Total */}
        <div className="flex flex-col gap-2.5 pt-2">
          <Link
            href={quoteWhatsappUrl}
            target={whatsappNumber ? "_blank" : undefined}
            rel={whatsappNumber ? "noopener noreferrer" : undefined}
            className="w-full bg-sky-500 hover:bg-sky-600 text-white font-extrabold text-xs uppercase tracking-wider py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all text-center cursor-pointer"
          >
            <MessageCircle className="w-4 h-4 shrink-0" />
            Solicitar cotação
          </Link>
          <Link
            href={specialistWhatsappUrl}
            target={whatsappNumber ? "_blank" : undefined}
            rel={whatsappNumber ? "noopener noreferrer" : undefined}
            className="w-full bg-white/10 hover:bg-white/20 text-white border border-white/20 font-extrabold text-xs uppercase tracking-wider py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all text-center cursor-pointer"
          >
            <HelpCircle className="w-4 h-4 shrink-0" />
            Falar com especialista
          </Link>
        </div>
      </div>
    </div>
  );
};
