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
import { toDate } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AddOrcamentoForm } from '@/components/orcamentos/add-orcamento-form';
import MobileLayout from '@/components/layout/mobile-layout';
import { Input } from '@/components/ui/input';

const ITEMS_PER_PAGE = 5;

function OrcamentosContent() {
  const searchParams = useSearchParams();
  const statusFilter = searchParams.get('status');

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
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

  const { data: orcamentos, isLoading: isLoadingOrcamentos } = useCollection<Orcamento>(orcamentosCollectionRef);
  const { data: clients, isLoading: isLoadingClients } = useCollection<Cliente>(clientesCollectionRef);
  const { data: servicos, isLoading: isLoadingServicos } = useCollection<Servico>(servicosCollectionRef);
  const { data: pecas, isLoading: isLoadingPecas } = useCollection<Peca>(pecasCollectionRef);

  const filteredAndSortedOrcamentos = useMemo(() => {
    if (!orcamentos || !clients || !vehicles) return [];
    const lowercasedSearchTerm = searchTerm.toLowerCase();
    const statusFiltered = statusFilter ? orcamentos.filter(o => o.status === statusFilter) : orcamentos;
    const searchFiltered = lowercasedSearchTerm
      ? statusFiltered.filter(o => {
          const client = clients.find(c => c.id === o.clienteId);
          const vehicle = vehicles.find(v => v.id === o.veiculoId);

          const status = o.status || '';
          const clientName = (client && client.nome) || '';
          const vehiclePlate = (vehicle && vehicle.placa) || '';

          return (
            status.toLowerCase().includes(lowercasedSearchTerm) ||
            clientName.toLowerCase().includes(lowercasedSearchTerm) ||
            vehiclePlate.toLowerCase().includes(lowercasedSearchTerm)
          );
        })
      : statusFiltered;
    return [...searchFiltered].sort((a, b) => toDate(b.dataCriacao).getTime() - toDate(a.dataCriacao).getTime());
  }, [orcamentos, clients, vehicles, statusFilter, searchTerm]);

  const totalPages = Math.ceil((filteredAndSortedOrcamentos?.length || 0) / ITEMS_PER_PAGE);
  const paginatedOrcamentos = filteredAndSortedOrcamentos.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  const isLoading = isLoadingOrcamentos || isLoadingClients || isLoadingVehicles || isLoadingServicos || isLoadingPecas;
  const canCreate = !isLoading && clients && clients.length > 0 && vehicles && vehicles.length > 0;
  const buttonTooltip = !clients || clients.length === 0 ? 'Cadastre um cliente primeiro.' : !vehicles || vehicles.length === 0 ? 'Cadastre um veículo primeiro.' : 'Criar novo orçamento';

  if (isLoading) {
    return null;
  }

  return (
    <MobileLayout>
      <main className="flex-1 space-y-6 p-4 md:p-6 lg:p-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Orçamentos</h1>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span tabIndex={canCreate ? -1 : 0}>
                    <Button disabled={!canCreate} onClick={() => canCreate && setIsAddDialogOpen(true)}>
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Novo Orçamento
                    </Button>
                  </span>
                </TooltipTrigger>
                {!canCreate && <TooltipContent>{buttonTooltip}</TooltipContent>}
              </Tooltip>
            </TooltipProvider>
            <DialogContent className="sm:max-w-4xl">
              <DialogHeader>
                <DialogTitle>Criar Novo Orçamento</DialogTitle>
                <DialogDescription>Preencha os detalhes para criar um novo orçamento.</DialogDescription>
              </DialogHeader>
              <AddOrcamentoForm clients={clients || []} vehicles={vehicles || []} servicos={servicos || []} pecas={pecas || []} setDialogOpen={setIsAddDialogOpen} />
            </DialogContent>
          </Dialog>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Lista de Orçamentos</CardTitle>
            <CardDescription>{statusFilter ? `Mostrando orçamentos com status "${statusFilter}".` : 'Gerencie os orçamentos da sua retífica.'}</CardDescription>
            <div className="pt-4">
              <Input placeholder="Buscar por cliente, placa ou status..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full" />
            </div>
          </CardHeader>
          <CardContent>
            <OrcamentoTable orcamentos={paginatedOrcamentos || []} clients={clients || []} vehicles={vehicles || []} servicos={servicos || []} pecas={pecas || []} />
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

export default function OrcamentosPage() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <OrcamentosContent />
    </Suspense>
  );
}
