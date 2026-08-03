'use client';

import React, { useState, useEffect } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, CheckCircle2, AlertTriangle, ArrowLeft } from 'lucide-react';

export default function RedefinirSenhaPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [invalidLink, setInvalidLink] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  useEffect(() => {
    // 1. Verify if we have a valid session established by verifyOtp
    const verifySession = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (!data.session) {
          setInvalidLink(true);
        }
      } catch (err) {
        setInvalidLink(true);
      } finally {
        setIsCheckingSession(false);
      }
    };

    verifySession();
  }, [supabase.auth]);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!password || !confirmPassword) {
      setError('Por favor, preencha todos os campos.');
      return;
    }

    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: password
      });

      if (updateError) {
        console.error('Erro ao atualizar senha:', updateError);
        setError('Ocorreu um erro ao redefinir a senha. A sessão pode ter expirado.');
        setLoading(false);
        return;
      }

      setSuccess(true);

      await supabase.auth.signOut();

      setTimeout(() => {
        router.replace('/login');
      }, 3000);

    } catch (err: any) {
      console.error('Falha de execução ao redefinir senha:', err);
      setError('Ocorreu um erro inesperado. Tente novamente.');
      setLoading(false);
    }
  };

  if (isCheckingSession) {
    return (
      <div className="py-12 sm:py-16 bg-slate-50 flex-1 flex flex-col justify-center items-center px-4">
        <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-3xl border border-slate-100 shadow-sm text-center">
          <div className="flex flex-col items-center gap-4 py-8">
            <Loader2 className="w-10 h-10 animate-spin text-sky-500" />
            <p className="text-sm text-slate-500 font-medium animate-pulse">
              Validando sessão...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (invalidLink) {
    return (
      <div className="py-12 sm:py-16 bg-slate-50 flex-1 flex flex-col justify-center items-center px-4">
        <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-3xl border border-slate-100 shadow-sm text-center">
          <div className="bg-rose-50 text-rose-600 p-6 rounded-2xl flex flex-col items-center gap-3">
            <AlertTriangle className="w-10 h-10" />
            <p className="text-sm font-semibold">
              Este link expirou ou já foi utilizado. Solicite um novo link.
            </p>
          </div>
          <Link
            href="/recuperar-senha"
            className="inline-flex items-center gap-2 text-sm font-bold text-sky-500 hover:text-sky-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Solicitar novo link
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="py-12 sm:py-16 bg-slate-50 flex-1 flex flex-col justify-center items-center px-4">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">

        {/* Logo and Intro */}
        <div className="text-center space-y-3">
          <div className="mx-auto bg-white border border-slate-100 rounded-2xl w-16 h-16 flex items-center justify-center overflow-hidden shadow-md shadow-slate-200/50">
            <img src="/brand/mmuniz-icon.png" alt="M.MUNIZ" className="h-[78%] w-[78%] object-contain" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Redefinir Senha
          </h2>
          <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
            Crie uma nova senha para sua conta.
          </p>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-100 text-rose-600 p-4 rounded-xl text-xs font-semibold leading-relaxed">
            {error}
          </div>
        )}

        {success ? (
          <div className="space-y-6 text-center">
            <div className="bg-emerald-50 text-emerald-600 p-6 rounded-2xl flex flex-col items-center gap-3">
              <CheckCircle2 className="w-10 h-10" />
              <p className="text-sm font-semibold">
                Senha redefinida com sucesso!
              </p>
              <p className="text-xs opacity-80">
                Redirecionando para o login...
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
                Nova senha
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

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
                Confirmar nova senha
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
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
                  Salvando...
                </>
              ) : (
                'Salvar nova senha'
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
