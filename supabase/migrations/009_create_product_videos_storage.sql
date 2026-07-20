-- 009_create_product_videos_storage.sql
-- Criar tabela product_videos e bucket público product-videos com limite de 50 MB e RLS

-- 1. Criar a tabela product_videos se não existir
CREATE TABLE IF NOT EXISTS public.product_videos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  public_url TEXT NOT NULL,
  title TEXT,
  poster_url TEXT,
  sort_order INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 2. Criar índices para busca rápida por produto e ordenação
CREATE INDEX IF NOT EXISTS idx_product_videos_product_id ON public.product_videos (product_id);
CREATE INDEX IF NOT EXISTS idx_product_videos_sort_order ON public.product_videos (product_id, sort_order);

-- 3. Função e Trigger para limitar a no máximo 2 vídeos por produto no banco de dados
CREATE OR REPLACE FUNCTION check_product_video_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT COUNT(*) FROM public.product_videos WHERE product_id = NEW.product_id) >= 2 THEN
    RAISE EXCEPTION 'Um produto não pode possuir mais de 2 vídeos cadastrados.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_limit_product_videos ON public.product_videos;
CREATE TRIGGER trg_limit_product_videos
  BEFORE INSERT ON public.product_videos
  FOR EACH ROW
  EXECUTE FUNCTION check_product_video_limit();

-- 4. Habilitar RLS e configurar políticas de leitura pública e escrita apenas para administradores
ALTER TABLE public.product_videos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public Read Product Videos Table" ON public.product_videos;
DROP POLICY IF EXISTS "Admin All Product Videos Table" ON public.product_videos;

CREATE POLICY "Public Read Product Videos Table"
ON public.product_videos FOR SELECT
USING (true);

CREATE POLICY "Admin All Product Videos Table"
ON public.product_videos FOR ALL
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

-- 5. Criar bucket público 'product-videos' no Supabase Storage (se não existir)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-videos',
  'product-videos',
  true,
  52428800, -- 50 MB em bytes
  ARRAY['video/mp4', 'video/webm']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY['video/mp4', 'video/webm'];

-- 6. Configurar políticas RLS no Storage para o bucket product-videos
DROP POLICY IF EXISTS "Public Read Product Videos Storage" ON storage.objects;
DROP POLICY IF EXISTS "Admin Upload Product Videos Storage" ON storage.objects;
DROP POLICY IF EXISTS "Admin Update Product Videos Storage" ON storage.objects;
DROP POLICY IF EXISTS "Admin Delete Product Videos Storage" ON storage.objects;

CREATE POLICY "Public Read Product Videos Storage"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-videos');

CREATE POLICY "Admin Upload Product Videos Storage"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'product-videos'
  AND auth.role() = 'authenticated'
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

CREATE POLICY "Admin Update Product Videos Storage"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'product-videos'
  AND auth.role() = 'authenticated'
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

CREATE POLICY "Admin Delete Product Videos Storage"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'product-videos'
  AND auth.role() = 'authenticated'
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);
