'use client';

import React, { useEffect, useState, useRef } from 'react';
import { PageHero } from '@/components/ui/PageHero';
import { EmptyState } from '@/components/ui/EmptyState';
import { PremiumButton } from '@/components/ui/PremiumButton';
import { PremiumInput } from '@/components/ui/PremiumInput';
import { PremiumModal } from '@/components/ui/PremiumModal';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { MetricCard } from '@/components/ui/MetricCard';
import { 
  Package, Plus, Search, Edit2, Trash2, 
  X, Tag, DollarSign, Archive, Layers, RefreshCw,
  Upload, Image as ImageIcon, Loader2, ShieldAlert, AlertTriangle
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
  
  // Estados para exclusão protegida e desativação
  const [deleteModalProduct, setDeleteModalProduct] = useState<Product | null>(null);
  const [deleteModalMode, setDeleteModalMode] = useState<'none' | 'confirm_delete' | 'blocked_history'>('none');
  const [deactivatingProduct, setDeactivatingProduct] = useState(false);
  const [checkingHistory, setCheckingHistory] = useState(false);
  
  // Estados para Upload de Imagem no Supabase Storage
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageAction, setImageAction] = useState<'keep' | 'new' | 'remove'>('keep');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageErrorMessage, setImageErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // Extrair caminho do arquivo dentro do bucket product-images se pertencer ao Storage
  const extractStoragePath = (url: string | null | undefined): string | null => {
    if (!url || typeof url !== 'string') return null;
    if (!url.includes('product-images')) return null;
    const parts = url.split('/product-images/');
    if (parts.length > 1) {
      const rawPath = parts[1].split('?')[0];
      return decodeURIComponent(rawPath);
    }
    return null;
  };

  // Handler de seleção de arquivo com validação
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageErrorMessage(null);

    const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp', 'avif'];
    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/avif'];
    const fileExt = file.name.split('.').pop()?.toLowerCase() || '';

    const isTypeValid = allowedMimeTypes.includes(file.type.toLowerCase()) || allowedExtensions.includes(fileExt);

    if (!isTypeValid) {
      setImageErrorMessage('Formato de arquivo não suportado. Envie uma imagem JPG, PNG, WEBP ou AVIF.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
    if (file.size > MAX_SIZE) {
      setImageErrorMessage('O arquivo selecionado excede o limite máximo permitido de 5 MB.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setImageAction('new');
    setImageErrorMessage(null);
  };

  // Handler de remoção de imagem
  const handleRemoveImage = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setImageAction('remove');
    setImageErrorMessage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Abrir modal
  const openModal = (product: Product | null = null) => {
    setEditingProduct(product);
    setSelectedFile(null);
    setImageAction('keep');
    setUploadingImage(false);
    setImageErrorMessage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';

    if (product) {
      setPreviewUrl(product.primaryImageUrl || null);
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
      setPreviewUrl(null);
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
    if (imageErrorMessage) return;

    try {
      setLoading(true);
      let finalImageUrl: string | null = previewUrl;

      // 1. Upload de imagem para o Supabase Storage se um novo arquivo foi selecionado
      if (imageAction === 'new' && selectedFile) {
        setUploadingImage(true);
        const fileExt = selectedFile.name.split('.').pop()?.toLowerCase() || 'jpg';
        const fileName = `${Date.now()}_${crypto.randomUUID()}.${fileExt}`;
        const filePath = `products/${fileName}`;

        const { data: uploadData, error: uploadErr } = await supabase.storage
          .from('product-images')
          .upload(filePath, selectedFile, {
            cacheControl: '3600',
            upsert: false,
          });

        if (uploadErr) {
          console.error('Erro no upload para o Supabase Storage:', uploadErr);
          throw new Error(`Erro no upload da imagem: ${uploadErr.message}`);
        }

        const { data: publicUrlData } = supabase.storage
          .from('product-images')
          .getPublicUrl(filePath);

        finalImageUrl = publicUrlData.publicUrl;
        setUploadingImage(false);
      } else if (imageAction === 'remove') {
        finalImageUrl = null;
      }

      // 2. Slug único
      const generatedSlug = generateSlug(formProduct.name);
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

      let productId = editingProduct?.id;

      if (editingProduct) {
        const { error: saveError } = await supabase
          .from('products')
          .update(payload)
          .eq('id', editingProduct.id);
        if (saveError) throw saveError;
      } else {
        const { data: newProd, error: saveError } = await supabase
          .from('products')
          .insert(payload)
          .select('id')
          .single();
        if (saveError) throw saveError;
        productId = newProd?.id;
      }

      // 3. Atualizar/Inserir/Remover imagem na tabela product_images
      if (productId) {
        if (imageAction === 'new' && finalImageUrl) {
          const { data: existingImg } = await supabase
            .from('product_images')
            .select('id')
            .eq('product_id', productId)
            .eq('is_primary', true)
            .maybeSingle();

          if (existingImg) {
            const { error: updateImgErr } = await supabase
              .from('product_images')
              .update({ url: finalImageUrl })
              .eq('id', existingImg.id);
            if (updateImgErr) throw updateImgErr;
          } else {
            const { error: insertImgErr } = await supabase
              .from('product_images')
              .insert({
                product_id: productId,
                url: finalImageUrl,
                is_primary: true,
              });
            if (insertImgErr) throw insertImgErr;
          }
        } else if (imageAction === 'remove') {
          const { error: delImgErr } = await supabase
            .from('product_images')
            .delete()
            .eq('product_id', productId)
            .eq('is_primary', true);
          if (delImgErr) throw delImgErr;
        }
      }

      // 4. Excluir imagem antiga do Storage SOMENTE se a operação do produto foi concluída
      if ((imageAction === 'new' || imageAction === 'remove') && editingProduct?.primaryImageUrl) {
        const oldStoragePath = extractStoragePath(editingProduct.primaryImageUrl);
        if (oldStoragePath) {
          console.log('Excluindo imagem antiga do bucket product-images:', oldStoragePath);
          const { error: removeErr } = await supabase.storage
            .from('product-images')
            .remove([oldStoragePath]);
          if (removeErr) {
            console.warn('Aviso: Não foi possível remover imagem antiga do Storage:', removeErr.message);
          }
        }
      }

      setIsModalOpen(false);
      setEditingProduct(null);
      setSelectedFile(null);
      setPreviewUrl(null);
      setImageAction('keep');
      await loadData();
    } catch (err: any) {
      alert('Erro ao salvar produto: ' + err.message);
    } finally {
      setLoading(false);
      setUploadingImage(false);
    }
  };

  // Preparar exclusão com verificação de histórico em sales_order_items
  const handleDeleteClick = async (product: Product) => {
    try {
      setCheckingHistory(true);
      setDeleteModalProduct(product);

      // Verificar se existem itens em sales_order_items vinculados a este produto
      const { count, error: countErr } = await supabase
        .from('sales_order_items')
        .select('id', { count: 'exact', head: true })
        .eq('product_id', product.id);

      if (countErr) {
        console.error('Erro ao verificar histórico de vendas do produto:', countErr);
      }

      if (count && count > 0) {
        setDeleteModalMode('blocked_history');
      } else {
        setDeleteModalMode('confirm_delete');
      }
    } catch (err: any) {
      console.error('Erro ao verificar histórico para exclusão:', err);
    } finally {
      setCheckingHistory(false);
    }
  };

  // Exclusão definitiva para produtos sem histórico
  const handleConfirmDelete = async () => {
    if (!deleteModalProduct) return;
    try {
      setLoading(true);
      const prodId = deleteModalProduct.id;
      const imgUrl = deleteModalProduct.primaryImageUrl;

      // Remover registros em product_images antes da exclusão do produto
      await supabase.from('product_images').delete().eq('product_id', prodId);

      const { error: delError } = await supabase
        .from('products')
        .delete()
        .eq('id', prodId);

      if (delError) throw delError;

      if (imgUrl) {
        const oldStoragePath = extractStoragePath(imgUrl);
        if (oldStoragePath) {
          await supabase.storage.from('product-images').remove([oldStoragePath]);
        }
      }

      setDeleteModalMode('none');
      setDeleteModalProduct(null);
      await loadData();
    } catch (err: any) {
      console.error('Erro ao excluir produto:', err);
    } finally {
      setLoading(false);
    }
  };

  // Desativação para produtos que possuem histórico em pedidos
  const handleDeactivateProduct = async () => {
    if (!deleteModalProduct) return;
    try {
      setDeactivatingProduct(true);
      const { error: updateErr } = await supabase
        .from('products')
        .update({ is_active: false })
        .eq('id', deleteModalProduct.id);

      if (updateErr) throw updateErr;

      setDeleteModalMode('none');
      setDeleteModalProduct(null);
      await loadData();
    } catch (err: any) {
      console.error('Erro ao desativar produto:', err);
    } finally {
      setDeactivatingProduct(false);
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
                            onClick={() => handleDeleteClick(prod)}
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
                      onClick={() => handleDeleteClick(prod)}
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

          {/* Componente de Upload de Imagem no Supabase Storage */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
              Imagem do Produto
            </label>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp,image/avif"
              onChange={handleFileChange}
              className="hidden"
              id="product-image-upload"
            />

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
              {previewUrl ? (
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <div className="w-24 h-24 relative rounded-xl border border-slate-200 bg-white overflow-hidden shrink-0 flex items-center justify-center p-1 shadow-2xs">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={previewUrl}
                      alt="Pré-visualização da imagem do produto"
                      className="w-full h-full object-contain rounded-lg"
                    />
                  </div>

                  <div className="flex flex-col gap-2 w-full sm:w-auto">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingImage || loading}
                        className="px-3.5 py-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer disabled:opacity-50"
                      >
                        <Upload className="w-3.5 h-3.5 text-sky-600" />
                        Substituir imagem
                      </button>
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        disabled={uploadingImage || loading}
                        className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl text-xs font-bold text-rose-700 transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer disabled:opacity-50"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                        Remover imagem
                      </button>
                    </div>
                    {imageAction === 'new' && (
                      <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                        ✓ Nova imagem selecionada (será enviada ao salvar)
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-6 px-4 text-center border-2 border-dashed border-slate-200 rounded-xl bg-white/50 hover:bg-white transition-colors">
                  <div className="w-12 h-12 rounded-full bg-sky-50 text-sky-600 flex items-center justify-center mb-2">
                    <ImageIcon className="w-6 h-6" />
                  </div>
                  <p className="text-xs font-extrabold text-slate-700 mb-1">
                    Nenhuma imagem selecionada
                  </p>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingImage || loading}
                    className="mt-2 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    <Upload className="w-4 h-4" />
                    Selecionar imagem
                  </button>
                </div>
              )}

              {/* Indicador de carregamento */}
              {uploadingImage && (
                <div className="flex items-center gap-2 p-3 bg-sky-50 border border-sky-100 rounded-xl text-sky-700 text-xs font-bold animate-pulse">
                  <Loader2 className="w-4 h-4 animate-spin text-sky-600" />
                  <span>Enviando imagem para o Supabase Storage...</span>
                </div>
              )}

              {/* Mensagem de erro */}
              {imageErrorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-bold leading-relaxed">
                  {imageErrorMessage}
                </div>
              )}
            </div>

            <p className="text-[10px] text-slate-455 font-medium leading-relaxed">
              Envie uma imagem JPG, PNG, WEBP ou AVIF de até 5 MB.
            </p>
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
              loading={loading || uploadingImage}
              variant="primary"
              disabled={!!imageErrorMessage}
            >
              Salvar Produto
            </PremiumButton>
          </div>
        </form>
      </PremiumModal>

      {/* Modal de Bloqueio por Histórico de Vendas / Opção de Desativação */}
      <PremiumModal
        isOpen={deleteModalMode === 'blocked_history'}
        onClose={() => {
          setDeleteModalMode('none');
          setDeleteModalProduct(null);
        }}
        title="Produto em Histórico de Pedidos"
        size="sm"
      >
        <div className="space-y-4 text-left">
          <div className="flex items-start gap-3 p-3.5 bg-rose-50 border border-rose-100 rounded-2xl">
            <div className="p-2 bg-rose-100 text-rose-600 rounded-xl shrink-0 mt-0.5">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h4 className="font-extrabold text-xs text-rose-900">
                {deleteModalProduct?.name}
              </h4>
              <p className="text-xs text-rose-700 leading-relaxed font-medium">
                Este produto possui histórico em pedidos e não pode ser excluído. Você pode desativá-lo para removê-lo do catálogo.
              </p>
            </div>
          </div>

          <p className="text-[11px] text-slate-500 font-normal leading-relaxed">
            A desativação oculta o produto do catálogo público e impede novas vendas, preservando integralmente o histórico de pedidos já cadastrados.
          </p>

          <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
            <PremiumButton
              variant="outline"
              onClick={() => {
                setDeleteModalMode('none');
                setDeleteModalProduct(null);
              }}
              disabled={deactivatingProduct}
            >
              Cancelar
            </PremiumButton>
            <PremiumButton
              variant="primary"
              onClick={handleDeactivateProduct}
              loading={deactivatingProduct}
              icon={<Archive className="w-3.5 h-3.5" />}
            >
              Desativar produto
            </PremiumButton>
          </div>
        </div>
      </PremiumModal>

      {/* Modal de Confirmação de Exclusão Definitiva (Produtos Sem Histórico) */}
      <PremiumModal
        isOpen={deleteModalMode === 'confirm_delete'}
        onClose={() => {
          setDeleteModalMode('none');
          setDeleteModalProduct(null);
        }}
        title="Confirmar Exclusão de Produto"
        size="sm"
      >
        <div className="space-y-4 text-left">
          <div className="flex items-start gap-3 p-3.5 bg-amber-50 border border-amber-100 rounded-2xl">
            <div className="p-2 bg-amber-100 text-amber-700 rounded-xl shrink-0 mt-0.5">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h4 className="font-extrabold text-xs text-amber-900">
                {deleteModalProduct?.name}
              </h4>
              <p className="text-xs text-amber-800 leading-relaxed font-medium">
                Deseja realmente excluir este produto? Esta ação é irreversível e removerá o produto do catálogo de forma definitiva.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
            <PremiumButton
              variant="outline"
              onClick={() => {
                setDeleteModalMode('none');
                setDeleteModalProduct(null);
              }}
              disabled={loading}
            >
              Cancelar
            </PremiumButton>
            <button
              type="button"
              onClick={handleConfirmDelete}
              disabled={loading}
              className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Trash2 className="w-3.5 h-3.5" />
              )}
              Excluir definitivamente
            </button>
          </div>
        </div>
      </PremiumModal>
    </div>
  );
}
