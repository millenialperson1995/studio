'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import ClientTable from '@/components/clientes/client-table';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card';
import { useCollection, useFirestore, useUser } from '@/firebase';
import { useMemoFirebase } from '@/firebase/provider';
import { collection, query, where, orderBy } from 'firebase/firestore';
import type { Cliente } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog';
import { AddClientForm } from '@/components/clientes/add-client-form';
import MobileLayout from '@/components/layout/mobile-layout';

const ITEMS_PER_PAGE = 5;

function ClientesContent() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const firestore = useFirestore();
  const { user } = useUser();

  const clientesCollectionRef = useMemoFirebase(
    () => (firestore && user?.uid ? query(collection(firestore, 'clientes'), where('userId', '==', user.uid), orderBy('createdAt', 'desc')) : null),
    [firestore, user?.uid]
  );

  const {
    data: clients,
    isLoading,
    error,
  } = useCollection<Cliente>(clientesCollectionRef);

  const totalPages = Math.ceil((clients?.length || 0) / ITEMS_PER_PAGE);
  const paginatedClients = clients?.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  ) || [];

  if (isLoading) {
     return null; // Skeleton handled by AuthenticatedPage
  }

  return (
    <main className="flex-1 space-y-6 p-4 md:p-6 lg:p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Clientes</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Adicionar Cliente
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Adicionar Novo Cliente</DialogTitle>
              <DialogDescription>
                Preencha os dados abaixo para cadastrar um novo cliente.
              </DialogDescription>
            </DialogHeader>
            <AddClientForm setDialogOpen={setIsDialogOpen} />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Clientes</CardTitle>
          <CardDescription>
            Gerencie os clientes da sua retífica.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ClientTable clients={paginatedClients} />
          {error && (
            <div className="text-destructive text-center p-4">
              Ocorreu um erro ao carregar os clientes. Tente novamente mais tarde.
            </div>
          )}
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

export default function ClientesPage() {
  return (
    <MobileLayout>
      <ClientesContent />
    </MobileLayout>
  );
}
