'use server';

import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Inicializar cliente admin seguro (apenas se a chave de serviço estiver presente)
const getAdminClient = () => {
  if (!supabaseServiceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY não está configurada no servidor.');
  }
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

// Inicializar cliente padrão com as cookies do usuário atual (para validação de sessão)
const getUserClient = async () => {
  const cookieStore = await cookies();
  return createServerClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Silenciar erros de Server Components
        }
      },
    },
  });
};

// Helper para validar se o requisitante é um administrador ativo
const checkAdminAuth = async () => {
  const userClient = await getUserClient();
  const { data: { user }, error: authError } = await userClient.auth.getUser();
  
  if (authError || !user) {
    throw new Error('Não autenticado.');
  }

  const { data: profile, error: profileError } = await userClient
    .from('profiles')
    .select('role, is_active')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    throw new Error('Perfil não encontrado.');
  }

  if (profile.role !== 'admin') {
    throw new Error('Acesso negado: Apenas administradores podem gerenciar usuários.');
  }

  if (profile.is_active === false) {
    throw new Error('Conta desativada.');
  }

  return user.id;
};

// 1. Listar usuários combinando tabela profiles e auth.users
export async function getUsersList() {
  try {
    await checkAdminAuth();
    
    if (!supabaseServiceKey) {
      return { error: 'Chave administrativa SUPABASE_SERVICE_ROLE_KEY ausente.', serviceKeyMissing: true };
    }

    const adminClient = getAdminClient();

    // Buscar perfis
    const { data: profiles, error: pError } = await adminClient
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (pError) throw pError;

    // Buscar usuários do Auth
    const { data: authData, error: aError } = await adminClient.auth.admin.listUsers();
    if (aError) throw aError;

    const authUsers = authData.users || [];

    // Fazer merge dos dados
    const mergedUsers = (profiles || []).map((p: any) => {
      const au = authUsers.find((u) => u.id === p.id);
      return {
        id: p.id,
        name: p.name,
        role: p.role,
        is_active: p.is_active,
        phone: p.phone,
        created_at: p.created_at,
        email: au?.email || 'N/A',
        last_sign_in_at: au?.last_sign_in_at || null,
      };
    });

    return { data: mergedUsers };
  } catch (err: any) {
    console.error('Erro em getUsersList:', err.message);
    return { error: err.message || 'Erro interno do servidor.' };
  }
}

