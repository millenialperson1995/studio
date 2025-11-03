'use client';

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
import type { UserProfile } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { PerfilForm } from '@/components/perfil/perfil-form';
import AuthenticatedPage from '@/components/layout/authenticated-page';

function PerfilContent() {
  const firestore = useFirestore();
  const { user } = useUser();

  const userDocRef = useMemoFirebase(
    () => (firestore && user?.uid ? doc(firestore, 'users', user.uid) : null),
    [firestore, user?.uid]
  );
  
  const { data: userProfile, isLoading, error } = useDoc<UserProfile>(userDocRef);

  if (isLoading) {
    return null; // Skeleton handled by AuthenticatedPage
  }

  return (
    <main className="flex-1 space-y-6 p-4 md:p-6 lg:p-8">
      <div>
        <h1 className="text-2xl font-semibold">Perfil</h1>
        <p className="text-muted-foreground">Gerencie suas informações pessoais.</p>
      </div>
      
      <Card>
          <CardHeader>
              <CardTitle>Seus Dados</CardTitle>
              <CardDescription>Altere seu nome, sobrenome e e-mail.</CardDescription>
          </CardHeader>
          <CardContent>
              <PerfilForm userProfile={userProfile} />
          </CardContent>
      </Card>
      
       {error && (
            <Card className="border-destructive">
                <CardHeader>
                    <CardTitle className="text-destructive">Erro</CardTitle>
                    <CardDescription className="text-destructive">Não foi possível carregar seus dados de perfil. Tente recarregar a página.</CardDescription>
                </CardHeader>
            </Card>
        )}
    </main>
  );
}

export default function PerfilPage() {
  return (
    <SidebarProvider>
      <Sidebar>
        <AppSidebar />
      </Sidebar>
      <SidebarInset>
        <AppHeader />
        <AuthenticatedPage>
          <PerfilContent />
        </AuthenticatedPage>
      </SidebarInset>
    </SidebarProvider>
  );
}