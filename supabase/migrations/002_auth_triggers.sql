-- 002_auth_triggers.sql
-- Gatilho para criar perfis automaticamente quando um novo usuário se cadastrar no Supabase Auth

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_role public.user_role;
  v_name TEXT;
  v_phone TEXT;
BEGIN
  -- Definir o papel (role) a partir dos metadados do usuário ou padrão para 'cliente'
  v_role := COALESCE((new.raw_user_meta_data->>'role')::public.user_role, 'cliente'::public.user_role);
  
  -- Definir o nome a partir dos metadados ou parte inicial do e-mail
  v_name := COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1));
  
  -- Definir o telefone a partir dos metadados
  v_phone := new.raw_user_meta_data->>'phone';

  -- Inserir na tabela de perfis
  INSERT INTO public.profiles (id, role, name, phone)
  VALUES (new.id, v_role, v_name, v_phone);

  -- Se for cliente, criar automaticamente na tabela de clientes
  IF v_role = 'cliente' THEN
    INSERT INTO public.customers (profile_id, company_name)
    VALUES (new.id, v_name);
  -- Se for técnico, criar automaticamente na tabela de técnicos
  ELSIF v_role = 'tecnico' THEN
    INSERT INTO public.technicians (profile_id)
    VALUES (new.id);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar o gatilho na tabela auth.users
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
