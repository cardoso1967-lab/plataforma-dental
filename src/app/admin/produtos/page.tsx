'use client';

import React, { useEffect, useState } from 'react';
import { 
  Package, Plus, Search, Edit2, Trash2, 
  X, Tag, DollarSign, Archive, Layers, RefreshCw
} from 'lucide-react';
import { createSupabaseBrowserClient } from '@/lib/supabase';
import { useAuth } from '@/components/AuthProvider';

interface Category {
  id: string;
  name: string;
}

interface Product {
  id: string;
  category_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  sku: string | null;
  product_type: 'equipamento' | 'peca' | 'insumo' | 'outro';
  stock_quantity: number;
  is_active: boolean;
  created_at: string;
  category?: Category | null;
}

export default function AdminProdutosPage() {
  const supabase = createSupabaseBrowserClient();
  const { profile: adminProfile } = useAuth();

  // Estados de datos
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estados de búsqueda
  const [searchTerm, setSearchTerm] = useState('');

  // Estados de modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Formulario
  const [formProduct, setFormProduct] = useState({
    sku: '',
    name: '',
    description: '',
    price: '',
    stock_quantity: '',
    product_type: 'equipamento' as Product['product_type'],
    category_id: '',
    is_active: true,
  });

  // Generar Slug automáticamente
  const generateSlug = (text: string) => {
    return text
      .toString()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]+/g, '')
      .replace(/\-\-+/g, '-')
      .replace(/^-+/, '')
      .replace(/-+$/, '');
  };

  // Cargar datos
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. Obtener productos con categorías
      const { data: prodData, error: prodError } = await supabase
        .from('products')
        .select(`
          *,
          category:product_categories(id, name)
        `)
        .order('name', { ascending: true });

      if (prodError) throw prodError;
      setProducts(prodData || []);

      // 2. Obtener categorías
      const { data: catData, error: catError } = await supabase
        .from('product_categories')
        .select('id, name')
        .order('name', { ascending: true });

      if (catError) throw catError;
      setCategories(catData || []);

    } catch (err: any) {
      console.error('Erro ao carregar produtos:', err);
      setError(err.message || 'Erro ao carregar dados do servidor.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Abrir modal
  const openModal = (product: Product | null = null) => {
    setEditingProduct(product);
    if (product) {
      setFormProduct({
        sku: product.sku || '',
        name: product.name || '',
        description: product.description || '',
        price: product.price.toString() || '',
        stock_quantity: product.stock_quantity.toString() || '',
        product_type: product.product_type || 'equipamento',
        category_id: product.category_id || '',
        is_active: product.is_active,
      });
    } else {
      setFormProduct({
        sku: '',
        name: '',
        description: '',
        price: '',
        stock_quantity: '0',
        product_type: 'equipamento',
        category_id: '',
        is_active: true,
      });
    }
    setIsModalOpen(true);
  };

  // Guardar producto
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formProduct.name.trim() || !formProduct.price) return;

    try {
      setLoading(true);
      const generatedSlug = generateSlug(formProduct.name);
      
      // Validar si el slug ya existe (excepto para el producto actual) para evitar errores de llave única
      let uniqueSlug = generatedSlug;
      let counter = 1;
      let isUnique = false;
      
      while (!isUnique) {
        const query = supabase
          .from('products')
          .select('id')
          .eq('slug', uniqueSlug);
          
        if (editingProduct) {
          query.neq('id', editingProduct.id);
        }
        
        const { data: existing } = await query;
        if (existing && existing.length > 0) {
          uniqueSlug = `${generatedSlug}-${counter}`;
          counter++;
        } else {
          isUnique = true;
        }
      }

      const payload = {
        sku: formProduct.sku || null,
        name: formProduct.name,
        slug: uniqueSlug,
        description: formProduct.description || null,
        price: parseFloat(formProduct.price),
        stock_quantity: parseInt(formProduct.stock_quantity) || 0,
        product_type: formProduct.product_type,
        category_id: formProduct.category_id || null,
        is_active: formProduct.is_active,
      };

      if (editingProduct) {
        const { error: saveError } = await supabase
          .from('products')
          .update(payload)
          .eq('id', editingProduct.id);
        if (saveError) throw saveError;
      } else {
        const { error: saveError } = await supabase
          .from('products')
          .insert(payload);
        if (saveError) throw saveError;
      }

      setIsModalOpen(false);
      setEditingProduct(null);
      await loadData();
    } catch (err: any) {
      alert('Erro ao salvar produto: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Eliminar producto
  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir este produto?')) return;

    try {
      setLoading(true);
      const { error: delError } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (delError) throw delError;
      await loadData();
    } catch (err: any) {
      alert('Erro ao excluir produto: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(p => {
    const text = searchTerm.toLowerCase();
    const name = p.name.toLowerCase();
    const sku = (p.sku || '').toLowerCase();
    const desc = (p.description || '').toLowerCase();
    const catName = (p.category?.name || '').toLowerCase();

    return name.includes(text) || sku.includes(text) || desc.includes(text) || catName.includes(text);
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header Premium */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-100 pb-5">
        <div className="space-y-1 text-left">
          <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2.5">
            <div className="p-2 bg-purple-50 text-purple-650 rounded-2xl shadow-2xs">
              <Package className="w-6 h-6" />
            </div>
            Gestão de Produtos
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Gerencie o catálogo de equipamentos odontológicos, consumíveis, peças e produtos gerais para comercialização.
          </p>
        </div>
        <button
          onClick={() => openModal()}
          className="bg-brand-clinical hover:bg-sky-700 hover:shadow-md text-white text-xs font-bold px-4.5 py-2.5 rounded-xl transition-all duration-200 flex items-center justify-center gap-1.5 shadow-sm hover:scale-[1.02] active:scale-[0.98] self-start md:self-center"
        >
          <Plus className="w-4 h-4" /> Novo Produto
        </button>
      </div>

      {/* Métricas rápidas de catálogo */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4.5 rounded-2xl border border-slate-100 shadow-2xs text-left">
          <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest block font-sans">Produtos Registrados</span>
          <p className="text-lg font-black text-slate-800">{products.length}</p>
          <span className="text-[9.5px] text-slate-400 font-medium">Total do portfólio</span>
        </div>
        <div className="bg-white p-4.5 rounded-2xl border border-slate-100 shadow-2xs text-left">
          <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest block font-sans">Equipamentos Clínicos</span>
          <p className="text-lg font-black text-purple-600">{products.filter(p => p.product_type === 'equipamento').length}</p>
          <span className="text-[9.5px] text-slate-400 font-medium">Cadeiras, Autoclaves, etc.</span>
        </div>
        <div className="bg-white p-4.5 rounded-2xl border border-slate-100 shadow-2xs text-left">
          <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest block font-sans">Peças e Insumos</span>
          <p className="text-lg font-black text-slate-850">{products.filter(p => p.product_type === 'peca' || p.product_type === 'insumo').length}</p>
          <span className="text-[9.5px] text-slate-400 font-medium">Itens de reposição</span>
        </div>
        <div className="bg-white p-4.5 rounded-2xl border border-slate-100 shadow-2xs text-left">
          <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest block font-sans">Estoque Crítico</span>
          <p className="text-lg font-black text-rose-600">{products.filter(p => p.stock_quantity === 0).length}</p>
          <span className="text-[9.5px] text-rose-600/80 font-bold">Sem unidades em estoque</span>
        </div>
      </div>

      {/* Listado */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-xs p-6 space-y-5">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between pb-2 border-b border-slate-50">
          <h3 className="font-extrabold text-sm text-slate-800 flex items-center gap-1.5 text-left">
            Produtos no Portfólio ({filteredProducts.length})
          </h3>
          
          {/* Buscador */}
          <div className="relative w-full sm:max-w-xs">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar SKU, nome, categoria..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-brand-clinical focus:ring-2 focus:ring-sky-100 bg-slate-50/40 transition-all text-slate-700 font-sans"
            />
          </div>
        </div>

        {loading && products.length === 0 ? (
          <div className="text-center py-12 text-slate-400 font-medium text-xs">
            Carregando catálogo de produtos...
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center border border-dashed border-slate-200 rounded-2xl bg-slate-50/20 shadow-3xs">
            <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center mb-4 border border-sky-100/50">
              <Package className="w-6 h-6" />
            </div>
            <h4 className="font-extrabold text-slate-800 text-sm mb-1.5">Catálogo de Produtos Vazio</h4>
            <p className="text-xs text-slate-400 font-medium max-w-sm leading-relaxed mb-4">
              Cadastre o seu primeiro produto (equipamentos odontológicos, peças de reposição ou insumos) para disponibilizá-los na plataforma.
            </p>
            <button
              onClick={() => openModal()}
              className="bg-brand-clinical hover:bg-sky-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all duration-200 shadow-sm hover:scale-[1.02] active:scale-[0.98]"
            >
              Cadastrar Produto
            </button>
          </div>
        ) : (
          <>
            {/* Tabela para Desktop */}
            <div className="hidden md:block overflow-x-auto no-scrollbar">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="text-slate-400 font-bold border-b border-slate-100">
                    <th className="pb-3 pr-2 pl-2">SKU</th>
                    <th className="pb-3 px-2">Produto</th>
                    <th className="pb-3 px-2">Categoria</th>
                    <th className="pb-3 px-2">Tipo</th>
                    <th className="pb-3 px-2 text-right">Preço Unitário</th>
                    <th className="pb-3 px-2 text-center">Estoque</th>
                    <th className="pb-3 text-center">Status</th>
                    <th className="pb-3 pr-2 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredProducts.map((prod) => (
                    <tr key={prod.id} className="hover:bg-slate-55/30 transition-all duration-150">
                      <td className="py-4 pr-2 pl-2 font-mono font-black text-slate-450 text-[10px]">
                        {prod.sku || '—'}
                      </td>
                      <td className="py-4 px-2 text-left">
                        <div className="font-extrabold text-slate-800 text-xs">{prod.name}</div>
                        {prod.description && (
                          <div className="text-[10px] text-slate-400 font-medium font-sans line-clamp-1 max-w-xs leading-normal">
                            {prod.description}
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-2 text-slate-500 font-bold">
                        {prod.category?.name || 'Sem Categoria'}
                      </td>
                      <td className="py-4 px-2">
                        <span className="text-[9.5px] font-extrabold text-slate-600 capitalize bg-slate-100/80 px-2 py-0.5 rounded-md border border-slate-200/50">
                          {prod.product_type}
                        </span>
                      </td>
                      <td className="py-4 px-2 text-right font-black text-slate-900">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(prod.price)}
                      </td>
                      <td className="py-4 px-2 text-center">
                        <span className={`font-black text-xs ${prod.stock_quantity === 0 ? 'text-rose-600 animate-pulse' : 'text-slate-800'}`}>
                          {prod.stock_quantity} un
                        </span>
                      </td>
                      <td className="py-4 text-center">
                        <span className={`text-[9.5px] font-extrabold px-2.5 py-0.5 rounded-full border uppercase tracking-wider shadow-2xs ${
                          prod.is_active 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                            : 'bg-slate-100 text-slate-500 border-slate-200'
                        }`}>
                          {prod.is_active ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="py-4 pr-2 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openModal(prod)}
                            className="p-1.5 text-slate-400 hover:text-brand-clinical rounded-lg hover:bg-slate-50 transition-colors"
                            title="Editar Produto"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(prod.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-50 transition-colors"
                            title="Excluir Produto"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Cards para Mobile */}
            <div className="grid grid-cols-1 gap-4 md:hidden">
              {filteredProducts.map((prod) => (
                <div 
                  key={prod.id}
                  className="bg-slate-50/20 border border-slate-100/80 rounded-2xl p-4.5 space-y-4 text-left shadow-2xs hover:shadow-xs transition-shadow duration-300"
                >
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <span className="text-[9px] font-mono font-black text-slate-400 block">{prod.sku || 'Sem SKU'}</span>
                      <h4 className="font-extrabold text-slate-850 text-xs leading-snug">{prod.name}</h4>
                      {prod.category?.name && (
                        <p className="text-[9.5px] text-slate-450 font-bold">{prod.category.name}</p>
                      )}
                    </div>
                    <span className={`text-[8.5px] font-black px-2.5 py-0.5 rounded-full border uppercase tracking-wider shadow-2xs flex-shrink-0 ${
                      prod.is_active 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                        : 'bg-slate-100 text-slate-500 border-slate-200'
                    }`}>
                      {prod.is_active ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-xs border-t border-slate-50/80 pt-3 font-bold text-slate-600">
                    <div>
                      Preço: <span className="text-slate-850 font-black">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(prod.price)}</span>
                    </div>
                    <div>
                      Estoque: <span className={`font-black ${prod.stock_quantity === 0 ? 'text-rose-600 animate-pulse' : 'text-slate-850'}`}>{prod.stock_quantity} un</span>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 border-t border-slate-50/80 pt-3">
                    <button
                      onClick={() => openModal(prod)}
                      className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-black text-slate-700 transition-all flex items-center gap-1 shadow-2xs hover:scale-[1.01]"
                    >
                      <Edit2 className="w-3 h-3 text-slate-450" /> Editar
                    </button>
                    <button
                      onClick={() => handleDelete(prod.id)}
                      className="px-3.5 py-2 bg-rose-50/50 hover:bg-rose-100 border border-rose-100 rounded-xl text-[10px] font-black text-rose-700 transition-all flex items-center gap-1 shadow-2xs hover:scale-[1.01]"
                    >
                      <Trash2 className="w-3 h-3 text-rose-455" /> Excluir
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Modal Produto */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 transition-all">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-100 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-extrabold text-sm text-brand-dark flex items-center gap-1.5">
                <Package className="w-5 h-5 text-brand-clinical" />
                {editingProduct ? 'Editar Produto' : 'Novo Produto'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 text-left">
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-1 space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Código SKU</label>
                  <input
                    type="text"
                    value={formProduct.sku}
                    onChange={(e) => setFormProduct({ ...formProduct, sku: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:outline-none focus:border-brand-clinical focus:ring-2 focus:ring-sky-100 transition-all bg-slate-50/20 font-mono"
                    placeholder="CAD-S500"
                  />
                </div>
                <div className="col-span-2 space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Nome do Produto *</label>
                  <input
                    type="text"
                    required
                    value={formProduct.name}
                    onChange={(e) => setFormProduct({ ...formProduct, name: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:outline-none focus:border-brand-clinical focus:ring-2 focus:ring-sky-100 transition-all bg-slate-50/20"
                    placeholder="Ex: Cadeira Odontológica Premium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Tipo de Produto *</label>
                  <select
                    value={formProduct.product_type}
                    onChange={(e) => setFormProduct({ ...formProduct, product_type: e.target.value as Product['product_type'] })}
                    className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:outline-none focus:border-brand-clinical focus:ring-2 focus:ring-sky-100 transition-all bg-slate-50/20 bg-white"
                  >
                    <option value="equipamento">Equipamento</option>
                    <option value="peca">Peça</option>
                    <option value="insumo">Insumo</option>
                    <option value="outro">Outro</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Categoria</label>
                  <select
                    value={formProduct.category_id}
                    onChange={(e) => setFormProduct({ ...formProduct, category_id: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:outline-none focus:border-brand-clinical focus:ring-2 focus:ring-sky-100 transition-all bg-slate-50/20 bg-white"
                  >
                    <option value="">Nenhuma Categoria</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Preço de Venda (R$) *</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">R$</span>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={formProduct.price}
                      onChange={(e) => setFormProduct({ ...formProduct, price: e.target.value })}
                      className="w-full pl-9 border border-slate-200 rounded-xl p-2.5 text-xs focus:outline-none focus:border-brand-clinical focus:ring-2 focus:ring-sky-100 transition-all bg-slate-50/20 font-semibold"
                      placeholder="0,00"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Estoque Disponível</label>
                  <input
                    type="number"
                    value={formProduct.stock_quantity}
                    onChange={(e) => setFormProduct({ ...formProduct, stock_quantity: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:outline-none focus:border-brand-clinical focus:ring-2 focus:ring-sky-100 transition-all bg-slate-50/20 font-semibold"
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Descrição do Produto</label>
                <textarea
                  value={formProduct.description}
                  onChange={(e) => setFormProduct({ ...formProduct, description: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:outline-none focus:border-brand-clinical focus:ring-2 focus:ring-sky-100 transition-all bg-slate-50/20 min-h-[90px]"
                  placeholder="Detalhamento técnico, voltagem, garantias e demais especificações..."
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="prod_active"
                  checked={formProduct.is_active}
                  onChange={(e) => setFormProduct({ ...formProduct, is_active: e.target.checked })}
                  className="w-4 h-4 border border-slate-200 rounded-xl text-brand-clinical focus:ring-brand-clinical cursor-pointer"
                />
                <label htmlFor="prod_active" className="text-xs font-bold text-slate-600 cursor-pointer select-none">
                  Produto Ativo (Visível no catálogo público)
                </label>
              </div>

              {/* Botões Ação */}
              <div className="flex justify-end gap-3 pt-6 border-t border-slate-100 bg-slate-50 -mx-6 -mb-6 p-6 rounded-b-2xl">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="bg-transparent hover:bg-slate-100 text-slate-600 font-bold text-xs px-4 py-2.5 rounded-xl border border-slate-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-brand-clinical hover:bg-sky-700 text-white font-bold text-xs px-4.5 py-2.5 rounded-xl transition-all shadow-sm disabled:opacity-50 min-w-[120px]"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-1">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Salvando...
                    </span>
                  ) : 'Salvar Produto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