// 2. Listar técnicos disponíveis para vinculação
export async function getTechniciansList() {
  try {
    await checkAdminAuth();
    const adminClient = getAdminClient();

    const { data: technicians, error } = await adminClient
      .from('technicians')
      .select(`
        id,
        profile_id,
        specialties,
        is_active,
        profile:profiles(name)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    // Mapear de forma simplificada
    const formattedTechs = (technicians || []).map((t: any) => ({
      id: t.id,
      profile_id: t.profile_id,
      is_active: t.is_active,
      name: t.profile ? t.profile.name : `Técnico Sem Nome (ID: ${t.id.substring(0, 6)})`
    }));

    return { data: formattedTechs };
  } catch (err: any) {
    console.error('Erro em getTechniciansList:', err.message);
    return { error: err.message };
  }
}

// 3. Salvar ou atualizar usuário (criação via Auth Admin API)
export async function saveUser(formData: {
  id?: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'technician' | 'standard_user' | 'cliente';
  is_active: boolean;
  phone?: string;
  linkedTechnicianId?: string; // ID do registro de técnico para vincular
  password?: string;
}) {
  try {
    const callerId = await checkAdminAuth();

    if (!supabaseServiceKey) {
      return { error: 'Chave administrativa SUPABASE_SERVICE_ROLE_KEY ausente no servidor.', serviceKeyMissing: true };
    }

    const adminClient = getAdminClient();

    if (formData.id) {
      // ----------------------------------------------------
      // FLUXO DE EDIÇÃO
      // ----------------------------------------------------
      const targetUserId = formData.id;

      // Regra de segurança: Proibir desativação ou alteração de cargo do último administrador ativo
      if (formData.role !== 'admin' || !formData.is_active) {
        // Obter os administradores ativos atuais
        const { data: admins, error: countError } = await adminClient
          .from('profiles')
          .select('id, is_active')
          .eq('role', 'admin')
          .eq('is_active', true);

        if (countError) throw countError;

        const activeAdminIds = (admins || []).map(a => a.id);

        if (activeAdminIds.includes(targetUserId) && activeAdminIds.length <= 1) {
          return { error: 'Não é permitido desativar ou alterar o papel do último administrador ativo no sistema.' };
        }
      }

      // Atualizar dados do perfil no banco público
      // O banco tem o enum 'tecnico' para técnicos do portal, então se for 'technician' mapeamos para 'tecnico' ao salvar no banco
      const dbRole = formData.role === 'technician' ? 'tecnico' : formData.role;

      const { error: profileUpdateError } = await adminClient
        .from('profiles')
        .update({
          name: formData.name,
          role: dbRole,
          phone: formData.phone || null,
          is_active: formData.is_active,
          updated_at: new Date().toISOString(),
        })
        .eq('id', targetUserId);

      if (profileUpdateError) throw profileUpdateError;

      // Atualizar e-mail e metadados no Supabase Auth
      const { error: authUpdateError } = await adminClient.auth.admin.updateUserById(
        targetUserId,
        {
          email: formData.email,
          user_metadata: {
            name: formData.name,
            role: dbRole,
            phone: formData.phone || '',
            is_active: formData.is_active,
          },
        }
      );

      if (authUpdateError) throw authUpdateError;

      // Lógica de Vinculação com Técnico na tabela technicians
      // 1. Remover vinculo antigo deste usuário em qualquer registro de técnico
      const { error: unlinkError } = await adminClient
        .from('technicians')
        .update({ profile_id: null })
        .eq('profile_id', targetUserId);

      if (unlinkError) throw unlinkError;

      // 2. Se for role technician e tiver um técnico selecionado, vinculá-lo
      if (formData.role === 'technician' && formData.linkedTechnicianId) {
        // Remover outros vínculos deste técnico específico primeiro
        const { error: cleanTechError } = await adminClient
          .from('technicians')
          .update({ profile_id: null })
          .eq('id', formData.linkedTechnicianId);
        
        if (cleanTechError) throw cleanTechError;

        // Atualizar com o novo profile_id
        const { error: linkError } = await adminClient
          .from('technicians')
          .update({ profile_id: targetUserId })
          .eq('id', formData.linkedTechnicianId);

        if (linkError) throw linkError;

        // Limpar o técnico automático que o trigger handle_new_user pode ter criado
        // Para manter o banco limpo e sem técnicos duplicados
        await adminClient
          .from('technicians')
          .delete()
          .eq('profile_id', targetUserId)
          .neq('id', formData.linkedTechnicianId);
      } else if (formData.role === 'technician') {
        // Se a role é técnico mas não especificou técnico vinculado, podemos criar um automaticamente se não houver nenhum
        const { data: existingTechs } = await adminClient
          .from('technicians')
          .select('id')
          .eq('profile_id', targetUserId);

        if (!existingTechs || existingTechs.length === 0) {
          await adminClient.from('technicians').insert({ profile_id: targetUserId });
        }
      }

      return { success: true };
    } else {
      // ----------------------------------------------------
      // FLUXO DE CRIAÇÃO / CONVITE
      // ----------------------------------------------------
      const tempPassword = formData.password || 'Dental123!';
      const dbRole = formData.role === 'technician' ? 'tecnico' : formData.role;

      // Criar usuário no Supabase Auth com email confirmado
      const { data: authUser, error: createUserError } = await adminClient.auth.admin.createUser({
        email: formData.email,
        email_confirm: true,
        password: tempPassword,
        user_metadata: {
          name: formData.name,
          role: dbRole,
          phone: formData.phone || '',
          is_active: formData.is_active,
        },
      });

      if (createUserError) throw createUserError;
      if (!authUser.user) throw new Error('Falha ao instanciar usuário no Supabase Auth.');

      // O trigger postgres handle_new_user() insere automaticamente na tabela de profiles e technicians
      // Porém, vamos forçar uma atualização nos campos de name/role/is_active no perfil caso precise ajustar
      const { error: forceProfileError } = await adminClient
        .from('profiles')
        .update({
          name: formData.name,
          role: dbRole,
          phone: formData.phone || null,
          is_active: formData.is_active,
        })
        .eq('id', authUser.user.id);

      if (forceProfileError) throw forceProfileError;

      // Lógica de Vinculação com Técnico para o novo usuário
      if (formData.role === 'technician' && formData.linkedTechnicianId) {
        // Remover outros vínculos deste técnico específico primeiro
        const { error: cleanTechError } = await adminClient
          .from('technicians')
          .update({ profile_id: null })
          .eq('id', formData.linkedTechnicianId);

        if (cleanTechError) throw cleanTechError;

        // Associar o técnico selecionado ao ID do novo usuário
        const { error: linkError } = await adminClient
          .from('technicians')
          .update({ profile_id: authUser.user.id })
          .eq('id', formData.linkedTechnicianId);

        if (linkError) throw linkError;

        // Remover o técnico automático genérico criado pelo trigger handle_new_user()
        await adminClient
          .from('technicians')
          .delete()
          .eq('profile_id', authUser.user.id)
          .neq('id', formData.linkedTechnicianId);
      }

      return { success: true, tempPasswordCreated: tempPassword };
    }
  } catch (err: any) {
    console.error('Erro em saveUser:', err.message);
    return { error: err.message || 'Erro ao processar alteração de usuário.' };
  }
}
