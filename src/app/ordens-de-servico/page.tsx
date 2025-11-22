'use client';

import { useState, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
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
import { toDate } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import MobileLayout from '@/components/layout/mobile-layout';
import { Input } from '@/components/ui/input';

const ITEMS_PER_PAGE = 5;

function OrdensDeServicoContent() {
  const searchParams = useSearchParams();
  const statusFilter = searchParams.get('status');

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const firestore = useFirestore();
  const { user } = useUser();
  const { vehicles, isLoading: isLoadingVehicles } = useVehicles();

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

  const { data: ordensServico, isLoading: isLoadingOrdens } = useCollection<OrdemServico>(ordensServicoQuery);
  const { data: clients, isLoading: isLoadingClients } = useCollection<Cliente>(clientesCollectionRef);
  const { data: servicos, isLoading: isLoadingServicos } = useCollection<Servico>(servicosCollectionRef);
  const { data: pecas, isLoading: isLoadingPecas } = useCollection<Peca>(pecasCollectionRef);

  const filteredAndSortedOrdens = useMemo(() => {
    if (!ordensServico || !clients || !vehicles) return [];
    const lowercasedSearchTerm = searchTerm.toLowerCase();
    const statusFiltered = statusFilter ? ordensServico.filter(os => os.status === statusFilter) : ordensServico;

    const searchFiltered = lowercasedSearchTerm
      ? statusFiltered.filter(os => {
          const client = clients.find(c => c.id === os.clienteId);
          const vehicle = vehicles.find(v => v.id === os.veiculoId);

          const status = os.status || '';
          const clientName = (client && client.nome) || '';
          const vehiclePlate = (vehicle && vehicle.placa) || '';

          return (
            status.toLowerCase().includes(lowercasedSearchTerm) ||
            clientName.toLowerCase().includes(lowercasedSearchTerm) ||
            vehiclePlate.toLowerCase().includes(lowercasedSearchTerm)
          );
        })
      : statusFiltered;

    return [...searchFiltered].sort((a, b) => toDate(b.dataEntrada).getTime() - toDate(a.dataEntrada).getTime());
  }, [ordensServico, clients, vehicles, statusFilter, searchTerm]);

  const totalPages = Math.ceil((filteredAndSortedOrdens?.length || 0) / ITEMS_PER_PAGE);
  const paginatedOrdensServico = filteredAndSortedOrdens.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  const isLoading = isLoadingOrdens || isLoadingClients || isLoadingVehicles || isLoadingServicos || isLoadingPecas;
  const canCreate = !isLoading && clients && clients.length > 0 && vehicles && vehicles.length > 0;
  const buttonTooltip = !clients || clients.length === 0 ? 'Cadastre um cliente primeiro.' : !vehicles || vehicles.length === 0 ? 'Cadastre um veículo primeiro.' : 'Criar nova ordem de serviço';

  if (isLoading) {
    return null;
  }

  return (
    <MobileLayout>
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
                <DialogDescription>Preencha os detalhes para criar uma nova ordem de serviço.</DialogDescription>
              </DialogHeader>
              <AddOrdemServicoForm clients={clients || []} vehicles={vehicles || []} pecas={pecas || []} servicos={servicos || []} setDialogOpen={setIsAddDialogOpen} />
            </DialogContent>
          </Dialog>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Lista de Ordens de Serviço</CardTitle>
            <CardDescription>{statusFilter ? `Mostrando ordens com status "${statusFilter}".` : 'Gerencie as ordens de serviço da sua retífica.'}</CardDescription>
            <div className="pt-4">
              <Input placeholder="Buscar por cliente, placa ou status..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full" />
            </div>
          </CardHeader>
          <CardContent>
            <OrdemServicoTable ordensServico={paginatedOrdensServico || []} clients={clients || []} vehicles={vehicles || []} pecas={pecas || []} servicos={servicos || []} />
          </CardContent>
          {totalPages > 1 && (
            <CardFooter>
              <div className="flex w-full items-center justify-between text-xs text-muted-foreground">
                <div>Página {currentPage} de {totalPages}</div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1}>Anterior</Button>
                  <Button variant="outline" size="sm" onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages}>Próxima</Button>
                </div>
              </div>
            </CardFooter>
          )}
        </Card>
      </main>
    </MobileLayout>
  );
}

export default function OrdensDeServicoPage() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <OrdensDeServicoContent />
    </Suspense>
  );
}
