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
import type { Cliente, Veiculo } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog';
import { AddVehicleForm } from '@/components/veiculos/add-vehicle-form';
import VehicleTable from '@/components/veiculos/vehicle-table';
import { Skeleton } from '@/components/ui/skeleton';

export default function VeiculosPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const firestore = useFirestore();
  const { user } = useUser();

  // Query to get all vehicles from all clients of the current user
  const vehiclesQuery = useMemoFirebase(
    () => (firestore && user ? query(collectionGroup(firestore, 'veiculos'), where('userId', '==', user.uid)) : null),
    [firestore, user]
  );
  const { data: vehicles, isLoading: isLoadingVehicles } = useCollection<Veiculo>(vehiclesQuery);

  // Query to get all clients of the current user (for the select dropdown in the form)
  const clientsCollectionRef = useMemoFirebase(
    () => (firestore && user ? query(collection(firestore, 'clientes'), where('userId', '==', user.uid)) : null),
    [firestore, user]
  );
  const { data: clients, isLoading: isLoadingClients } = useCollection<Cliente>(clientsCollectionRef);
  
  const isLoading = isLoadingVehicles || isLoadingClients;

  return (
    <SidebarProvider>
      <Sidebar>
        <AppSidebar />
      </Sidebar>
      <SidebarInset>
        <AppHeader />
        <main className="flex-1 space-y-6 p-4 md:p-6 lg:p-8">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold">Veículos</h1>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button disabled={!clients || clients.length === 0}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Adicionar Veículo
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Adicionar Novo Veículo</DialogTitle>
                  <DialogDescription>
                    Preencha os dados abaixo para cadastrar um novo veículo.
                  </DialogDescription>
                </DialogHeader>
                <AddVehicleForm
                  clients={clients || []}
                  setDialogOpen={setIsDialogOpen}
                />
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Lista de Veículos</CardTitle>
              <CardDescription>
                Gerencie os veículos da sua retífica.
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
              {!isLoading && <VehicleTable vehicles={vehicles || []} clients={clients || []} />}
            </CardContent>
          </Card>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
