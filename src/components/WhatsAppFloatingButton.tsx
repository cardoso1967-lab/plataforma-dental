'use client';

import React from 'react';
import { usePathname } from 'next/navigation';

export const WhatsAppFloatingButton: React.FC = () => {
  const pathname = usePathname();

  // O botão flutuante deve aparecer apenas nas páginas públicas especificadas:
  // '/', '/produtos', '/produtos/[slug]' e '/contato'
  const allowedPaths = ['/', '/produtos', '/contato'];
  const isAllowed = allowedPaths.includes(pathname) || pathname.startsWith('/produtos/');

  if (!isAllowed) return null;

  const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;
  
  // Link sugerido para o WhatsApp:
  // https://wa.me/NUMERO?text=Olá,%20gostaria%20de%20saber%20mais%20sobre%20os%20equipamentos%20odontológicos%20da%20M.MUNIZ.
  const href = whatsappNumber
    ? `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
        'Olá, gostaria de saber mais sobre os equipamentos odontológicos da M.MUNIZ.'
      )}`
    : '/contato';

  const isExternal = !!whatsappNumber;

  return (
    <a
      href={href}
      target={isExternal ? '_blank' : undefined}
      rel={isExternal ? 'noopener noreferrer' : undefined}
      className="fixed bottom-6 right-6 z-50 bg-[#25D366] hover:bg-[#20ba5a] text-white p-3.5 sm:p-4 rounded-full shadow-lg hover:shadow-2xl transition-all duration-300 flex items-center justify-center group active:scale-95 border border-[#25D366] cursor-pointer"
      aria-label="Fale conosco no WhatsApp"
    >
      <svg
        className="w-6 h-6 sm:w-7 sm:h-7 fill-current"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.513 2.262 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.965C16.528 2.01 14.069.99 11.999.99 6.562.99 2.137 5.36 2.134 10.79c-.001 1.766.478 3.49 1.385 5.035l-.999 3.65 3.743-.974zm11.368-6.41c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
      </svg>
      <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 ease-out whitespace-nowrap text-xs sm:text-sm font-bold select-none group-hover:ml-2">
        WhatsApp
      </span>
    </a>
  );
};
