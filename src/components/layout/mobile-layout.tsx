'use client';

import { ReactNode, useState, useEffect } from 'react';
import { useMediaQuery } from 'usehooks-ts';
import AppHeader from './app-header';
import AppSidebar from './app-sidebar';
import BottomNavigation from './bottom-navigation';
import {
  Sidebar,
  SidebarInset,
  SidebarProvider,
} from '../ui/sidebar';
import AuthenticatedPage from './authenticated-page';

interface MobileLayoutProps {
  children: ReactNode;
}

export default function MobileLayout({ children }: MobileLayoutProps) {
  const [hasMounted, setHasMounted] = useState(false);
  const isDesktop = useMediaQuery('(min-width: 768px)');

  useEffect(() => {
    setHasMounted(true);
  }, []);

  // Evita hydration mismatch renderizando ambos layouts até que o componente esteja montado no cliente
  if (!hasMounted) {
    // Retorna um layout base vazio durante a hidratação para evitar conflitos
    return (
      <div className="flex flex-col min-h-screen">
        <AppHeader />
        <main className="flex-1">
          <AuthenticatedPage>
            {children}
          </AuthenticatedPage>
        </main>
      </div>
    );
  }

  if (isDesktop) {
    // Layout padrão para desktop
    return (
      <SidebarProvider>
        <Sidebar>
          <AppSidebar />
        </Sidebar>
        <SidebarInset>
          <AppHeader />
          <AuthenticatedPage>
            {children}
          </AuthenticatedPage>
        </SidebarInset>
      </SidebarProvider>
    );
  } else {
    // Layout mobile com bottom navigation
    return (
      <div className="flex flex-col min-h-screen">
        <AppHeader />
        <main className="flex-1 pb-16"> {/* Espaçamento para a bottom navigation */}
          <AuthenticatedPage>
            {children}
          </AuthenticatedPage>
        </main>
        <BottomNavigation />
      </div>
    );
  }
}