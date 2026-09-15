'use client';

import React, { useEffect, useState, useRef } from 'react';
import { PageHero } from '@/components/ui/PageHero';
import { EmptyState } from '@/components/ui/EmptyState';
import { PremiumButton } from '@/components/ui/PremiumButton';
import { PremiumInput } from '@/components/ui/PremiumInput';
import { PremiumModal } from '@/components/ui/PremiumModal';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { MetricCard } from '@/components/ui/MetricCard';
import * as tus from 'tus-js-client';
import { 
  Package, Plus, Search, Edit2, Trash2, 
  X, Tag, DollarSign, Archive, Layers, RefreshCw,
  Upload, Image as ImageIcon, Loader2, ShieldAlert, AlertTriangle,
  ChevronLeft, ChevronRight, Star, Film, Play, Video as VideoIcon, Eye
} from 'lucide-react';
import { createSupabaseBrowserClient } from '@/lib/supabase';
import { useAuth } from '@/components/AuthProvider';

interface Category {
  id: string;
  name: string;
}

interface ProductImage {
  id?: string;
  product_id?: string;
  url?: string;
  public_url?: string;
  storage_path?: string | null;
  is_primary?: boolean;
  sort_order?: number;
}

interface ProductVideo {
  id?: string;
  product_id?: string;
  storage_path?: string;
  public_url: string;
  title?: string | null;
  poster_url?: string | null;
  sort_order?: number;
  created_at?: string;
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
  images?: ProductImage[];
  videos?: ProductVideo[];
}

interface GalleryItem {
  id?: string;
  publicUrl: string;
  storagePath?: string | null;
  isPrimary: boolean;
  sortOrder: number;
  file?: File;
}

interface VideoItem {
  id?: string;
  publicUrl: string;
  storagePath?: string;
  title: string;
  sizeBytes?: number;
  fileName?: string;
  sortOrder: number;
  file?: File;
  status?: 'idle' | 'preparing' | 'uploading' | 'paused' | 'retrying' | 'completed' | 'cancelled' | 'error';
  statusText?: string;
  progressPercent?: number;
  uploadedBytes?: number;
  totalBytes?: number;
}

