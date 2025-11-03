'use client';

import { useState, useMemo } from 'react';
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
  CardFooter,
} from '@/components/ui/card';
import { useCollection, useFirestore, useUser, useVehicles } from '@/firebase';
import { useMemoFirebase } from '@/firebase/provider';
import { collection, query, where, orderBy } from 'firebase/firestore';
import type { Orcamento, Cliente, Servico, Peca } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog';
import OrcamentoTable from '@/components/orcamentos/orcamento-table';
import { AddOrcamentoForm } from '@/components/orcamentos/add-orcamento-form';
import AuthenticatedPage from '@/components/layout/authenticated-page';
import { toDate } from '@/lib/utils';

const ITEMS_PER_PAGE = 5;

function OrcamentosContent() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const firestore = useFirestore();
  const { user } = useUser();
  const { vehicles, isLoading: isLoadingVehicles } = useVehicles();

  const orcamentosCollectionRef = useMemoFirebase(
    () => (firestore && user?.uid ? query(collection(firestore, 'orcamentos'), where('userId', '==', user.uid)) : null),
    [firestore, user?.uid]
  );
  const clientesCollectionRef = useMemoFirebase(
    () => (firestore && user?.uid ? query(collection(firestore, 'clientes'), where('userId', '==', user.uid)) : null),
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

  const { data: orcamentos, isLoading: isLoadingOrcamentos } =
    useCollection<Orcamento>(orcamentosCollectionRef);
  const { data: clients, isLoading: isLoadingClients } =
    useCollection<Cliente>(clientesCollectionRef);
  const { data: servicos, isLoading: isLoadingServicos } =
    useCollection<Servico>(servicosCollectionRef);
  const { data: pecas, isLoading: isLoadingPecas } =
    useCollection<Peca>(pecasCollectionRef);

  const sortedOrcamentos = useMemo(() => {
    if (!orcamentos) return [];
    return [...orcamentos].sort((a, b) => toDate(b.createdAt).getTime() - toDate(a.createdAt).getTime());
  }, [orcamentos]);
  
  const totalPages = Math.ceil((sortedOrcamentos?.length || 0) / ITEMS_PER_PAGE);
  const paginatedOrcamentos = sortedOrcamentos.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const isLoading = isLoadingOrcamentos || isLoadingClients || isLoadingVehicles || isLoadingServicos || isLoadingPecas;

  if (isLoading) {
    return null; // Skeleton handled by AuthenticatedPage
  }

  return (
    <main className="flex-1 space-y-6 p-4 md:p-6 lg:p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Orçamentos</h1>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button disabled={isLoading}>
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
          <OrcamentoTable
            orcamentos={paginatedOrcamentos || []}
            clients={clients || []}
            servicos={servicos || []}
            pecas={pecas || []}
          />
        </CardContent>
        {totalPages > 1 && (
            <CardFooter>
                <div className="flex w-full items-center justify-between text-xs text-muted-foreground">
                    <div>
                        Página {currentPage} de {totalPages}
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                        >
                            Anterior
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                        >
                            Próxima
                        </Button>
                    </div>
                </div>
            </CardFooter>
        )}
      </Card>
    </main>
  );
}

export default function OrcamentosPage() {
  return (
    <SidebarProvider>
      <Sidebar>
        <AppSidebar />
      </Sidebar>
      <SidebarInset>
        <AppHeader />
        <AuthenticatedPage>
          <OrcamentosContent />
        </AuthenticatedPage>
      </SidebarInset>
    </SidebarProvider>
  );
}
