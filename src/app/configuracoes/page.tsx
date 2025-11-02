'use client';

import { useEffect } from 'react';
import AppHeader from '@/components/layout/app-header';
import AppSidebar from '@/components/layout/app-sidebar';
import {
  Sidebar,
  SidebarInset,
  SidebarProvider,
} from '@/components/ui/sidebar';
import { useDoc, useFirestore, useUser } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useMemoFirebase } from '@/firebase/provider';
import type { Oficina } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { OficinaForm } from '@/components/configuracoes/oficina-form';

function ConfiguracoesContent() {
  const firestore = useFirestore();
  const { user } = useUser();

  const oficinaDocRef = useMemoFirebase(
    () => (firestore && user?.uid ? doc(firestore, 'oficinas', user.uid) : null),
    [firestore, user?.uid]
  );
  
  const { data: oficina, isLoading, error } = useDoc<Oficina>(oficinaDocRef);

  if (isLoading) {
    return (
      <main className="flex-1 space-y-6 p-4 md:p-6 lg:p-8">
         <div className="space-y-2">
            <Skeleton className="h-8 w-1/3" />
            <Skeleton className="h-5 w-2/3" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-4 w-3/4" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="flex-1 space-y-6 p-4 md:p-6 lg:p-8">
      <div>
        <h1 className="text-2xl font-semibold">Configurações</h1>
        <p className="text-muted-foreground">Gerencie as informações da sua empresa que aparecem em documentos e relatórios.</p>
      </div>
      
      <Card>
          <CardHeader>
              <CardTitle>Dados da Oficina</CardTitle>
              <CardDescription>Estas informações serão usadas para gerar PDFs e outros documentos.</CardDescription>
          </CardHeader>
          <CardContent>
              <OficinaForm oficina={oficina} />
          </CardContent>
      </Card>
      
       {error && (
            <Card className="border-destructive">
                <CardHeader>
                    <CardTitle className="text-destructive">Erro</CardTitle>
                    <CardDescription className="text-destructive">Não foi possível carregar os dados da oficina. Tente recarregar a página.</CardDescription>
                </CardHeader>
            </Card>
        )}
    </main>
  );
}

export default function ConfiguracoesPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  if (isUserLoading || !user) {
    return (
      <SidebarProvider>
        <Sidebar><AppSidebar /></Sidebar>
        <SidebarInset>
          <AppHeader />
          <main className="flex-1 space-y-6 p-4 md:p-6 lg:p-8">
            <Skeleton className="h-8 w-48 mb-6" />
            <Skeleton className="h-96 w-full" />
          </main>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <Sidebar>
        <AppSidebar />
      </Sidebar>
      <SidebarInset>
        <AppHeader />
        <ConfiguracoesContent />
      </SidebarInset>
    </SidebarProvider>
  );
}

    