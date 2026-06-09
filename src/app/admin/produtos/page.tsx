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

  // Filtrar productos
  const filteredProducts = products.filter(p => {
    const text = searchTerm.toLowerCase();
    const name = p.name.toLowerCase();
    const sku = (p.sku || '').toLowerCase();
    const desc = (p.description || '').toLowerCase();
    const catName = (p.category?.name || '').toLowerCase();

    return name.includes(text) || sku.includes(text) || desc.includes(text) || catName.includes(text);
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-extrabold text-brand-dark tracking-tight flex items-center gap-2">
            <Package className="w-7 h-7 text-brand-clinical" />
            Gestão de Produtos
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Gerencie o catálogo de equipamentos odontológicos, consumíveis, peças e produtos gerais para comercialização.
          </p>
        </div>
        <button
          onClick={() => openModal()}
          className="bg-brand-clinical hover:bg-sky-700 text-white text-xs font-bold px-4 py-2.5 rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-sm"
        >
          <Plus className="w-4 h-4" /> Novo Produto
        </button>
      </div>

      {/* Listado */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between pb-2 border-b border-slate-50">
          <h3 className="font-bold text-sm text-brand-dark flex items-center gap-1.5">
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
              className="w-full pl-9 pr-4 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-brand-clinical bg-slate-50/50"
            />
          </div>
        </div>

        {loading && products.length === 0 ? (
          <div className="text-center py-12 text-slate-400 font-medium text-xs">
            Carregando catálogo de produtos...
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-12 text-slate-400 font-medium text-xs border-2 border-dashed border-slate-100 rounded-xl">
            Nenhum produto cadastrado ou encontrado.
          </div>
        ) : (
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="text-slate-400 font-bold border-b border-slate-100">
                  <th className="pb-3">SKU</th>
                  <th className="pb-3 px-2">Produto</th>
                  <th className="pb-3 px-2">Categoria</th>
                  <th className="pb-3 px-2">Tipo</th>
                  <th className="pb-3 px-2 text-right">Preço Unitário</th>
                  <th className="pb-3 px-2 text-center">Estoque</th>
                  <th className="pb-3 text-center">Status</th>
                  <th className="pb-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredProducts.map((prod) => (
                  <tr key={prod.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 font-mono font-bold text-slate-500">
                      {prod.sku || '—'}
                    </td>
                    <td className="py-4 px-2 font-bold text-brand-dark">
                      <div>{prod.name}</div>
                      {prod.description && (
                        <div className="text-[10px] text-slate-400 font-normal font-sans line-clamp-1 max-w-xs">
                          {prod.description}
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-2 text-slate-500 font-semibold">
                      {prod.category?.name || 'Sem Categoria'}
                    </td>
                    <td className="py-4 px-2">
                      <span className="text-[10px] font-bold text-slate-600 capitalize">
                        {prod.product_type}
                      </span>
                    </td>
                    <td className="py-4 px-2 text-right font-extrabold text-brand-dark">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(prod.price)}
                    </td>
                    <td className="py-4 px-2 text-center font-bold text-slate-800">
                      {prod.stock_quantity} un
                    </td>
                    <td className="py-4 text-center">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        prod.is_active 
                          ? 'bg-success-bg text-success-text' 
                          : 'bg-slate-100 text-slate-500'
                      }`}>
                        {prod.is_active ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openModal(prod)}
                          className="p-1.5 text-slate-400 hover:text-brand-clinical rounded-md hover:bg-slate-100 transition-colors"
                          title="Editar Produto"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(prod.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md hover:bg-slate-100 transition-colors"
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