export default function AdminProdutosPage() {
  const supabase = createSupabaseBrowserClient();
  const { profile: adminProfile } = useAuth();

  // Estados de dados
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estados de busca
  const [searchTerm, setSearchTerm] = useState('');

  // Estados de modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  // Estados para exclusao protegida e desativacao
  const [deleteModalProduct, setDeleteModalProduct] = useState<Product | null>(null);
  const [deleteModalMode, setDeleteModalMode] = useState<'none' | 'confirm_delete' | 'blocked_history'>('none');
  const [deactivatingProduct, setDeactivatingProduct] = useState(false);
  const [checkingHistory, setCheckingHistory] = useState(false);
  
  // Estados da Galeria de Imagens (Ate 8 imagens)
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [removedImageIds, setRemovedImageIds] = useState<string[]>([]);
  const [removedStoragePaths, setRemovedStoragePaths] = useState<string[]>([]);
  const [galleryModalError, setGalleryModalError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number; message: string } | null>(null);
  const galleryFileInputRef = useRef<HTMLInputElement>(null);

  // Estados de Vídeos do Produto (Até 2 vídeos)
  const [videoItems, setVideoItems] = useState<VideoItem[]>([]);
  const [removedVideoIds, setRemovedVideoIds] = useState<string[]>([]);
  const [removedVideoStoragePaths, setRemovedVideoStoragePaths] = useState<string[]>([]);
  const [videoModalError, setVideoModalError] = useState<string | null>(null);
  const [previewVideoUrl, setPreviewVideoUrl] = useState<string | null>(null);
  const videoFileInputRef = useRef<HTMLInputElement>(null);

  // Formulário
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

  // Generar Slug automaticamente
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

      // 1. Obtener productos com imagens e vídeos ordenados
      const { data: prodData, error: prodError } = await supabase
        .from('products')
        .select(`
          *,
          category:product_categories(id, name),
          images:product_images(id, product_id, url, public_url, storage_path, is_primary, sort_order),
          videos:product_videos(id, product_id, storage_path, public_url, title, poster_url, sort_order)
        `)
        .order('name', { ascending: true });

      if (prodError) throw prodError;

      // Enriquecer com lista ordenada e URL da imagem capa
      const enriched = (prodData || []).map((p: any) => {
        const sortedImgs = (p.images || []).sort((a: any, b: any) => {
          if (a.is_primary) return -1;
          if (b.is_primary) return 1;
          return (a.sort_order || 0) - (b.sort_order || 0);
        });

        const primaryUrl = sortedImgs.find((img: any) => img.is_primary)?.public_url
          || sortedImgs.find((img: any) => img.is_primary)?.url
          || sortedImgs[0]?.public_url
          || sortedImgs[0]?.url
          || null;

        return {
          ...p,
          images: sortedImgs,
          primaryImageUrl: primaryUrl,
        };
      });

      setProducts(enriched);

      // 2. Obtener categorias
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

  // Handler de seleção múltipla de arquivos para a galeria
  const handleGalleryFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setGalleryModalError(null);

    const currentCount = galleryItems.length;
    if (currentCount + files.length > 8) {
      setGalleryModalError(`O limite é de no máximo 8 imagens por produto. Atualmente você possui ${currentCount} imagem(ns) e selecionou mais ${files.length}.`);
      if (galleryFileInputRef.current) galleryFileInputRef.current.value = '';
      return;
    }

    const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp', 'avif'];
    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/avif'];
    const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

    const newItems: GalleryItem[] = [];

    for (const file of files) {
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      const isTypeValid = allowedMimeTypes.includes(file.type.toLowerCase()) || allowedExtensions.includes(ext);

      if (!isTypeValid) {
        setGalleryModalError(`O arquivo "${file.name}" possui formato não suportado. Envie imagens JPG, PNG, WEBP ou AVIF.`);
        if (galleryFileInputRef.current) galleryFileInputRef.current.value = '';
        return;
      }

      if (file.size > MAX_SIZE) {
        setGalleryModalError(`O arquivo "${file.name}" excede o limite máximo permitido de 5 MB.`);
        if (galleryFileInputRef.current) galleryFileInputRef.current.value = '';
        return;
      }

      // Prevenir duplicados no mesmo lote de seleção por nome e tamanho
      const isDuplicate = galleryItems.some(item => item.file && item.file.name === file.name && item.file.size === file.size) ||
                          newItems.some(item => item.file && item.file.name === file.name && item.file.size === file.size);

      if (isDuplicate) {
        console.warn(`Arquivo duplicado ignorado: ${file.name}`);
        continue;
      }

      const previewUrl = URL.createObjectURL(file);
      newItems.push({
        publicUrl: previewUrl,
        isPrimary: false,
        sortOrder: currentCount + newItems.length,
        file: file,
      });
    }

    if (newItems.length === 0) return;

    const updatedGallery = [...galleryItems, ...newItems];

    if (!updatedGallery.some(item => item.isPrimary)) {
      updatedGallery[0].isPrimary = true;
    }

    setGalleryItems(updatedGallery);
    if (galleryFileInputRef.current) galleryFileInputRef.current.value = '';
  };

  // Definir imagem selecionada como Capa / Principal
  const handleSetPrimaryImage = (index: number) => {
    const updated = galleryItems.map((item, idx) => ({
      ...item,
      isPrimary: idx === index,
    }));
    setGalleryItems(updated);
  };

  // Remover imagem da galeria (marcando para exclusão se já existia no banco/storage)
  const handleRemoveGalleryImage = (index: number) => {
    const itemToRemove = galleryItems[index];
    if (itemToRemove.id) {
      setRemovedImageIds(prev => [...prev, itemToRemove.id!]);
    }
    if (itemToRemove.storagePath) {
      setRemovedStoragePaths(prev => [...prev, itemToRemove.storagePath!]);
    }

    const remaining = galleryItems.filter((_, idx) => idx !== index);

    // Se a imagem removida era a principal, promove a primeira restante a principal
    if (itemToRemove.isPrimary && remaining.length > 0) {
      remaining[0].isPrimary = true;
    }

    const reordered = remaining.map((item, idx) => ({
      ...item,
      sortOrder: idx,
    }));

    setGalleryItems(reordered);
  };

  // Mover ordem da imagem (esquerda / direita)
  const handleMoveGalleryImage = (index: number, direction: 'left' | 'right') => {
    const targetIndex = direction === 'left' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= galleryItems.length) return;

    const reordered = [...galleryItems];
    const temp = reordered[index];
    reordered[index] = reordered[targetIndex];
    reordered[targetIndex] = temp;

    const finalOrder = reordered.map((item, idx) => ({
      ...item,
      sortOrder: idx,
    }));

    setGalleryItems(finalOrder);
  };

  // Handlers para Vídeos do Produto (até 2 vídeos)
  const handleVideoFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setVideoModalError(null);

    if (videoItems.length >= 2) {
      setVideoModalError("O limite é de no máximo 2 vídeos por produto. Remova um vídeo existente antes de adicionar outro.");
      if (videoFileInputRef.current) videoFileInputRef.current.value = '';
      return;
    }

    const allowedMimeTypes = ['video/mp4', 'video/webm'];
    const allowedExtensions = ['mp4', 'webm'];
    const ext = file.name.split('.').pop()?.toLowerCase() || '';

    const isTypeValid = allowedMimeTypes.includes(file.type.toLowerCase()) || allowedExtensions.includes(ext);

    if (!isTypeValid) {
      setVideoModalError(`O arquivo "${file.name}" possui formato não suportado. Envie arquivos em MP4 ou WEBM.`);
      if (videoFileInputRef.current) videoFileInputRef.current.value = '';
      return;
    }

    const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50 MB
    if (file.size > MAX_VIDEO_SIZE) {
      setVideoModalError(`O arquivo "${file.name}" excede o limite máximo permitido de 50 MB (tamanho: ${(file.size / (1024 * 1024)).toFixed(1)} MB).`);
      if (videoFileInputRef.current) videoFileInputRef.current.value = '';
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    const newItem: VideoItem = {
      publicUrl: objectUrl,
      title: '',
      fileName: file.name,
      sizeBytes: file.size,
      sortOrder: videoItems.length,
      file: file,
    };

    setVideoItems([...videoItems, newItem]);
    if (videoFileInputRef.current) videoFileInputRef.current.value = '';
  };

  const activeTusUploadRef = useRef<tus.Upload | null>(null);

  const updateVideoItemState = (index: number, partialState: Partial<VideoItem>) => {
    setVideoItems(prev => {
      const copy = [...prev];
      if (copy[index]) {
        copy[index] = { ...copy[index], ...partialState };
      }
      return copy;
    });
  };

  const handleRemoveVideo = (index: number) => {
    if (activeTusUploadRef.current) {
      try {
        console.log("Abortando upload TUS ativo em andamento...");
        activeTusUploadRef.current.abort();
      } catch (e) {
        console.warn("Erro ao abortar TUS upload:", e);
      }
      activeTusUploadRef.current = null;
    }

    const itemToRemove = videoItems[index];
    if (itemToRemove.id) {
      setRemovedVideoIds(prev => [...prev, itemToRemove.id!]);
    }
    if (itemToRemove.storagePath) {
      setRemovedVideoStoragePaths(prev => [...prev, itemToRemove.storagePath!]);
    }

    const remaining = videoItems.filter((_, idx) => idx !== index).map((v, i) => ({ ...v, sortOrder: i }));
    setVideoItems(remaining);
  };

  const handleVideoTitleChange = (index: number, newTitle: string) => {
    const updated = [...videoItems];
    updated[index] = { ...updated[index], title: newTitle };
    setVideoItems(updated);
  };

  // Abrir modal de criação/edição
  const openModal = (product: Product | null = null) => {
    setEditingProduct(product);
    setGalleryModalError(null);
    setVideoModalError(null);
    setUploadProgress(null);
    setRemovedImageIds([]);
    setRemovedStoragePaths([]);
    setRemovedVideoIds([]);
    setRemovedVideoStoragePaths([]);
    if (galleryFileInputRef.current) galleryFileInputRef.current.value = '';
    if (videoFileInputRef.current) videoFileInputRef.current.value = '';

    if (product) {
      const initialGallery: GalleryItem[] = (product.images || [])
        .map((img: any, idx: number) => ({
          id: img.id,
          publicUrl: img.public_url || img.url || '',
          storagePath: img.storage_path || extractStoragePath(img.public_url || img.url),
          isPrimary: !!img.is_primary,
          sortOrder: img.sort_order !== undefined ? img.sort_order : idx,
        }))
        .sort((a, b) => {
          if (a.isPrimary) return -1;
          if (b.isPrimary) return 1;
          return a.sortOrder - b.sortOrder;
        });

      if (initialGallery.length > 0 && !initialGallery.some(item => item.isPrimary)) {
        initialGallery[0].isPrimary = true;
      }

      setGalleryItems(initialGallery);

      const initialVideos: VideoItem[] = (product.videos || [])
        .map((vid: any, idx: number) => ({
          id: vid.id,
          publicUrl: vid.public_url,
          storagePath: vid.storage_path,
          title: vid.title || '',
          sortOrder: vid.sort_order !== undefined ? vid.sort_order : idx,
        }))
        .sort((a, b) => a.sortOrder - b.sortOrder);

      setVideoItems(initialVideos);

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
      setGalleryItems([]);
      setVideoItems([]);
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

  // Salvar produto e sincronizar galeria de imagens e vídeos no Supabase Storage e DB
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formProduct.name.trim() || !formProduct.price) return;
    if (galleryModalError || videoModalError) return;

    try {
      setLoading(true);
      setUploadProgress(null);

      // 1. Slug único
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

      if (!productId) throw new Error("ID do produto não foi retornado pelo servidor.");

      // 2. Upload de novos arquivos de imagem para o Supabase Storage (bucket product-images)
      const newFilesToUpload = galleryItems.filter(item => item.file);
      const newlyUploadedStoragePaths: string[] = [];

      if (newFilesToUpload.length > 0) {
        setUploadProgress({ current: 0, total: newFilesToUpload.length, message: `Enviando 0 de ${newFilesToUpload.length} imagens...` });
      }

      const finalRecords: Array<{
        id?: string;
        product_id: string;
        url: string;
        public_url: string;
        storage_path: string | null;
        is_primary: boolean;
        sort_order: number;
      }> = [];

      let uploadedCount = 0;

      for (let i = 0; i < galleryItems.length; i++) {
        const item = galleryItems[i];

        if (item.file) {
          uploadedCount++;
          setUploadProgress({
            current: uploadedCount,
            total: newFilesToUpload.length,
            message: `Enviando imagem ${uploadedCount} de ${newFilesToUpload.length}...`
          });

          const ext = item.file.name.split('.').pop()?.toLowerCase() || 'jpg';
          const safeFileName = `${Date.now()}_${crypto.randomUUID()}.${ext}`;
          const storagePath = `products/${productId}/${safeFileName}`;

          const { data: uploadData, error: uploadErr } = await supabase.storage
            .from('product-images')
            .upload(storagePath, item.file, {
              cacheControl: '3600',
              upsert: false,
            });

          if (uploadErr) {
            console.error("Erro no upload para o Supabase Storage:", uploadErr);
            if (newlyUploadedStoragePaths.length > 0) {
              console.log("Executando rollback dos arquivos já enviados nesta tentativa:", newlyUploadedStoragePaths);
              await supabase.storage.from('product-images').remove(newlyUploadedStoragePaths);
            }
            throw new Error(`Falha no envio da imagem "${item.file.name}": ${uploadErr.message}`);
          }

          newlyUploadedStoragePaths.push(storagePath);

          const { data: publicUrlData } = supabase.storage
            .from('product-images')
            .getPublicUrl(storagePath);

          finalRecords.push({
            product_id: productId,
            url: publicUrlData.publicUrl,
            public_url: publicUrlData.publicUrl,
            storage_path: storagePath,
            is_primary: item.isPrimary,
            sort_order: i,
          });
        } else {
          finalRecords.push({
            id: item.id,
            product_id: productId,
            url: item.publicUrl,
            public_url: item.publicUrl,
            storage_path: item.storagePath || null,
            is_primary: item.isPrimary,
            sort_order: i,
          });
        }
      }

      // 3. Upload de novos arquivos de vídeo para o Supabase Storage (bucket product-videos com TUS para > 6 MB)
      const newlyUploadedVideoPaths: string[] = [];
      const finalVideoRecords: Array<{
        id?: string;
        product_id: string;
        storage_path: string;
        public_url: string;
        title?: string | null;
        sort_order: number;
      }> = [];

      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      if (!accessToken) throw new Error("Sessão de usuário expirada ou não autenticada.");

      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ofkyvldcifezobulucmr.supabase.co';
      const tusEndpoint = `${supabaseUrl}/storage/v1/upload/resumable`;
      const TUS_THRESHOLD = 6 * 1024 * 1024; // 6 MB

      for (let i = 0; i < videoItems.length; i++) {
        const vItem = videoItems[i];
        if (vItem.file) {
          const ext = vItem.file.name.split('.').pop()?.toLowerCase() || 'mp4';
          const safeFileName = `${crypto.randomUUID()}.${ext}`;
          const storagePath = `${productId}/${safeFileName}`;

          if (vItem.file.size <= TUS_THRESHOLD) {
            // Upload padrão Supabase para vídeos <= 6 MB
            updateVideoItemState(i, { status: 'uploading', statusText: 'Enviando: 50%', progressPercent: 50 });

            const { data: uploadData, error: uploadErr } = await supabase.storage
              .from('product-videos')
              .upload(storagePath, vItem.file, {
                cacheControl: '3600',
                upsert: false,
              });

            if (uploadErr) {
              console.error("Erro no upload direto de vídeo:", uploadErr);
              updateVideoItemState(i, { status: 'error', statusText: 'Falha no envio' });
              if (newlyUploadedVideoPaths.length > 0) {
                await supabase.storage.from('product-videos').remove(newlyUploadedVideoPaths);
              }
              if (newlyUploadedStoragePaths.length > 0) {
                await supabase.storage.from('product-images').remove(newlyUploadedStoragePaths);
              }
              throw new Error(`Falha no envio do vídeo "${vItem.file.name}": ${uploadErr.message}`);
            }

            updateVideoItemState(i, { status: 'completed', statusText: 'Upload concluído', progressPercent: 100 });
          } else {
            // Upload TUS resumável para vídeos > 6 MB
            try {
              await new Promise<void>((resolve, reject) => {
                updateVideoItemState(i, { status: 'preparing', statusText: 'Preparando vídeo...', progressPercent: 0 });

                const upload = new tus.Upload(vItem.file!, {
                  endpoint: tusEndpoint,
                  retryDelays: [0, 3000, 5000, 10000],
                  headers: {
                    authorization: `Bearer ${accessToken}`,
                    apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
                    'x-upsert': 'false',
                  },
                  uploadDataDuringCreation: true,
                  removeFingerprintOnSuccess: true,
                  metadata: {
                    bucketName: 'product-videos',
                    objectName: storagePath,
                    contentType: vItem.file!.type || 'video/mp4',
                    cacheControl: '3600',
                  },
                  chunkSize: 6 * 1024 * 1024,
                  onError: (error) => {
                    console.error("Erro no TUS upload:", error);
                    updateVideoItemState(i, { status: 'error', statusText: 'Falha no envio' });
                    activeTusUploadRef.current = null;
                    reject(error);
                  },
                  onProgress: (bytesUploaded, bytesTotal) => {
                    const percent = Math.min(100, Math.round((bytesUploaded / bytesTotal) * 100));
                    const uploadedMB = (bytesUploaded / (1024 * 1024)).toFixed(1);
                    const totalMB = (bytesTotal / (1024 * 1024)).toFixed(1);
                    updateVideoItemState(i, {
                      status: 'uploading',
                      statusText: `Enviando: ${percent}% (${uploadedMB} MB / ${totalMB} MB)`,
                      progressPercent: percent,
                      uploadedBytes: bytesUploaded,
                      totalBytes: bytesTotal,
                    });
                  },
                  onSuccess: () => {
                    updateVideoItemState(i, {
                      status: 'completed',
                      statusText: 'Upload concluído',
                      progressPercent: 100,
                    });
                    activeTusUploadRef.current = null;
                    resolve();
                  },
                });

                activeTusUploadRef.current = upload;
                upload.start();
              });
            } catch (tusErr: any) {
              if (newlyUploadedVideoPaths.length > 0) {
                await supabase.storage.from('product-videos').remove(newlyUploadedVideoPaths);
              }
              if (newlyUploadedStoragePaths.length > 0) {
                await supabase.storage.from('product-images').remove(newlyUploadedStoragePaths);
              }
              throw new Error(`Falha no envio TUS do vídeo "${vItem.file.name}": ${tusErr.message || 'Erro de rede ou transferência.'}`);
            }
          }

          newlyUploadedVideoPaths.push(storagePath);

          const { data: pubData } = supabase.storage
            .from('product-videos')
            .getPublicUrl(storagePath);

          finalVideoRecords.push({
            product_id: productId,
            storage_path: storagePath,
            public_url: pubData.publicUrl,
            title: vItem.title || null,
            sort_order: i,
          });
        } else {
          finalVideoRecords.push({
            id: vItem.id,
            product_id: productId,
            storage_path: vItem.storagePath || '',
            public_url: vItem.publicUrl,
            title: vItem.title || null,
            sort_order: i,
          });
        }
      }

      // 4. Excluir registros removidos do banco de dados (imagens e vídeos)
      if (removedImageIds.length > 0) {
        await supabase.from('product_images').delete().in('id', removedImageIds);
      }
      if (removedVideoIds.length > 0) {
        await supabase.from('product_videos').delete().in('id', removedVideoIds);
      }

      // 5. Salvar/atualizar imagens na tabela product_images
      let hasPrimary = false;
      const normalizedRecords = finalRecords.map(r => {
        if (r.is_primary && !hasPrimary) {
          hasPrimary = true;
          return { ...r, is_primary: true };
        }
        return { ...r, is_primary: false };
      });
      if (!hasPrimary && normalizedRecords.length > 0) {
        normalizedRecords[0].is_primary = true;
      }

      for (const rec of normalizedRecords) {
        if (rec.id) {
          await supabase.from('product_images').update({
            url: rec.url,
            public_url: rec.public_url,
            storage_path: rec.storage_path,
            is_primary: rec.is_primary,
            sort_order: rec.sort_order,
          }).eq('id', rec.id);
        } else {
          await supabase.from('product_images').insert({
            product_id: rec.product_id,
            url: rec.url,
            public_url: rec.public_url,
            storage_path: rec.storage_path,
            is_primary: rec.is_primary,
            sort_order: rec.sort_order,
          });
        }
      }

      // 6. Salvar/atualizar vídeos na tabela product_videos
      for (const vRec of finalVideoRecords) {
        if (vRec.id) {
          await supabase.from('product_videos').update({
            title: vRec.title,
            sort_order: vRec.sort_order,
          }).eq('id', vRec.id);
        } else {
          await supabase.from('product_videos').insert(vRec);
        }
      }

      // 7. Excluir arquivos removidos do Storage (imagens e vídeos) SOMENTE após salvamento bem-sucedido
      if (removedStoragePaths.length > 0) {
        console.log("Removendo imagens do Storage marcadas para exclusão:", removedStoragePaths);
        await supabase.storage.from('product-images').remove(removedStoragePaths);
      }
      if (removedVideoStoragePaths.length > 0) {
        console.log("Removendo vídeos do Storage marcados para exclusão:", removedVideoStoragePaths);
        await supabase.storage.from('product-videos').remove(removedVideoStoragePaths);
      }

      setUploadProgress(null);
      setIsModalOpen(false);
      setEditingProduct(null);
      setGalleryItems([]);
      setVideoItems([]);
      setRemovedImageIds([]);
      setRemovedStoragePaths([]);
      setRemovedVideoIds([]);
      setRemovedVideoStoragePaths([]);
      await loadData();
    } catch (err: any) {
      console.error('Erro ao salvar produto:', err);
      setGalleryModalError(err.message || 'Erro ao salvar produto.');
    } finally {
      setLoading(false);
      setUploadProgress(null);
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

          {/* Galeria de Imagens do Produto (até 8 imagens) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
                Imagens do Produto ({galleryItems.length}/8)
              </label>
              <button
                type="button"
                onClick={() => galleryFileInputRef.current?.click()}
                disabled={loading || !!uploadProgress || galleryItems.length >= 8}
                className="px-3 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer disabled:opacity-50"
              >
                <Plus className="w-3.5 h-3.5" />
                Adicionar imagens
              </button>
            </div>

            <input
              ref={galleryFileInputRef}
              type="file"
              multiple
              accept="image/jpeg,image/jpg,image/png,image/webp,image/avif"
              onChange={handleGalleryFilesChange}
              className="hidden"
              id="product-gallery-upload"
            />

            {/* Grid Responsivo de Miniaturas */}
            {galleryItems.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 border border-slate-200 rounded-2xl p-4">
                {galleryItems.map((item, index) => (
                  <div
                    key={index}
                    className={`relative bg-white border rounded-xl p-2 flex flex-col items-center gap-2 group transition-all ${
                      item.isPrimary ? 'border-sky-500 ring-2 ring-sky-100 shadow-xs' : 'border-slate-200'
                    }`}
                  >
                    {/* Badge de Imagem Principal */}
                    {item.isPrimary ? (
                      <span className="absolute top-1.5 left-1.5 bg-sky-600 text-white text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider z-10 shadow-2xs flex items-center gap-1">
                        <Star className="w-2.5 h-2.5 fill-white" /> Imagem principal
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleSetPrimaryImage(index)}
                        className="absolute top-1.5 left-1.5 bg-slate-900/60 hover:bg-sky-600 backdrop-blur-xs text-white text-[9px] font-bold px-2 py-0.5 rounded-md transition-all z-10 opacity-80 group-hover:opacity-100 cursor-pointer"
                        title="Definir como Imagem Principal"
                      >
                        Definir capa
                      </button>
                    )}

                    {/* Miniatura */}
                    <div className="w-full aspect-square relative rounded-lg overflow-hidden bg-slate-50 border border-slate-100 flex items-center justify-center">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.publicUrl}
                        alt={`Imagem ${index + 1}`}
                        className="w-full h-full object-contain p-1"
                      />
                    </div>

                    {/* Controles de Ordenação e Exclusão */}
                    <div className="flex items-center justify-between w-full pt-1 border-t border-slate-100 text-slate-500">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleMoveGalleryImage(index, 'left')}
                          disabled={index === 0}
                          className="p-1 rounded hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
                          title="Mover para a esquerda"
                        >
                          <ChevronLeft className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveGalleryImage(index, 'right')}
                          disabled={index === galleryItems.length - 1}
                          className="p-1 rounded hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
                          title="Mover para a direita"
                        >
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveGalleryImage(index)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Remover imagem"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div
                onClick={() => galleryFileInputRef.current?.click()}
                className="flex flex-col items-center justify-center py-8 px-4 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <div className="w-12 h-12 rounded-full bg-sky-50 text-sky-600 flex items-center justify-center mb-2">
                  <ImageIcon className="w-6 h-6" />
                </div>
                <p className="text-xs font-extrabold text-slate-700 mb-1">
                  Nenhuma imagem na galeria
                </p>
                <p className="text-[10px] text-slate-400 font-medium mb-3">
                  Clique para selecionar até 8 imagens para este produto.
                </p>
                <button
                  type="button"
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs"
                >
                  <Upload className="w-4 h-4" />
                  Selecionar imagens
                </button>
              </div>
            )}

            {/* Progresso de Envio */}
            {uploadProgress && (
              <div className="p-3 bg-sky-50 border border-sky-100 rounded-xl text-sky-700 text-xs font-bold space-y-1.5 animate-pulse">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-sky-600" />
                    {uploadProgress.message}
                  </span>
                  <span className="text-[10px] font-black">
                    {Math.round((uploadProgress.current / uploadProgress.total) * 100)}%
                  </span>
                </div>
                <div className="w-full bg-sky-200 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-sky-600 h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }}
                  />
                </div>
              </div>
            )}

            {/* Vídeos do Produto (até 2 vídeos) */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
                    Vídeos do Produto ({videoItems.length}/2)
                  </label>
                  <p className="text-[10px] text-slate-400 font-medium">
                    Envie até 2 vídeos em MP4 ou WEBM, com no máximo 50 MB cada.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (videoItems.length >= 2) {
                      setVideoModalError("O limite é de no máximo 2 vídeos por produto. Remova um vídeo existente antes de adicionar outro.");
                      return;
                    }
                    videoFileInputRef.current?.click();
                  }}
                  disabled={loading || videoItems.length >= 2}
                  className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer disabled:opacity-50"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Adicionar vídeo
                </button>
              </div>

              <input
                ref={videoFileInputRef}
                type="file"
                accept="video/mp4,video/webm"
                onChange={handleVideoFilesChange}
                className="hidden"
                id="product-video-upload"
              />

              {/* Alerta de erro de vídeo (sem alert nativo) */}
              {videoModalError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-medium flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2">
                    <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <span>{videoModalError}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setVideoModalError(null)}
                    className="text-rose-500 hover:text-rose-800 text-xs font-bold cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Lista de Vídeos Cadastrados/Selecionados */}
              {videoItems.length > 0 ? (
                <div className="space-y-3 bg-slate-50 border border-slate-200 rounded-2xl p-4">
                  {videoItems.map((vItem, index) => (
                    <div
                      key={index}
                      className="bg-white border border-slate-200 rounded-xl p-3.5 flex flex-col gap-2.5 shadow-2xs"
                    >
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3 w-full sm:w-auto">
                          <div className="w-16 h-12 bg-slate-900 rounded-lg overflow-hidden shrink-0 relative flex items-center justify-center border border-slate-200">
                            <video
                              src={vItem.publicUrl}
                              className="w-full h-full object-cover opacity-60"
                              preload="metadata"
                            />
                            <Play className="w-5 h-5 text-white absolute fill-white" />
                          </div>
                          <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-xs font-bold text-slate-800 truncate">
                                {vItem.fileName || `Vídeo ${index + 1}`}
                              </span>
                              {vItem.sizeBytes && (
                                <span className="text-[10px] text-slate-400 font-semibold bg-slate-100 px-2 py-0.5 rounded-md">
                                  {(vItem.sizeBytes / (1024 * 1024)).toFixed(1)} MB
                                  {vItem.sizeBytes > 6 * 1024 * 1024 && (
                                    <span className="ml-1 text-indigo-600 font-bold">• TUS Resumável</span>
                                  )}
                                </span>
                              )}
                              {vItem.statusText && (
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                                  vItem.status === 'completed'
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : vItem.status === 'error'
                                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                    : 'bg-indigo-50 text-indigo-700 border border-indigo-200 animate-pulse'
                                }`}>
                                  {vItem.statusText}
                                </span>
                              )}
                            </div>
                            <input
                              type="text"
                              value={vItem.title}
                              onChange={(e) => handleVideoTitleChange(index, e.target.value)}
                              placeholder="Título do vídeo (opcional, ex: Conheça a Autoclave Tanda B Pro)"
                              className="w-full text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 focus:bg-white focus:border-indigo-500 outline-none transition-all"
                            />
                          </div>
                        </div>

                        <div className="flex items-center gap-2 w-full sm:w-auto justify-end border-t sm:border-t-0 border-slate-100 pt-2 sm:pt-0">
                          <button
                            type="button"
                            onClick={() => setPreviewVideoUrl(vItem.publicUrl)}
                            className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                            title="Visualizar vídeo"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Visualizar
                          </button>

                          <button
                            type="button"
                            onClick={() => handleRemoveVideo(index)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Remover vídeo / Cancelar upload"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Barra de Progresso Real do TUS / Upload */}
                      {vItem.progressPercent !== undefined && vItem.progressPercent > 0 && vItem.progressPercent < 100 && (
                        <div className="w-full space-y-1 bg-indigo-50/60 p-2 rounded-lg border border-indigo-100">
                          <div className="flex justify-between text-[10px] font-bold text-indigo-700">
                            <span>{vItem.statusText || 'Enviando...'}</span>
                            <span>{vItem.progressPercent}%</span>
                          </div>
                          <div className="w-full bg-indigo-200 h-1.5 rounded-full overflow-hidden">
                            <div
                              className="bg-indigo-600 h-1.5 rounded-full transition-all duration-200"
                              style={{ width: `${vItem.progressPercent}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div
                  onClick={() => {
                    if (videoItems.length >= 2) {
                      setVideoModalError("O limite é de no máximo 2 vídeos por produto. Remova um vídeo existente antes de adicionar outro.");
                      return;
                    }
                    videoFileInputRef.current?.click();
                  }}
                  className="flex flex-col items-center justify-center py-6 px-4 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mb-2">
                    <Film className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-extrabold text-slate-700 mb-0.5">
                    Nenhum vídeo adicionado
                  </p>
                  <p className="text-[10px] text-slate-400 font-medium">
                    Clique para enviar até 2 vídeos explicativos do equipamento em MP4 ou WEBM (máx. 50 MB).
                  </p>
                </div>
              )}
            </div>

            {/* Modal / Alerta de Erro Visual na Galeria */}
            {galleryModalError && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-bold flex items-start justify-between gap-2">
                <div className="flex items-start gap-2">
                  <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                  <span>{galleryModalError}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setGalleryModalError(null)}
                  className="p-0.5 text-rose-400 hover:text-rose-700"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <p className="text-[10px] text-slate-455 font-medium leading-relaxed">
              Envie até 8 imagens em formato JPG, PNG, WEBP ou AVIF de até 5 MB cada. A primeira imagem ou a capa definida será exibida na vitrine principal.
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
              loading={loading || !!uploadProgress}
              variant="primary"
              disabled={!!galleryModalError}
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

      {/* Modal de Pré-visualização de Vídeo */}
      {previewVideoUrl && (
        <PremiumModal
          isOpen={!!previewVideoUrl}
          onClose={() => setPreviewVideoUrl(null)}
          title="Pré-visualização do Vídeo"
        >
          <div className="space-y-4">
            <div className="w-full aspect-video bg-black rounded-2xl overflow-hidden shadow-inner flex items-center justify-center border border-slate-800">
              <video
                src={previewVideoUrl}
                controls
                autoPlay
                playsInline
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setPreviewVideoUrl(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Fechar Pré-visualização
              </button>
            </div>
          </div>
        </PremiumModal>
      )}
    </div>
  );
}
