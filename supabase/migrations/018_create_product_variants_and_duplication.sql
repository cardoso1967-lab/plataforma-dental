-- 018_create_product_variants_and_duplication.sql

CREATE TABLE public.product_variants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  capacity_liters NUMERIC NOT NULL CHECK (capacity_liters > 0),
  sku TEXT NOT NULL UNIQUE,
  price NUMERIC(12, 2) NOT NULL CHECK (price >= 0),
  stock_quantity INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE (product_id, capacity_liters)
);

CREATE INDEX idx_product_variants_product_id ON public.product_variants(product_id);
CREATE INDEX idx_product_variants_is_active ON public.product_variants(is_active);
CREATE INDEX idx_product_variants_display_order ON public.product_variants(display_order);

CREATE TRIGGER update_product_variants_updated_at BEFORE UPDATE ON public.product_variants FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Público pode ler variantes ativas" ON public.product_variants
FOR SELECT USING (
  is_active = true 
  AND EXISTS (
    SELECT 1 FROM public.products p 
    WHERE p.id = product_variants.product_id 
    AND (p.is_active = true OR public.check_is_admin() OR public.check_is_manager() OR public.check_is_vendedor())
  )
  OR public.check_is_admin() 
  OR public.check_is_manager() 
  OR public.check_is_vendedor()
);

CREATE POLICY "Vendas gerencia variantes" ON public.product_variants
FOR ALL USING (
  public.check_is_admin() OR public.check_is_manager() OR public.check_is_vendedor()
);

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
BEGIN
  -- Verify authorization
  IF NOT (public.check_is_admin() OR public.check_is_manager() OR public.check_is_vendedor()) THEN
    RAISE EXCEPTION 'Não autorizado';
  END IF;

  SELECT name, COALESCE(sku, '') INTO v_base_name, v_base_sku
  FROM public.products
  WHERE id = p_product_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Produto não encontrado';
  END IF;

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

  v_slug_base := (SELECT slug FROM public.products WHERE id = p_product_id) || '-copia';
  v_new_slug := v_slug_base;
  v_slug_counter := 1;
  WHILE EXISTS (SELECT 1 FROM public.products WHERE slug = v_new_slug) LOOP
    v_slug_counter := v_slug_counter + 1;
    v_new_slug := v_slug_base || '-' || v_slug_counter;
  END LOOP;
  
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

  FOR v_image IN SELECT * FROM public.product_images WHERE product_id = p_product_id ORDER BY is_primary DESC, sort_order ASC LOOP
    INSERT INTO public.product_images (
      product_id, url, public_url, storage_path, is_primary, sort_order
    ) VALUES (
      v_new_product_id, v_image.url, v_image.public_url, v_image.storage_path, v_image.is_primary, v_image.sort_order
    );
  END LOOP;

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

GRANT EXECUTE ON FUNCTION public.duplicate_product(UUID) TO authenticated;

INSERT INTO supabase_migrations.schema_migrations (version, name)
VALUES ('018', 'create_product_variants_and_duplication')
ON CONFLICT (version) DO NOTHING;
