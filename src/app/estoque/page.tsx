'use client';

import { useState, useEffect } from 'react';
import AppHeader from '@/components/layout/app-header';
import AppSidebar from '@/components/layout/app-sidebar';
import {
  Sidebar,
  SidebarInset,
  SidebarProvider,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { useCollection, useFirestore, useUser } from '@/firebase';
import { useMemoFirebase } from '@/firebase/provider';
import { collection, query, where } from 'firebase/firestore';
import type { Peca } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { AddPecaForm } from '@/components/estoque/add-peca-form';
import PecaTable from '@/components/estoque/peca-table';
import { useRouter } from 'next/navigation';

function EstoqueContent() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const firestore = useFirestore();
  const { user } = useUser();
  const pecasCollectionRef = useMemoFirebase(
    () => (firestore && user?.uid ? query(collection(firestore, 'pecas'), where('userId', '==', user.uid)) : null),
    [firestore, user?.uid]
  );
  const { data: pecas, isLoading, error } = useCollection<Peca>(pecasCollectionRef);

  if (isLoading) {
    return (
      <main className="flex-1 space-y-6 p-4 md:p-6 lg:p-8">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-36" />
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Controle de Estoque</CardTitle>
            <CardDescription>
              Gerencie as peças e produtos da sua retífica.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="flex-1 space-y-6 p-4 md:p-6 lg:p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Estoque de Peças</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Adicionar Peça
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Adicionar Nova Peça</DialogTitle>
              <DialogDescription>
                Preencha os dados para cadastrar uma nova peça no estoque.
              </DialogDescription>
            </DialogHeader>
            <AddPecaForm setDialogOpen={setIsDialogOpen} />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Controle de Estoque</CardTitle>
          <CardDescription>
            Gerencie as peças e produtos da sua retífica.
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto max-w-full">
          <PecaTable pecas={pecas || []} />
          {error && (
            <div className="text-destructive text-center p-4">
              Ocorreu um erro ao carregar as peças. Tente novamente.
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}

export default function EstoquePage() {
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
            <div className="flex items-center justify-between">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-10 w-36" />
            </div>
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
        <EstoqueContent />
      </SidebarInset>
    </SidebarProvider>
  );
}
