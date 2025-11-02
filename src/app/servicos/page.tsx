'use client';

import { useState } from 'react';
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
import type { Servico } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog';
import { AddServicoForm } from '@/components/servicos/add-servico-form';
import ServicoTable from '@/components/servicos/servico-table';
import AuthenticatedPage from '@/components/layout/authenticated-page';

function ServicosContent() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const firestore = useFirestore();
  const { user } = useUser();
  const servicosCollectionRef = useMemoFirebase(
    () => (firestore && user?.uid ? query(collection(firestore, 'servicos'), where('userId', '==', user.uid)) : null),
    [firestore, user?.uid]
  );
  const { data: servicos, isLoading, error } = useCollection<Servico>(servicosCollectionRef);

  if (isLoading) {
    return null; // Skeleton handled by AuthenticatedPage
  }

  return (
    <main className="flex-1 space-y-6 p-4 md:p-6 lg:p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Serviços</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Adicionar Serviço
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Adicionar Novo Serviço</DialogTitle>
              <DialogDescription>
                Preencha os dados abaixo para cadastrar um novo serviço.
              </DialogDescription>
            </DialogHeader>
            <AddServicoForm setDialogOpen={setIsDialogOpen} />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Serviços</CardTitle>
          <CardDescription>
            Gerencie os serviços prestados pela sua retífica.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ServicoTable servicos={servicos || []} />
          {error && (
            <div className="text-destructive text-center p-4">
              Ocorreu um erro ao carregar os serviços. Tente novamente.
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}

export default function ServicosPage() {
  return (
    <SidebarProvider>
      <Sidebar>
        <AppSidebar />
      </Sidebar>
      <SidebarInset>
        <AppHeader />
        <AuthenticatedPage>
          <ServicosContent />
        </AuthenticatedPage>
      </SidebarInset>
    </SidebarProvider>
  );
}
