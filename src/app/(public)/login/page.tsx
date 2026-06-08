'use client';

import React, { useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Stethoscope, ShieldAlert, Wrench, User, Loader2, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Por favor, preencha todos os campos.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Ejecutar signInWithPassword
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError || !data.user) {
        setError(authError?.message === 'Invalid login credentials' 
          ? 'Credenciais inválidas. Verifique seu e-mail e senha.'
          : (authError?.message || 'Erro ao autenticar. Tente novamente.'));
        setLoading(false);
        return;
      }

      console.log('Login OK');
      console.log('User ID encontrado:', data.user.id);

      // 2. Buscar el registro en profiles usando el ID del usuario
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role, name')
        .eq('id', data.user.id)
        .single();

      if (profileError || !profile) {
        console.error('Erro ao buscar perfil do usuário:', profileError?.message);
        setError('Erro ao carregar dados do perfil do usuário. Entre em contato com o administrador.');
        setLoading(false);
        return;
      }

      console.log('Profile encontrado');
      console.log('Role encontrada:', profile.role);

      // 3. Determinar la ruta de destino según la columna role
      let targetRoute = '/cliente/dashboard';
      if (profile.role === 'admin') {
        targetRoute = '/admin/dashboard';
      } else if (profile.role === 'vendedor') {
        targetRoute = '/admin/pedidos-venda';
      } else if (profile.role === 'suporte') {
        targetRoute = '/admin/ordens-servico';
      } else if (profile.role === 'tecnico') {
        targetRoute = '/tecnico/dashboard';
      }

      console.log('Rota de destino:', targetRoute);

      // 4. Redireccionar usando router.replace y ejecutar router.refresh
      router.replace(targetRoute);
      router.refresh();

    } catch (err: any) {
      console.error('Falha de execução no fluxo de login:', err);
      setError('Ocorreu um erro ao tentar fazer login. Tente novamente.');
      setLoading(false);
    }
  };

  // Preenche as credenciais demo para teste rápido
  const handleQuickLogin = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('Dental123!'); // Senha padrão recomendada para contas de demonstração
    setError(null);
  };

  return (
    <div className="py-12 sm:py-16 bg-slate-50 flex-1 flex flex-col justify-center items-center px-4">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
        
        {/* Logo and Intro */}
        <div className="text-center space-y-3">
          <div className="mx-auto bg-sky-500 text-white p-3 rounded-2xl w-fit shadow-md shadow-sky-500/10">
            <Stethoscope className="w-8 h-8" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Plataforma <span className="text-sky-500">Dental</span>
          </h2>
          <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
            Faça login para gerenciar compras, agendamentos de assistência técnica ou atendimentos.
          </p>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-100 text-rose-600 p-4 rounded-xl text-xs font-semibold leading-relaxed">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
              E-mail
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="exemplo@clinica.com"
              disabled={loading}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all text-sm text-slate-800"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
              Senha
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              disabled={loading}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all text-sm text-slate-800"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-sky-500 hover:bg-sky-600 text-white py-3.5 px-4 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-md shadow-sky-500/10 active:scale-99 flex items-center justify-center gap-2 disabled:opacity-75"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Entrando...
              </>
            ) : (
              'Entrar'
            )}
          </button>
        </form>

        {/* Simulador de Acessos Rápidos (Demo) */}
        <div className="pt-6 border-t border-slate-100 space-y-4">
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">
            Atalhos para Contas de Demonstração
          </h3>
          <p className="text-[10px] text-slate-400 text-center leading-relaxed">
            Clique para preencher as credenciais e clique em Entrar (requer criação prévia no Supabase com senha <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">Dental123!</code>).
          </p>

          <div className="grid gap-2">
            {/* Admin */}
            <button
              type="button"
              onClick={() => handleQuickLogin('admin@dental.com')}
              disabled={loading}
              className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-slate-300 hover:bg-slate-50 transition-all group active:scale-99 text-left"
            >
              <div className="flex items-center gap-2.5">
                <div className="bg-slate-900 text-white p-1.5 rounded-lg">
                  <ShieldAlert className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="text-[11px] font-bold text-slate-800">Administrador / Staff</h4>
                  <p className="text-[9px] text-slate-400">admin@dental.com</p>
                </div>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5 transition-all" />
            </button>

            {/* Técnico */}
            <button
              type="button"
              onClick={() => handleQuickLogin('tecnico@dental.com')}
              disabled={loading}
              className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-slate-300 hover:bg-slate-50 transition-all group active:scale-99 text-left"
            >
              <div className="flex items-center gap-2.5">
                <div className="bg-cyan-50 text-cyan-600 p-1.5 rounded-lg">
                  <Wrench className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="text-[11px] font-bold text-slate-800">Técnico de Campo</h4>
                  <p className="text-[9px] text-slate-400">tecnico@dental.com</p>
                </div>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5 transition-all" />
            </button>

            {/* Cliente */}
            <button
              type="button"
              onClick={() => handleQuickLogin('cliente@dental.com')}
              disabled={loading}
              className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-slate-300 hover:bg-slate-50 transition-all group active:scale-99 text-left"
            >
              <div className="flex items-center gap-2.5">
                <div className="bg-emerald-50 text-emerald-600 p-1.5 rounded-lg">
                  <User className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="text-[11px] font-bold text-slate-800">Portal do Cliente</h4>
                  <p className="text-[9px] text-slate-400">cliente@dental.com</p>
                </div>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5 transition-all" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
