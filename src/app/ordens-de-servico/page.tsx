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
import { collection, query, where } from 'firebase/firestore';
import type { OrdemServico, Cliente, Peca, Servico } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog';
import OrdemServicoTable from '@/components/ordens-de-servico/ordem-servico-table';
import { AddOrdemServicoForm } from '@/components/ordens-de-servico/add-ordem-servico-form';
import AuthenticatedPage from '@/components/layout/authenticated-page';
import { toDate } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const ITEMS_PER_PAGE = 5;

function OrdensDeServicoContent() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const firestore = useFirestore();
  const { user } = useUser();
  const { vehicles, isLoading: isLoadingVehicles } = useVehicles();

  // Queries for current user
  const ordensServicoQuery = useMemoFirebase(
    () => (firestore && user?.uid ? query(collection(firestore, 'ordensServico'), where('userId', '==', user.uid)) : null),
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

  // Data fetching
  const { data: ordensServico, isLoading: isLoadingOrdens } =
    useCollection<OrdemServico>(ordensServicoQuery);
  const { data: clients, isLoading: isLoadingClients } =
    useCollection<Cliente>(clientesCollectionRef);
   const { data: servicos, isLoading: isLoadingServicos } =
    useCollection<Servico>(servicosCollectionRef);
  const { data: pecas, isLoading: isLoadingPecas } =
    useCollection<Peca>(pecasCollectionRef);
    
  const sortedOrdensServico = useMemo(() => {
    if (!ordensServico) return [];
    return [...ordensServico].sort((a, b) => toDate(b.dataEntrada).getTime() - toDate(a.dataEntrada).getTime());
  }, [ordensServico]);

  const totalPages = Math.ceil((sortedOrdensServico?.length || 0) / ITEMS_PER_PAGE);
  const paginatedOrdensServico = sortedOrdensServico.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const isLoading = isLoadingOrdens || isLoadingClients || isLoadingVehicles || isLoadingServicos || isLoadingPecas;

  const canCreate = !isLoading && clients && clients.length > 0 && vehicles && vehicles.length > 0;
  const buttonTooltip = (!clients || clients.length === 0) 
    ? 'Cadastre um cliente primeiro.' 
    : (!vehicles || vehicles.length === 0) 
    ? 'Cadastre um veículo primeiro.' 
    : 'Criar nova ordem de serviço';


  if (isLoading) {
    return null; // Skeleton handled by AuthenticatedPage
  }

  return (
    <main className="flex-1 space-y-6 p-4 md:p-6 lg:p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Ordens de Serviço</h1>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <TooltipProvider>
              <Tooltip>
                  <TooltipTrigger asChild>
                      <span tabIndex={canCreate ? -1 : 0}>
                          <Button disabled={!canCreate} onClick={() => canCreate && setIsAddDialogOpen(true)}>
                              <PlusCircle className="mr-2 h-4 w-4" />
                              Nova Ordem de Serviço
                          </Button>
                      </span>
                  </TooltipTrigger>
                  {!canCreate && <TooltipContent>{buttonTooltip}</TooltipContent>}
              </Tooltip>
          </TooltipProvider>

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
          <OrdemServicoTable
            ordensServico={paginatedOrdensServico || []}
            clients={clients || []}
            pecas={pecas || []}
            servicos={servicos || []}
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

export default function OrdensDeServicoPage() {
  return (
    <SidebarProvider>
      <Sidebar>
        <AppSidebar />
      </Sidebar>
      <SidebarInset>
        <AppHeader />
        <AuthenticatedPage>
          <OrdensDeServicoContent />
        </AuthenticatedPage>
      </SidebarInset>
    </SidebarProvider>
  );
}
