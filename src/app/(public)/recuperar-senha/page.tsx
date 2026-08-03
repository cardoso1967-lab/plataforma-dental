'use client';

import React, { useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, ArrowLeft, MailCheck } from 'lucide-react';

export default function RecuperarSenhaPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createSupabaseBrowserClient();

  const handleRecover = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Por favor, informe seu e-mail.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'https://plataforma-dental-pi.vercel.app/auth/redefinir-senha',
      });

      if (resetError) {
        console.error('Erro na recuperação de senha:', resetError);
        // We still show success to prevent email enumeration, but log the error.
      }

      setSuccess(true);
    } catch (err: any) {
      console.error('Falha ao tentar recuperar a senha:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="py-12 sm:py-16 bg-slate-50 flex-1 flex flex-col justify-center items-center px-4">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
        
        {/* Logo and Intro */}
        <div className="text-center space-y-3">
          <div className="mx-auto bg-white border border-slate-100 rounded-2xl w-16 h-16 flex items-center justify-center overflow-hidden shadow-md shadow-slate-200/50">
            <img src="/brand/mmuniz-icon.png" alt="M.MUNIZ" className="h-[78%] w-[78%] object-contain" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Recuperar Senha
          </h2>
          <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
            Informe seu e-mail para receber um link de redefinição de senha.
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
              <MailCheck className="w-10 h-10" />
              <p className="text-sm font-semibold">
                Se houver uma conta associada a este e-mail, enviamos um link para redefinir sua senha.
              </p>
            </div>
            <Link 
              href="/login" 
              className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar para o login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleRecover} className="space-y-4">
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

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-sky-500 hover:bg-sky-600 text-white py-3.5 px-4 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-md shadow-sky-500/10 active:scale-99 flex items-center justify-center gap-2 disabled:opacity-75"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                'Enviar link de recuperação'
              )}
            </button>
            
            <div className="pt-2 text-center">
              <Link 
                href="/login" 
                className="text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors inline-flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Voltar para o login
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
