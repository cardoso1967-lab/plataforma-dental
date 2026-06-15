'use client';

import React, { useEffect } from 'react';
import { RefreshCw, AlertTriangle } from 'lucide-react';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ClienteRouteErrorBoundary({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error('Erro de nível de rota em /cliente:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-6 text-center bg-white border border-slate-100 rounded-3xl shadow-sm my-8">
      <div className="bg-rose-50 text-rose-600 p-4 rounded-2xl w-fit shadow-xs mb-4">
        <AlertTriangle className="w-8 h-8" />
      </div>
      <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider mb-2">
        Falha no Carregamento do Painel
      </h3>
      <p className="text-xs text-slate-500 font-semibold max-w-sm mb-6 leading-relaxed">
        Não foi possível carregar o acompanhamento de suporte.
        <br />
        Atualize a página ou tente novamente em alguns instantes.
      </p>
      <button
        onClick={() => reset()}
        className="bg-sky-500 hover:bg-sky-600 text-white py-3 px-5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-md shadow-sky-500/10 active:scale-98 flex items-center gap-2"
      >
        <RefreshCw className="w-4 h-4" />
        Tentar Novamente
      </button>
      {error.digest && (
        <span className="text-[9px] font-mono text-slate-400 mt-4 uppercase tracking-wider">
          Código do erro: #{error.digest}
        </span>
      )}
    </div>
  );
}
