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
import ClientTable from '@/components/clientes/client-table';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
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
import { Skeleton } from '@/components/ui/skeleton';

export default function ClientesPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const firestore = useFirestore();
  const clientesCollectionRef = useMemoFirebase(
    () => collection(firestore, 'clientes'),
    [firestore]
  );
  const {
    data: clients,
    isLoading,
    error,
  } = useCollection<Cliente>(clientesCollectionRef);

  return (
    <SidebarProvider>
      <Sidebar>
        <AppSidebar />
      </Sidebar>
      <SidebarInset>
        <AppHeader />
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
              <DialogContent className="sm:max-w-[425px]">
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
              {isLoading && (
                <div className="space-y-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              )}
              {!isLoading && <ClientTable clients={clients || []} />}
              {error && (
                <div className="text-destructive text-center p-4">
                  Ocorreu um erro ao carregar os clientes.
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
