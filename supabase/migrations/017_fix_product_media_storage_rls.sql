-- 017_fix_product_media_storage_rls.sql
-- Correção de RLS para upload de vídeos de produtos (TUS resumable upload)
-- Permite que admin, manager e vendedor façam INSERT.

-- 1. Atualizar RLS de public.product_videos para permitir INSERT
CREATE POLICY "Insert Product Videos Table"
ON public.product_videos FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin'::public.user_role, 'manager'::public.user_role, 'vendedor'::public.user_role)
  )
);

-- 2. Atualizar Políticas de Storage para product-videos (Somente INSERT necessário para iniciar TUS)
CREATE POLICY "Insert Product Videos Storage"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'product-videos'
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin'::public.user_role, 'manager'::public.user_role, 'vendedor'::public.user_role)
  )
);

-- Registra a migração manualmente, já que db push não pode ser usado
INSERT INTO supabase_migrations.schema_migrations (version, name)
VALUES ('017', 'fix_product_media_storage_rls')
ON CONFLICT (version) DO NOTHING;
