import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Plataforma Dental | Venda e Assistência Técnica Odontológica',
  description: 'Soluções completas em equipamentos odontológicos, suporte especializado e gestão de manutenção.',
};

export default function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: any;
}>) {
  // Inicialmente configuramos como pt-BR. Posteriormente suportará es-MX via i18n
  return (
    <html lang="pt-BR" className="h-full">
      <body className="h-full bg-slate-50 text-slate-900 antialiased flex flex-col">
        {children}
      </body>
    </html>
  );
}
