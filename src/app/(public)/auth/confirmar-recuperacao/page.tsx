'use client';

import React, { useState, useEffect } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, ShieldCheck, AlertTriangle, ArrowLeft } from 'lucide-react';

export default function ConfirmarRecuperacaoPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [invalidLink, setInvalidLink] = useState(false);
  const [tokenHash, setTokenHash] = useState<string | null>(null);

  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  useEffect(() => {
    // 1. Extrair token_hash de forma segura no lado do cliente
    const search = window.location.search;
    const urlParams = new URLSearchParams(search);
    const hash = urlParams.get('token_hash');
    const type = urlParams.get('type');

    if (!hash || type !== 'recovery') {
      setInvalidLink(true);
      return;
    }

    setTokenHash(hash);
  }, []);

  const handleVerify = async () => {
    if (!tokenHash) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: 'recovery',
      });

      if (verifyError || !data.session) {
        console.error('Erro ao verificar token_hash:', verifyError);
        setInvalidLink(true);
        setLoading(false);
        return;
      }

      // Remover token da URL visualmente após sucesso
      window.history.replaceState(null, '', window.location.pathname);

      // Redirecionar para redefinir a senha
      router.replace('/auth/redefinir-senha');

    } catch (err) {
      console.error('Falha ao verificar token_hash PKCE:', err);
      setInvalidLink(true);
      setLoading(false);
    }
  };

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

        <div className="text-center space-y-3">
          <div className="mx-auto bg-white border border-slate-100 rounded-2xl w-16 h-16 flex items-center justify-center overflow-hidden shadow-md shadow-slate-200/50">
            <ShieldCheck className="w-8 h-8 text-sky-500" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Confirmar Recuperação
          </h2>
          <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
            Sua solicitação de redefinição de senha está pronta. Confirme para continuar.
          </p>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-100 text-rose-600 p-4 rounded-xl text-xs font-semibold leading-relaxed">
            {error}
          </div>
        )}

        <button
          onClick={handleVerify}
          disabled={loading || !tokenHash}
          className="w-full bg-sky-500 hover:bg-sky-600 text-white py-3.5 px-4 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-md shadow-sky-500/10 active:scale-99 flex items-center justify-center gap-2 disabled:opacity-75"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Validando...
            </>
          ) : (
            'Continuar para criar nova senha'
          )}
        </button>

      </div>
    </div>
  );
}
