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
import type { Orcamento, Cliente, Veiculo, Servico, Peca } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import OrcamentoTable from '@/components/orcamentos/orcamento-table';
import { AddOrcamentoForm } from '@/components/orcamentos/add-orcamento-form';

export default function OrcamentosPage() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const firestore = useFirestore();
  const { user } = useUser();

  // Queries for the current user
  const orcamentosCollectionRef = useMemoFirebase(
    () => (firestore && user ? query(collection(firestore, 'orcamentos'), where('userId', '==', user.uid)) : null),
    [firestore, user]
  );
  const clientesCollectionRef = useMemoFirebase(
    () => (firestore && user ? query(collection(firestore, 'clientes'), where('userId', '==', user.uid)) : null),
    [firestore, user]
  );
  const veiculosQuery = useMemoFirebase(
    () => (firestore && user ? query(collectionGroup(firestore, 'veiculos'), where('userId', '==', user.uid)) : null),
    [firestore, user]
  );
  const servicosCollectionRef = useMemoFirebase(
    () => (firestore && user ? query(collection(firestore, 'servicos'), where('userId', '==', user.uid)) : null),
    [firestore, user]
  );
  const pecasCollectionRef = useMemoFirebase(
    () => (firestore && user ? query(collection(firestore, 'pecas'), where('userId', '==', user.uid)) : null),
    [firestore, user]
  );


  // Data fetching
  const { data: orcamentos, isLoading: isLoadingOrcamentos } =
    useCollection<Orcamento>(orcamentosCollectionRef);
  const { data: clients, isLoading: isLoadingClients } =
    useCollection<Cliente>(clientesCollectionRef);
  const { data: vehicles, isLoading: isLoadingVehicles } =
    useCollection<Veiculo>(veiculosQuery);
  const { data: servicos, isLoading: isLoadingServicos } =
    useCollection<Servico>(servicosCollectionRef);
  const { data: pecas, isLoading: isLoadingPecas } =
    useCollection<Peca>(pecasCollectionRef);

  const isLoading = isLoadingOrcamentos || isLoadingClients || isLoadingVehicles || isLoadingServicos || isLoadingPecas;

  return (
    <SidebarProvider>
      <Sidebar>
        <AppSidebar />
      </Sidebar>
      <SidebarInset>
        <AppHeader />
        <main className="flex-1 space-y-6 p-4 md:p-6 lg:p-8">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold">Orçamentos</h1>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Novo Orçamento
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-4xl">
                <DialogHeader>
                  <DialogTitle>Criar Novo Orçamento</DialogTitle>
                  <DialogDescription>
                    Preencha os detalhes para criar um novo orçamento.
                  </DialogDescription>
                </DialogHeader>
                <AddOrcamentoForm
                  clients={clients || []}
                  vehicles={vehicles || []}
                  servicos={servicos || []}
                  pecas={pecas || []}
                  setDialogOpen={setIsAddDialogOpen}
                />
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Lista de Orçamentos</CardTitle>
              <CardDescription>
                Gerencie os orçamentos da sua retífica.
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
                <OrcamentoTable
                  orcamentos={orcamentos || []}
                  clients={clients || []}
                  vehicles={vehicles || []}
                  servicos={servicos || []}
                  pecas={pecas || []}
                />
              )}
            </CardContent>
          </Card>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
