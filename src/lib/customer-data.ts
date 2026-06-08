import { createSupabaseServerClient } from './supabase-server';
import { redirect } from 'next/navigation';

export async function getCustomerSession() {
  const supabase = await createSupabaseServerClient();
  
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    redirect('/login');
  }

  // Obter perfil
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'cliente') {
    // Se não for cliente, o middleware deve redirecionar, mas fazemos um fallback seguro
    redirect('/login');
  }

  // Obter ou criar registro de cliente
  let { data: customer } = await supabase
    .from('customers')
    .select('*')
    .eq('profile_id', user.id)
    .single();

  if (!customer) {
    const { data: newCustomer, error: createError } = await supabase
      .from('customers')
      .insert({
        profile_id: user.id,
        company_name: profile.name || user.email?.split('@')[0] || 'Clínica Odontológica',
      })
      .select()
      .single();

    if (createError) {
      console.error('Erro ao criar registro de cliente:', createError);
      throw new Error('Não foi possível inicializar os dados do cliente.');
    }
    customer = newCustomer;
  }

  return { supabase, user, profile, customer };
}
