-- 008_enhance_product_images_gallery.sql
-- Galeria de imagens para produtos: colunas storage_path, public_url, sort_order e restrição de imagem principal única

-- 1. Adicionar colunas necessárias se ainda não existirem
ALTER TABLE public.product_images
  ADD COLUMN IF NOT EXISTS storage_path TEXT,
  ADD COLUMN IF NOT EXISTS public_url TEXT,
  ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0 NOT NULL;

-- 2. Preencher public_url com o valor da coluna url existente (migração transparente sem perdas)
UPDATE public.product_images
SET public_url = url
WHERE public_url IS NULL AND url IS NOT NULL;

UPDATE public.product_images
SET url = public_url
WHERE url IS NULL AND public_url IS NOT NULL;

-- 3. Criar índices para rápida recuperação e ordenação da galeria
CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON public.product_images (product_id);
CREATE INDEX IF NOT EXISTS idx_product_images_sort_order ON public.product_images (product_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_product_images_primary ON public.product_images (product_id, is_primary);

-- 4. Garantir no máximo uma imagem principal ativa por produto
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_primary_product_image 
ON public.product_images (product_id) 
WHERE (is_primary = TRUE);

-- 5. Habilitar RLS e configurar permissões de leitura pública e escrita apenas para administradores
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public Read Product Images Table" ON public.product_images;
DROP POLICY IF EXISTS "Admin All Product Images Table" ON public.product_images;

CREATE POLICY "Public Read Product Images Table"
ON public.product_images FOR SELECT
USING (true);

CREATE POLICY "Admin All Product Images Table"
ON public.product_images FOR ALL
USING (
  auth.role() = 'authenticated'
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
)
WITH CHECK (
  auth.role() = 'authenticated'
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);
