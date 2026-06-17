'use client';

import React, { useEffect, useState } from 'react';
import { PageHero } from '@/components/ui/PageHero';
import { EmptyState } from '@/components/ui/EmptyState';
import { PremiumButton } from '@/components/ui/PremiumButton';
import { PremiumInput } from '@/components/ui/PremiumInput';
import { PremiumModal } from '@/components/ui/PremiumModal';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { MetricCard } from '@/components/ui/MetricCard';
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
  primaryImageUrl?: string | null;
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
  const [imageLoadError, setImageLoadError] = useState(false);

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
    imageUrl: '',
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

      // 1. Obtener productos con categorías e imagem primária
      const { data: prodData, error: prodError } = await supabase
        .from('products')
        .select(`
          *,
          category:product_categories(id, name),
          images:product_images(url, is_primary)
        `)
        .order('name', { ascending: true });

      if (prodError) throw prodError;

      // Enriquecer com URL da imagem primária
      const enriched = (prodData || []).map((p: any) => ({
        ...p,
        primaryImageUrl: p.images?.find((img: any) => img.is_primary)?.url
          || p.images?.[0]?.url
          || null,
      }));
      setProducts(enriched);

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
    setImageLoadError(false);
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
        imageUrl: product.primaryImageUrl || '',
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
        imageUrl: '',
      });
    }
    setIsModalOpen(true);
  };

  // Guardar producto
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formProduct.name.trim() || !formProduct.price) return;

    // Validação da URL da imagem
    const url = formProduct.imageUrl.trim();
    if (url) {
      if (!/^https?:\/\//i.test(url)) {
        alert("Informe o link direto da imagem. O link informado parece ser uma página de produto, não uma imagem.");
        return;
      }
      const cleanUrl = url.split(/[?#]/)[0];
      const hasValidExt = /\.(jpg|jpeg|png|webp|avif)$/i.test(cleanUrl);
      if (!hasValidExt) {
        alert("Informe o link direto da imagem. O link informado parece ser uma página de produto, não uma imagem.");
        return;
      }
    }

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

        // Salvar imagem primária — upsert na product_images do produto editado
        if (formProduct.imageUrl.trim()) {
          // Atualizar registro existente ou criar novo
          const { data: existingImg, error: checkImgError } = await supabase
            .from('product_images')
            .select('id')
            .eq('product_id', editingProduct.id)
            .eq('is_primary', true)
            .maybeSingle();

          if (checkImgError) {
            console.error("Erro ao verificar imagem existente no Supabase:", checkImgError);
            throw new Error(`Erro ao verificar imagem existente: ${checkImgError.message}`);
          }

          if (existingImg) {
            const { error: updateImgError } = await supabase
              .from('product_images')
              .update({ url: formProduct.imageUrl.trim() })
              .eq('id', existingImg.id);
            if (updateImgError) {
              console.error("Erro ao atualizar imagem no Supabase:", updateImgError);
              throw new Error(`Erro ao atualizar imagem do produto: ${updateImgError.message}`);
            }
          } else {
            const { error: insertImgError } = await supabase
              .from('product_images')
              .insert({
                product_id: editingProduct.id,
                url: formProduct.imageUrl.trim(),
                is_primary: true,
              });
            if (insertImgError) {
              console.error("Erro ao inserir imagem no Supabase:", insertImgError);
              throw new Error(`Erro ao salvar imagem do produto: ${insertImgError.message}`);
            }
          }
        } else {
          // Se a URL estiver vazia, mas existia imagem, podemos removê-la para sincronizar com o admin
          const { error: deleteImgError } = await supabase
            .from('product_images')
            .delete()
            .eq('product_id', editingProduct.id)
            .eq('is_primary', true);
          if (deleteImgError) {
            console.error("Erro ao remover imagem do Supabase:", deleteImgError);
            throw new Error(`Erro ao remover imagem do produto: ${deleteImgError.message}`);
          }
        }
      } else {
        const { data: newProd, error: saveError } = await supabase
          .from('products')
          .insert(payload)
          .select('id')
          .single();
        if (saveError) throw saveError;

        // Salvar imagem primária para o produto recém-criado
        if (formProduct.imageUrl.trim() && newProd?.id) {
          const { error: insertImgError } = await supabase
            .from('product_images')
            .insert({
              product_id: newProd.id,
              url: formProduct.imageUrl.trim(),
              is_primary: true,
            });
          if (insertImgError) {
            console.error("Erro ao salvar imagem para novo produto no Supabase:", insertImgError);
            throw new Error(`Erro ao salvar imagem do novo produto: ${insertImgError.message}`);
          }
        }
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
      <PageHero
        title="Gestão de Produtos"
        description="Gerencie o catálogo de equipamentos odontológicos, consumíveis, peças e produtos gerais para comercialização."
        badge="Catálogo e Inventário"
        icon={Package}
        variant="compact"
        rightElement={
          <PremiumButton
            onClick={() => openModal()}
            icon={<Plus className="w-4 h-4" />}
            variant="primary"
          >
            Novo Produto
          </PremiumButton>
        }
      />

      {/* Métricas rápidas de catálogo */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Produtos Registrados"
          value={products.length}
          description="Total do portfólio"
          variant="default"
        />
        <MetricCard
          title="Equipamentos Clínicos"
          value={products.filter(p => p.product_type === 'equipamento').length}
          description="Cadeiras, Autoclaves, etc."
          variant="indigo"
        />
        <MetricCard
          title="Peças e Insumos"
          value={products.filter(p => p.product_type === 'peca' || p.product_type === 'insumo').length}
          description="Itens de reposição"
          variant="default"
        />
        <MetricCard
          title="Estoque Crítico"
          value={products.filter(p => p.stock_quantity === 0).length}
          description="Sem unidades em estoque"
          icon={<Archive className="w-4.5 h-4.5 text-rose-500" />}
          variant="rose"
        />
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
              className="w-full pl-9 pr-4 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-brand-clinical focus:ring-2 focus:ring-sky-100 bg-slate-50/20 transition-all text-slate-700 font-sans"
            />
          </div>
        </div>

        {loading && products.length === 0 ? (
          <div className="text-center py-12 text-slate-400 font-medium text-xs">
            Carregando catálogo de produtos...
          </div>
        ) : filteredProducts.length === 0 ? (
          <EmptyState
            title="Catálogo de Produtos Vazio"
            description="Cadastre o seu primeiro produto (equipamentos odontológicos, peças de reposição ou insumos) para disponibilizá-los na plataforma."
            icon={<Package className="w-6 h-6 text-sky-600" />}
            actionLabel="Cadastrar Produto"
            onActionClick={() => openModal()}
            variant="panel"
          />
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
                        <StatusBadge
                          label={prod.product_type}
                          type={prod.product_type === 'equipamento' ? 'indigo' : prod.product_type === 'peca' ? 'info' : 'neutral'}
                        />
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
                        <StatusBadge
                          label={prod.is_active ? 'Ativo' : 'Inativo'}
                          type={prod.is_active ? 'success' : 'neutral'}
                        />
                      </td>
                      <td className="py-4 pr-2 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openModal(prod)}
                            className="p-1.5 text-slate-450 hover:text-sky-655 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                            title="Editar Produto"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(prod.id)}
                            className="p-1.5 text-slate-450 hover:text-rose-650 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
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
      <PremiumModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingProduct ? 'Editar Produto' : 'Novo Produto'}
        size="lg"
      >
        <form onSubmit={handleSave} className="space-y-4 text-left">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <PremiumInput
              label="Código SKU"
              name="sku"
              value={formProduct.sku}
              onChange={(e) => setFormProduct({ ...formProduct, sku: e.target.value })}
              placeholder="CAD-S500"
              className="font-mono"
            />
            <PremiumInput
              label="Nome do Produto"
              name="name"
              required
              value={formProduct.name}
              onChange={(e) => setFormProduct({ ...formProduct, name: e.target.value })}
              placeholder="Ex: Cadeira Odontológica Premium"
              className="md:col-span-2"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <PremiumInput
              label="Tipo de Produto"
              name="product_type"
              as="select"
              value={formProduct.product_type}
              onChange={(e) => setFormProduct({ ...formProduct, product_type: e.target.value as Product['product_type'] })}
              placeholder="Selecione um tipo..."
              options={[
                { value: 'equipamento', label: 'Equipamento' },
                { value: 'peca', label: 'Peça' },
                { value: 'insumo', label: 'Insumo' },
                { value: 'outro', label: 'Outro' }
              ]}
            />
            <PremiumInput
              label="Categoria"
              name="category_id"
              as="select"
              value={formProduct.category_id}
              onChange={(e) => setFormProduct({ ...formProduct, category_id: e.target.value })}
              placeholder="Nenhuma Categoria"
              options={categories.map(c => ({ value: c.id, label: c.name }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <PremiumInput
              label="Preço de Venda (R$)"
              name="price"
              type="number"
              required
              value={formProduct.price}
              onChange={(e) => setFormProduct({ ...formProduct, price: e.target.value })}
              placeholder="0,00"
            />
            <PremiumInput
              label="Estoque Disponível"
              name="stock_quantity"
              type="number"
              value={formProduct.stock_quantity}
              onChange={(e) => setFormProduct({ ...formProduct, stock_quantity: e.target.value })}
              placeholder="0"
            />
          </div>

          <PremiumInput
            label="Descrição do Produto"
            name="description"
            as="textarea"
            value={formProduct.description || ''}
            onChange={(e) => setFormProduct({ ...formProduct, description: e.target.value })}
            placeholder="Detalhamento técnico, voltagem, garantias e demais especificações..."
            rows={3}
          />

          {/* Campo de URL da Imagem Principal */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
              URL da Imagem Principal
              <span className="ml-1 text-slate-400 font-medium normal-case">(opcional)</span>
            </label>
            <input
              type="url"
              name="imageUrl"
              value={formProduct.imageUrl || ''}
              onChange={(e) => {
                setFormProduct({ ...formProduct, imageUrl: e.target.value });
                setImageLoadError(false);
              }}
              placeholder="https://exemplo.com/imagem-produto.jpg"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-400 transition-all"
            />
            <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
              Use o link direto da imagem, terminando em .jpg, .jpeg, .png, .webp ou .avif. Não use o link da página do produto.
            </p>
            {formProduct.imageUrl && (
              <div className="mt-2 space-y-2">
                <div className="flex items-center gap-3 p-2 bg-slate-50 rounded-xl border border-slate-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {!imageLoadError && (
                    <img
                      src={formProduct.imageUrl}
                      alt="Pré-visualização"
                      className="w-12 h-12 object-contain rounded-lg border border-slate-200 bg-white flex-shrink-0"
                      onError={() => setImageLoadError(true)}
                      onLoad={() => setImageLoadError(false)}
                    />
                  )}
                  <span className="text-[10px] text-slate-500 break-all leading-relaxed">
                    {!imageLoadError ? "Pré-visualização da imagem" : "Link da imagem informado"}
                  </span>
                </div>
                {imageLoadError && (
                  <div className="text-xs text-rose-650 font-bold bg-rose-50 border border-rose-100 rounded-xl p-3">
                    Não foi possível carregar esta imagem. Verifique se o link é direto para um arquivo de imagem.
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="prod_active"
              checked={formProduct.is_active}
              onChange={(e) => setFormProduct({ ...formProduct, is_active: e.target.checked })}
              className="w-4 h-4 border border-slate-200 rounded-lg text-sky-600 focus:ring-sky-500 cursor-pointer"
            />
            <label htmlFor="prod_active" className="text-xs font-bold text-slate-655 cursor-pointer select-none">
              Produto Ativo (Visível no catálogo público)
            </label>
          </div>

          {/* Botões Ação */}
          <div className="flex justify-end gap-3 pt-6 border-t border-slate-100 bg-slate-50 -mx-6 -mb-6 p-6 rounded-b-3xl">
            <PremiumButton
              variant="outline"
              onClick={() => setIsModalOpen(false)}
            >
              Cancelar
            </PremiumButton>
            <PremiumButton
              type="submit"
              loading={loading}
              variant="primary"
            >
              Salvar Produto
            </PremiumButton>
          </div>
        </form>
      </PremiumModal>
    </div>
  );
}
