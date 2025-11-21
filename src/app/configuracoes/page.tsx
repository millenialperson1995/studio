'use client';

import MobileLayout from '@/components/layout/mobile-layout';
import { useDoc, useFirestore, useUser } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useMemoFirebase } from '@/firebase/provider';
import type { Oficina } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { OficinaForm } from '@/components/configuracoes/oficina-form';
import AuthenticatedPage from '@/components/layout/authenticated-page';

function ConfiguracoesContent() {
  const firestore = useFirestore();
  const { user } = useUser();

  const oficinaDocRef = useMemoFirebase(
    () => (firestore && user?.uid ? doc(firestore, 'oficinas', user.uid) : null),
    [firestore, user?.uid]
  );

  const { data: oficina, isLoading, error } = useDoc<Oficina>(oficinaDocRef);

  if (isLoading) {
    return null; // Skeleton handled by AuthenticatedPage
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
  return (
    <MobileLayout>
      <AuthenticatedPage>
        <ConfiguracoesContent />
      </AuthenticatedPage>
    </MobileLayout>
  );
}
    
