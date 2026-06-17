'use client';

import React, { useState, useMemo } from 'react';
import { Search, X, MessageCircle, SlidersHorizontal } from 'lucide-react';
import { ProductCard } from '@/components/ui/ProductCard';

interface Product {
  id: string;
  name: string;
  slug?: string;
  price: number;
  category: string;
  imageUrl?: string;
  sku?: string;
  description?: string;
}

interface ProductCatalogProps {
  initialProducts: Product[];
  categories: string[];
  whatsappNumber?: string;
}

export const ProductCatalog: React.FC<ProductCatalogProps> = ({
  initialProducts = [],
  categories = [],
  whatsappNumber,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');

  // URL de WhatsApp para los CTAs generales del catálogo
  const createWhatsappUrl = (text: string) => {
    return whatsappNumber
      ? `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(text)}`
      : '/contato';
  };

  const urlSolicitarCotacao = createWhatsappUrl(
    'Olá! Gostaria de solicitar uma cotação para equipamentos odontológicos da M.MUNIZ.'
  );
  const urlFalarEspecialista = createWhatsappUrl(
    'Olá! Gostaria de falar com um especialista sobre os equipamentos odontológicos da M.MUNIZ.'
  );

  // Filtragem combinada
  const filteredProducts = useMemo(() => {
    return initialProducts.filter((product) => {
      // 1. Filtrar por categoría
      const matchesCategory =
        selectedCategory === 'Todos' || product.category === selectedCategory;

      if (!matchesCategory) return false;

      // 2. Filtrar por término de búsqueda
      const query = searchQuery.trim().toLowerCase();
      if (!query) return true;

      const nameMatch = product.name?.toLowerCase().includes(query) || false;
      const skuMatch = product.sku?.toLowerCase().includes(query) || false;
      const categoryMatch = product.category?.toLowerCase().includes(query) || false;
      const descriptionMatch = product.description?.toLowerCase().includes(query) || false;

      return nameMatch || skuMatch || categoryMatch || descriptionMatch;
    });
  }, [initialProducts, searchQuery, selectedCategory]);

  return (
    <div className="flex-1 flex flex-col bg-slate-50/50">
      {/* 1. Hero do Catálogo */}
      <section className="bg-gradient-to-b from-slate-900 to-brand-dark text-white py-16 md:py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0284c715_1px,transparent_1px),linear-gradient(to_bottom,#0284c715_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-6 text-center md:text-left">
          <div className="max-w-3xl space-y-4">
            <span className="inline-flex items-center gap-1.5 bg-brand-clinical/20 text-sky-400 text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
              Equipamentos de Alta Performance
            </span>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight">
              Catálogo de Equipamentos Odontológicos
            </h1>
            <p className="text-sm sm:text-base text-slate-300 max-w-2xl leading-relaxed">
              Conheça soluções selecionadas para estruturar, modernizar e manter seu consultório com suporte técnico especializado da M.MUNIZ.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start pt-2">
            <a
              href={urlSolicitarCotacao}
              target={whatsappNumber ? '_blank' : undefined}
              rel={whatsappNumber ? 'noopener noreferrer' : undefined}
              className="inline-flex items-center justify-center bg-brand-clinical hover:bg-sky-600 text-white text-xs font-bold px-6 py-3.5 rounded-xl uppercase tracking-wider transition-all shadow-md active:scale-98 cursor-pointer"
            >
              Solicitar cotação
            </a>
            <a
              href={urlFalarEspecialista}
              target={whatsappNumber ? '_blank' : undefined}
              rel={whatsappNumber ? 'noopener noreferrer' : undefined}
              className="inline-flex items-center justify-center bg-white/10 hover:bg-white/15 text-white border border-white/20 text-xs font-bold px-6 py-3.5 rounded-xl uppercase tracking-wider transition-all active:scale-98 cursor-pointer gap-2"
            >
              <MessageCircle className="w-4 h-4 text-emerald-400" />
              Falar com especialista
            </a>
          </div>
        </div>
      </section>

      {/* Seção principal de filtros e produtos */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 w-full flex-1 flex flex-col">
        {/* Controles de Busca e Filtros */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-5 md:p-6 space-y-5">
          {/* Busca e Título Interno */}
          <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-5 h-5 text-slate-400 hidden sm:block" />
              <div>
                <h2 className="text-base font-extrabold text-brand-dark">Filtros de Busca</h2>
                <p className="text-xs text-slate-400">Encontre o equipamento ideal para a sua necessidade</p>
              </div>
            </div>

            {/* Campo de Busca */}
            <div className="relative flex-1 max-w-md w-full ml-auto">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Search className="h-4.5 w-4.5 text-slate-400" />
              </div>
              <input
                type="text"
                placeholder="Busque por nome, SKU, categoria ou descrição..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-10 pr-10 py-3 text-xs bg-slate-50 border border-slate-200 text-slate-800 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-brand-clinical/20 focus:border-brand-clinical focus:bg-white transition-all placeholder-slate-400 font-medium"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-brand-dark transition-colors cursor-pointer"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              )}
            </div>
          </div>

          {/* Filtro de Categorias */}
          <div className="border-t border-slate-50 pt-4 space-y-3">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
              Categorias
            </span>
            <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar -mx-5 px-5 md:mx-0 md:px-0">
              {['Todos', ...categories].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`text-xs font-bold px-4 py-2.5 rounded-full border transition-all whitespace-nowrap active:scale-95 cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-brand-clinical text-white border-brand-clinical shadow-sm shadow-brand-clinical/10'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Informações dos Resultados e Grid */}
        <div className="space-y-4 flex-1 flex flex-col justify-start">
          {/* Contador Dinâmico */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium bg-slate-100/80 px-3 py-1.5 rounded-lg border border-slate-200/40">
              {filteredProducts.length === 0 ? (
                <>
                  <span className="font-extrabold text-brand-dark">0</span> equipamentos encontrados
                </>
              ) : filteredProducts.length === 1 ? (
                <>
                  <span className="font-extrabold text-brand-dark">1</span> equipamento encontrado
                </>
              ) : (
                <>
                  <span className="font-extrabold text-brand-dark">{filteredProducts.length}</span> equipamentos encontrados
                </>
              )}
            </span>
          </div>

          {/* Listagem ou Estado Vazio */}
          {filteredProducts.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-100 p-8 md:p-16 text-center max-w-lg mx-auto w-full my-8 shadow-xs flex flex-col items-center justify-center space-y-6">
              {/* Ícono clínico decorativo */}
              <div className="bg-sky-50 text-brand-clinical w-16 h-16 rounded-2xl flex items-center justify-center border border-sky-100/30 shadow-xs">
                <Search className="w-8 h-8 stroke-[1.5]" />
              </div>
              <div className="space-y-2 max-w-sm">
                <h3 className="text-lg font-black text-brand-dark">
                  Nenhum equipamento encontrado
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed font-medium">
                  Tente ajustar os filtros ou fale com a M.MUNIZ para encontrar a solução ideal para seu consultório.
                </p>
              </div>
              <div className="pt-2">
                <a
                  href={urlFalarEspecialista}
                  target={whatsappNumber ? '_blank' : undefined}
                  rel={whatsappNumber ? 'noopener noreferrer' : undefined}
                  className="inline-flex items-center justify-center bg-brand-clinical hover:bg-sky-600 text-white text-xs font-bold px-6 py-3.5 rounded-xl uppercase tracking-wider transition-all shadow-xs cursor-pointer gap-2 active:scale-98"
                >
                  <MessageCircle className="w-4 h-4 text-emerald-400" />
                  Falar com especialista
                </a>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} {...product} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
