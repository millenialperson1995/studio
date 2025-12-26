import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { cn } from '@/lib/utils';
import { FirebaseClientProvider } from '@/firebase';

export const metadata: Metadata = {
  title: 'Retífica Figueirêdo',
  description: 'Sistema de Gestão para Retíficas e Oficinas Mecânicas',
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    apple: '/icons/logo-192x192.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Retífica Figueirêdo',
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: '#1A237E',
}

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body
        className={cn(
          'min-h-screen bg-background font-sans antialiased',
          inter.variable
        )}
      >
        <FirebaseClientProvider>{children}</FirebaseClientProvider>
        <Toaster />
      </body>
    </html>
  );
}
