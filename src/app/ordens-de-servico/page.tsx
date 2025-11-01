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
import { collection, collectionGroup, query, where } from 'firebase/firestore';
import type { OrdemServico, Cliente, Veiculo, Peca, Servico } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import OrdemServicoTable from '@/components/ordens-de-servico/ordem-servico-table';
import { AddOrdemServicoForm } from '@/components/ordens-de-servico/add-ordem-servico-form';

export default function OrdensDeServicoPage() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const firestore = useFirestore();
  const { user } = useUser();

  // Queries for current user
  const ordensServicoQuery = useMemoFirebase(
    () => (firestore && user?.uid ? query(collection(firestore, 'ordensServico'), where('userId', '==', user.uid)) : null),
    [firestore, user?.uid]
  );
  const clientesCollectionRef = useMemoFirebase(
    () => (firestore && user?.uid ? query(collection(firestore, 'clientes'), where('userId', '==', user.uid)) : null),
    [firestore, user?.uid]
  );
  const veiculosQuery = useMemoFirebase(
    () => (firestore && user?.uid ? query(collectionGroup(firestore, 'veiculos'), where('userId', '==', user.uid)) : null),
    [firestore, user?.uid]
  );
  const servicosCollectionRef = useMemoFirebase(
    () => (firestore && user?.uid ? query(collection(firestore, 'servicos'), where('userId', '==', user.uid)) : null),
    [firestore, user?.uid]
  );
  const pecasCollectionRef = useMemoFirebase(
    () => (firestore && user?.uid ? query(collection(firestore, 'pecas'), where('userId', '==', user.uid)) : null),
    [firestore, user?.uid]
  );


  // Data fetching
  const { data: ordensServico, isLoading: isLoadingOrdens } =
    useCollection<OrdemServico>(ordensServicoQuery);
  const { data: clients, isLoading: isLoadingClients } =
    useCollection<Cliente>(clientesCollectionRef);
  const { data: vehicles, isLoading: isLoadingVehicles } =
    useCollection<Veiculo>(veiculosQuery);
   const { data: servicos, isLoading: isLoadingServicos } =
    useCollection<Servico>(servicosCollectionRef);
  const { data: pecas, isLoading: isLoadingPecas } =
    useCollection<Peca>(pecasCollectionRef);

  const isLoading = isLoadingOrdens || isLoadingClients || isLoadingVehicles || isLoadingServicos || isLoadingPecas;

  return (
    <SidebarProvider>
      <Sidebar>
        <AppSidebar />
      </Sidebar>
      <SidebarInset>
        <AppHeader />
        <main className="flex-1 space-y-6 p-4 md:p-6 lg:p-8">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold">Ordens de Serviço</h1>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Nova Ordem de Serviço
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-4xl">
                <DialogHeader>
                  <DialogTitle>Criar Nova Ordem de Serviço</DialogTitle>
                  <DialogDescription>
                    Preencha os detalhes para criar uma nova ordem de serviço.
                  </DialogDescription>
                </DialogHeader>
                <AddOrdemServicoForm
                  clients={clients || []}
                  vehicles={vehicles || []}
                  pecas={pecas || []}
                  servicos={servicos || []}
                  setDialogOpen={setIsAddDialogOpen}
                />
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Lista de Ordens de Serviço</CardTitle>
              <CardDescription>
                Gerencie as ordens de serviço da sua retífica.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading && (
                <div className="space-y-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              )}
              {!isLoading && (
                <OrdemServicoTable
                  ordensServico={ordensServico || []}
                  clients={clients || []}
                  vehicles={vehicles || []}
                  pecas={pecas || []}
                  servicos={servicos || []}
                />
              )}
            </CardContent>
          </Card>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
