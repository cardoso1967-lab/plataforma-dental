-- 017_fix_product_media_storage_rls.sql
-- Correção de políticas de segurança no Storage e tabelas de mídia
-- para alinhar as permissões estendidas no 010_user_management.sql (admin, manager, vendedor).

-- 1. Atualizar RLS de public.product_videos (omitido no 010)
DROP POLICY IF EXISTS "Admin All Product Videos Table" ON public.product_videos;

CREATE POLICY "Gerenciamento de videos do produto por admin manager vendedor" 
ON public.product_videos FOR ALL
USING (
  auth.role() = 'authenticated' AND (
    public.check_is_admin() OR 
    public.check_is_manager() OR 
    public.check_is_vendedor()
  )
);

-- 2. Atualizar Políticas de Storage para product-images
DROP POLICY IF EXISTS "Admin Insert Product Images" ON storage.objects;
DROP POLICY IF EXISTS "Admin Update Product Images" ON storage.objects;
DROP POLICY IF EXISTS "Admin Delete Product Images" ON storage.objects;
DROP POLICY IF EXISTS "Insert Product Images por admin, manager e vendedor" ON storage.objects;
DROP POLICY IF EXISTS "Update Product Images por admin, manager e vendedor" ON storage.objects;
DROP POLICY IF EXISTS "Delete Product Images por admin, manager e vendedor" ON storage.objects;

CREATE POLICY "Insert Product Images por admin, manager e vendedor"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'product-images'
  AND auth.role() = 'authenticated'
  AND (
    public.check_is_admin() OR 
    public.check_is_manager() OR 
    public.check_is_vendedor()
  )
);

CREATE POLICY "Update Product Images por admin, manager e vendedor"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'product-images'
  AND auth.role() = 'authenticated'
  AND (
    public.check_is_admin() OR 
    public.check_is_manager() OR 
    public.check_is_vendedor()
  )
);

CREATE POLICY "Delete Product Images por admin, manager e vendedor"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'product-images'
  AND auth.role() = 'authenticated'
  AND (
    public.check_is_admin() OR 
    public.check_is_manager() OR 
    public.check_is_vendedor()
  )
);

-- 3. Atualizar Políticas de Storage para product-videos
DROP POLICY IF EXISTS "Admin Upload Product Videos Storage" ON storage.objects;
DROP POLICY IF EXISTS "Admin Update Product Videos Storage" ON storage.objects;
DROP POLICY IF EXISTS "Admin Delete Product Videos Storage" ON storage.objects;
DROP POLICY IF EXISTS "Insert Product Videos por admin, manager e vendedor" ON storage.objects;
DROP POLICY IF EXISTS "Update Product Videos por admin, manager e vendedor" ON storage.objects;
DROP POLICY IF EXISTS "Delete Product Videos por admin, manager e vendedor" ON storage.objects;

CREATE POLICY "Insert Product Videos por admin, manager e vendedor"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'product-videos'
  AND auth.role() = 'authenticated'
  AND (
    public.check_is_admin() OR 
    public.check_is_manager() OR 
    public.check_is_vendedor()
  )
);

CREATE POLICY "Update Product Videos por admin, manager e vendedor"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'product-videos'
  AND auth.role() = 'authenticated'
  AND (
    public.check_is_admin() OR 
    public.check_is_manager() OR 
    public.check_is_vendedor()
  )
);

CREATE POLICY "Delete Product Videos por admin, manager e vendedor"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'product-videos'
  AND auth.role() = 'authenticated'
  AND (
    public.check_is_admin() OR 
    public.check_is_manager() OR 
    public.check_is_vendedor()
  )
);
