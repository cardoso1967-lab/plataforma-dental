import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

// Helper para redireccionar preservando las cookies de sesión actualizadas
function redirectWithCookies(supabaseResponse: NextResponse, redirectUrl: URL) {
  const redirectResponse = NextResponse.redirect(redirectUrl);
  
  // Copiar todas las cookies de la respuesta de Supabase a la respuesta de redirección
  supabaseResponse.cookies.getAll().forEach((cookie) => {
    redirectResponse.cookies.set(cookie.name, cookie.value, {
      path: cookie.path,
      domain: cookie.domain,
      maxAge: cookie.maxAge,
      secure: cookie.secure,
      sameSite: cookie.sameSite,
      expires: cookie.expires,
    });
  });
  
  return redirectResponse;
}

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder',
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresca la sesión y obtiene al usuario
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError) {
    console.error('Erro de autenticação ao obter usuário no middleware:', userError.message);
  }

  const pathname = request.nextUrl.pathname;

  // Rutas protegidas por prefijo
  const isAdminPath = pathname.startsWith('/admin');
  const isClientePath = pathname.startsWith('/cliente');
  const isTecnicoPath = pathname.startsWith('/tecnico');
  const isProtectedPath = isAdminPath || isClientePath || isTecnicoPath;
  const isLoginPage = pathname === '/login';

  // 1. Si no está logueado y accede a ruta protegida -> Redirigir a /login
  if (isProtectedPath && !user) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return redirectWithCookies(supabaseResponse, url);
  }

  // 2. Si está logueado, validar rol y accesos
  if (user) {
    let role = 'cliente';
    let is_active = true;

    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role, is_active')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Erro seguro ao consultar perfil no middleware (ID do usuário omitido por segurança):', profileError.message);
      } else if (profile) {
        role = profile.role || 'cliente';
        is_active = profile.is_active !== false;
      }
    } catch (err: any) {
      console.error('Falha de execução ao buscar perfil no middleware:', err?.message || err);
    }

    // Se o usuário estiver inativo e acessar uma rota protegida -> Redirecionar para login
    if (isProtectedPath && !is_active) {
      try {
        await supabase.auth.signOut();
      } catch (e) {
        console.error('Erro ao efetuar signout de usuário inativo no middleware:', e);
      }
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('error', 'inactive');
      return redirectWithCookies(supabaseResponse, url);
    }

    // Definir panel correspondiente al rol
    let roleDashboard = '/cliente/dashboard';
    if (role === 'admin') roleDashboard = '/admin/dashboard';
    else if (role === 'manager') roleDashboard = '/admin/dashboard';
    else if (role === 'standard_user') roleDashboard = '/admin/dashboard';
    else if (['tecnico', 'technician'].includes(role)) roleDashboard = '/tecnico/dashboard';
    else if (role === 'vendedor') roleDashboard = '/admin/pedidos-venda';
    else if (role === 'suporte') roleDashboard = '/admin/ordens-servico';

    // Si intenta acceder a /login estando ya logueado y activo -> Redirigir a su panel
    if (isLoginPage && is_active) {
      const url = request.nextUrl.clone();
      url.pathname = roleDashboard;
      return redirectWithCookies(supabaseResponse, url);
    }

    // Validaciones de acceso cruzado:
    // Cliente en rota de admin ou técnico -> Redirecionar a seu painel
    if (isClientePath && role !== 'cliente') {
      const url = request.nextUrl.clone();
      url.pathname = roleDashboard;
      return redirectWithCookies(supabaseResponse, url);
    }

    if (isTecnicoPath && !['tecnico', 'technician'].includes(role)) {
      const url = request.nextUrl.clone();
      url.pathname = roleDashboard;
      return redirectWithCookies(supabaseResponse, url);
    }

    if (isAdminPath) {
      // Apenas perfis internos permitidos em rotas de administração
      if (!['admin', 'manager', 'standard_user', 'vendedor', 'suporte'].includes(role)) {
        const url = request.nextUrl.clone();
        url.pathname = roleDashboard;
        return redirectWithCookies(supabaseResponse, url);
      }

      // Restrições de subpáginas em /admin:
      const isAdminUsuarios = pathname.startsWith('/admin/usuarios');
      const isAdminTecnicos = pathname.startsWith('/admin/tecnicos');
      const isAdminRelatorios = pathname.startsWith('/admin/relatorios');

      // 1. Apenas administradores acessam a área de usuários (/admin/usuarios)
      if (isAdminUsuarios && role !== 'admin') {
        const url = request.nextUrl.clone();
        url.pathname = roleDashboard;
        return redirectWithCookies(supabaseResponse, url);
      }

      // 2. Perfis standard_user não acessam Usuários, Técnicos e Relatórios
      if (role === 'standard_user') {
        if (isAdminUsuarios || isAdminTecnicos || isAdminRelatorios) {
          const url = request.nextUrl.clone();
          url.pathname = roleDashboard;
          return redirectWithCookies(supabaseResponse, url);
        }
      }
    }
  }

  return supabaseResponse;
}

// Configurar qué rutas activan el middleware
export const config = {
  matcher: [
    '/admin/:path*',
    '/cliente/:path*',
    '/tecnico/:path*',
    '/login',
  ],
};
