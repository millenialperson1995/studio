'use client';

import { ReactNode } from 'react';
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
  const isDesktop = useMediaQuery('(min-width: 768px)');

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