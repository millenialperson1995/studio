'use client';

import { useDoc, useFirestore, useUser } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useMemoFirebase } from '@/firebase/provider';
import type { Oficina } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { OficinaForm } from '@/components/configuracoes/oficina-form';

export function ConfiguracaoOficina() {
  const firestore = useFirestore();
  const { user } = useUser();

  const oficinaDocRef = useMemoFirebase(
    () => (firestore && user?.uid ? doc(firestore, 'oficinas', user.uid) : null),
    [firestore, user?.uid]
  );

  const { data: oficina, isLoading, error } = useDoc<Oficina>(oficinaDocRef);

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-6">Configurações da Oficina</h2>
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
        <Card className="border-destructive mt-4">
          <CardHeader>
            <CardTitle className="text-destructive">Erro</CardTitle>
            <CardDescription className="text-destructive">
              Não foi possível carregar os dados da oficina. Tente recarregar a página.
            </CardDescription>
          </CardHeader>
        </Card>
      )}
    </div>
  );
}