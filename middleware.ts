import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

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

  // Refresca la sesión
  const { data: { user } } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // Rutas protegidas por prefijo
  const isAdminPath = pathname.startsWith('/admin');
  const isClientePath = pathname.startsWith('/cliente');
  const isTecnicoPath = pathname.startsWith('/tecnico');
  const isProtectedPath = isAdminPath || isClientePath || isTecnicoPath;
  const isLoginPage = pathname === '/login';

  // Si no está logueado y accede a ruta protegida, va a login
  if (isProtectedPath && !user) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // Si está logueado, validamos su rol y acceso
  if (user) {
    // Intentamos obtener el rol desde la base de datos
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const role = profile?.role || 'cliente';

    // Determina el destino correspondiente al rol
    let roleDashboard = '/cliente/dashboard';
    if (role === 'admin') roleDashboard = '/admin/dashboard';
    else if (role === 'vendedor') roleDashboard = '/admin/pedidos-venda';
    else if (role === 'suporte') roleDashboard = '/admin/ordens-servico';
    else if (role === 'tecnico') roleDashboard = '/tecnico/dashboard';

    // Si está en la página de login, redirige a su respectivo dashboard
    if (isLoginPage) {
      const url = request.nextUrl.clone();
      url.pathname = roleDashboard;
      return NextResponse.redirect(url);
    }

    // Validación de accesos cruzados
    if (isClientePath && role !== 'cliente') {
      const url = request.nextUrl.clone();
      url.pathname = roleDashboard;
      return NextResponse.redirect(url);
    }

    if (isTecnicoPath && role !== 'tecnico') {
      const url = request.nextUrl.clone();
      url.pathname = roleDashboard;
      return NextResponse.redirect(url);
    }

    if (isAdminPath && !['admin', 'vendedor', 'suporte'].includes(role)) {
      const url = request.nextUrl.clone();
      url.pathname = roleDashboard;
      return NextResponse.redirect(url);
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
