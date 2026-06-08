import React from 'react';
import { ProductCard } from '@/components/ui/ProductCard';

export default function ProductsPage() {
  const dummyProducts = [
    {
      id: '1',
      name: 'Cadeira Odontológica Premium S500',
      slug: 'cadeira-odontologica-premium-s500',
      price: 24500.00,
      category: 'Cadeiras',
      sku: 'CAD-S500',
    },
    {
      id: '2',
      name: 'Autoclave Digital Biossegurança 12L',
      slug: 'autoclave-digital-biosseguranca-12l',
      price: 4200.00,
      category: 'Autoclaves',
      sku: 'AUT-12L',
    },
    {
      id: '3',
      name: 'Aparelho de Raio-X Intraoral Parede',
      slug: 'aparelho-de-raio-x-intraoral-parede',
      price: 8900.00,
      category: 'Imagem',
      sku: 'XRAY-INTRA',
    },
    {
      id: '4',
      name: 'Caneta de Alta Rotação Cobra LED',
      slug: 'caneta-de-alta-rotacao-cobra-led',
      price: 1150.00,
      category: 'Periféricos',
      sku: 'PEN-LED',
    },
    {
      id: '5',
      name: 'Compressor de Ar Odontológico Isento de Óleo',
      slug: 'compressor-de-ar-odontologico-isento-de-oleo',
      price: 3800.00,
      category: 'Compressores',
      sku: 'COMP-OILFREE',
    },
    {
      id: '6',
      name: 'Bomba de Vácuo Odontológica 1/2 HP',
      slug: 'bomba-de-vacuo-odontologica-12-hp',
      price: 2900.00,
      category: 'Compressores',
      sku: 'VAC-05HP',
    },
  ];

  const categories = ['Todos', 'Cadeiras', 'Autoclaves', 'Imagem', 'Periféricos', 'Compressores'];

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

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {dummyProducts.map((product) => (
            <ProductCard key={product.id} {...product} />
          ))}
        </div>
      </div>
    </div>
  );
}
