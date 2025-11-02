'use client';

import { useState, useEffect } from 'react';
import AppHeader from '@/components/layout/app-header';
import AppSidebar from '@/components/layout/app-sidebar';
import {
  Sidebar,
  SidebarInset,
  SidebarProvider,
} from '@/components/ui/sidebar';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { DiagnosticoForm } from '@/components/diagnostico/diagnostico-form';
import { DiagnosticoResultado } from '@/components/diagnostico/diagnostico-resultado';
import type { DiagnosticoMotorOutput } from '@/lib/types';

function DiagnosticoContent() {
  const [resultado, setResultado] = useState<DiagnosticoMotorOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  return (
    <main className="flex-1 space-y-6 p-4 md:p-6 lg:p-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">Diagnóstico de Motor com IA</h1>
        <p className="text-muted-foreground">Descreva os problemas do veículo para receber um plano de diagnóstico.</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
            <CardHeader>
                <CardTitle>Informações do Veículo</CardTitle>
                <CardDescription>Quanto mais detalhes, mais preciso será o diagnóstico.</CardDescription>
            </CardHeader>
            <CardContent>
                <DiagnosticoForm 
                    setResultado={setResultado} 
                    setIsLoading={setIsLoading} 
                    isLoading={isLoading}
                />
            </CardContent>
        </Card>

        <Card>
             <CardHeader>
                <CardTitle>Plano de Diagnóstico Sugerido</CardTitle>
                <CardDescription>A IA irá gerar os passos recomendados abaixo.</CardDescription>
            </CardHeader>
            <CardContent>
                <DiagnosticoResultado resultado={resultado} isLoading={isLoading} />
            </CardContent>
        </Card>
      </div>
    </main>
  );
}

export default function DiagnosticoPage() {
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
            <Skeleton className="h-8 w-1/3 mb-4" />
            <Skeleton className="h-5 w-2/3 mb-6" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Skeleton className="h-96 w-full" />
              <Skeleton className="h-96 w-full" />
            </div>
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
        <DiagnosticoContent />
      </SidebarInset>
    </SidebarProvider>
  );
}
