-- 019_harden_product_duplication_security.sql
-- Fortalecer a segurança da função duplicate_product:
-- 1. Verificação explícita de auth.uid() e papéis autorizados (admin, manager, vendedor)
-- 2. Revogação estrita de execução para PUBLIC e anon
-- 3. Concessão exclusiva para authenticated

CREATE OR REPLACE FUNCTION public.duplicate_product(p_product_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_product_id UUID;
  v_base_name TEXT;
  v_base_sku TEXT;
  v_new_name TEXT;
  v_new_sku TEXT;
  v_counter INTEGER;
  v_is_unique BOOLEAN;
  v_variant RECORD;
  v_variant_new_sku TEXT;
  v_image RECORD;
  v_video RECORD;
  v_slug_base TEXT;
  v_new_slug TEXT;
  v_slug_counter INTEGER;
  v_user_role public.user_role;
BEGIN
  -- 1. Verificação explícita de autenticação
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;

  -- 2. Verificação explícita do papel do usuário em profiles
  SELECT role INTO v_user_role
  FROM public.profiles
  WHERE id = auth.uid();

  IF v_user_role IS NULL OR v_user_role NOT IN ('admin'::public.user_role, 'manager'::public.user_role, 'vendedor'::public.user_role) THEN
    RAISE EXCEPTION 'Não autorizado: usuário não possui permissão para duplicar produtos';
  END IF;

  -- 3. Buscar produto de origem
  SELECT name, COALESCE(sku, '') INTO v_base_name, v_base_sku
  FROM public.products
  WHERE id = p_product_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Produto não encontrado';
  END IF;

  -- 4. Gerar nome e SKU base único para o produto duplicado
  v_new_name := v_base_name || ' (Cópia)';
  
  IF v_base_sku = '' THEN
    v_base_sku := 'PROD';
  END IF;
  
  v_is_unique := FALSE;
  v_counter := 1;
  WHILE NOT v_is_unique LOOP
    IF v_counter = 1 THEN
      v_new_sku := v_base_sku || '-COPY';
    ELSE
      v_new_sku := v_base_sku || '-COPY-' || v_counter;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM public.products WHERE sku = v_new_sku) THEN
      v_is_unique := TRUE;
    ELSE
      v_counter := v_counter + 1;
    END IF;
  END LOOP;

  -- 5. Gerar slug único
  v_slug_base := (SELECT slug FROM public.products WHERE id = p_product_id) || '-copia';
  v_new_slug := v_slug_base;
  v_slug_counter := 1;
  WHILE EXISTS (SELECT 1 FROM public.products WHERE slug = v_new_slug) LOOP
    v_slug_counter := v_slug_counter + 1;
    v_new_slug := v_slug_base || '-' || v_slug_counter;
  END LOOP;
  
  -- 6. Inserir produto duplicado (inativo e com estoque zerado)
  INSERT INTO public.products (
    category_id, name, slug, description, price, sku, product_type,
    stock_quantity, is_active
  )
  SELECT 
    category_id, v_new_name, v_new_slug, description, price, v_new_sku, product_type,
    0, false
  FROM public.products
  WHERE id = p_product_id
  RETURNING id INTO v_new_product_id;

  -- 7. Duplicar variantes (estoque zerado, SKU com sufixo -COPY incremental)
  FOR v_variant IN SELECT * FROM public.product_variants WHERE product_id = p_product_id ORDER BY display_order ASC LOOP
    v_is_unique := FALSE;
    v_counter := 1;
    WHILE NOT v_is_unique LOOP
      IF v_counter = 1 THEN
        v_variant_new_sku := v_variant.sku || '-COPY';
      ELSE
        v_variant_new_sku := v_variant.sku || '-COPY-' || v_counter;
      END IF;
      
      IF NOT EXISTS (SELECT 1 FROM public.product_variants WHERE sku = v_variant_new_sku) THEN
        v_is_unique := TRUE;
      ELSE
        v_counter := v_counter + 1;
      END IF;
    END LOOP;

    INSERT INTO public.product_variants (
      product_id, capacity_liters, sku, price, stock_quantity, is_active, display_order
    ) VALUES (
      v_new_product_id, v_variant.capacity_liters, v_variant_new_sku, v_variant.price, 0, v_variant.is_active, v_variant.display_order
    );
  END LOOP;

  -- 8. Duplicar referências de imagens (reutilizando paths do Storage e URLs públicas)
  FOR v_image IN SELECT * FROM public.product_images WHERE product_id = p_product_id ORDER BY is_primary DESC, sort_order ASC LOOP
    INSERT INTO public.product_images (
      product_id, url, public_url, storage_path, is_primary, sort_order
    ) VALUES (
      v_new_product_id, v_image.url, v_image.public_url, v_image.storage_path, v_image.is_primary, v_image.sort_order
    );
  END LOOP;

  -- 9. Duplicar referências de vídeos (reutilizando paths do Storage e URLs públicas)
  FOR v_video IN SELECT * FROM public.product_videos WHERE product_id = p_product_id ORDER BY sort_order ASC LOOP
    INSERT INTO public.product_videos (
      product_id, storage_path, public_url, title, poster_url, sort_order
    ) VALUES (
      v_new_product_id, v_video.storage_path, v_video.public_url, v_video.title, v_video.poster_url, v_video.sort_order
    );
  END LOOP;

  RETURN v_new_product_id;
END;
$$;

-- Revogar permissões públicas/anônimas
REVOKE ALL ON FUNCTION public.duplicate_product(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.duplicate_product(UUID) FROM anon;

-- Conceder permissão estrita apenas para authenticated
GRANT EXECUTE ON FUNCTION public.duplicate_product(UUID) TO authenticated;

-- Registrar migração no schema_migrations
INSERT INTO supabase_migrations.schema_migrations (version, name)
VALUES ('019', 'harden_product_duplication_security')
ON CONFLICT (version) DO NOTHING;
