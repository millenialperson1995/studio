'use client';

import { useState, useEffect } from 'react';
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
import { useCollection, useFirestore, useUser, errorEmitter, FirestorePermissionError } from '@/firebase';
import { useMemoFirebase } from '@/firebase/provider';
import { collection, query, where, onSnapshot, Unsubscribe } from 'firebase/firestore';
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
import { useRouter } from 'next/navigation';

function VeiculosContent() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const firestore = useFirestore();
  const { user } = useUser();
  const [vehicles, setVehicles] = useState<Veiculo[]>([]);
  const [isLoadingVehicles, setIsLoadingVehicles] = useState(true);

  const clientsCollectionRef = useMemoFirebase(
    () => (firestore && user?.uid ? query(collection(firestore, 'clientes'), where('userId', '==', user.uid)) : null),
    [firestore, user?.uid]
  );
  const { data: clients, isLoading: isLoadingClients } = useCollection<Cliente>(clientsCollectionRef);

  useEffect(() => {
    if (!firestore || !user?.uid) {
        setIsLoadingVehicles(false);
        return;
    };

    setIsLoadingVehicles(true);

    const clientQuery = query(collection(firestore, "clientes"), where("userId", "==", user.uid));
    
    // Main listener for the clients collection
    const unsubscribeClients = onSnapshot(clientQuery, (clientsSnapshot) => {
        const vehicleListeners: Unsubscribe[] = [];
        let allVehicles: { [key: string]: Veiculo } = {};

        if (clientsSnapshot.empty) {
            setVehicles([]);
            setIsLoadingVehicles(false);
            return;
        }

        // Keep track of how many sub-listeners have loaded
        let loadedCount = 0;

        clientsSnapshot.forEach((clientDoc) => {
            const vehiclesQuery = collection(firestore, 'clientes', clientDoc.id, 'veiculos');
            
            const unsubscribeVehicle = onSnapshot(vehiclesQuery, (vehiclesSnapshot) => {
                // Update the state with vehicles from this specific client
                vehiclesSnapshot.docChanges().forEach((change) => {
                    if (change.type === "removed") {
                        delete allVehicles[change.doc.id];
                    } else {
                        allVehicles[change.doc.id] = change.doc.data() as Veiculo;
                    }
                });

                setVehicles(Object.values(allVehicles));

            }, (error) => {
                console.error(`Error listening to vehicles for client ${clientDoc.id}:`, error);
                const contextualError = new FirestorePermissionError({
                    operation: 'list',
                    path: `clientes/${clientDoc.id}/veiculos`,
                });
                errorEmitter.emit('permission-error', contextualError);
            });

            vehicleListeners.push(unsubscribeVehicle);
        });

        // This ensures the loading state is only turned off after all initial reads are attempted.
        // The real-time updates will continue to flow in.
        setIsLoadingVehicles(false);


        // Return a cleanup function that unsubscribes from all vehicle listeners
        return () => {
            vehicleListeners.forEach(unsubscribe => unsubscribe());
        };
    }, (error) => {
        console.error("Error listening to clients collection: ", error);
        setIsLoadingVehicles(false);
    });

    // Cleanup function to unsubscribe from the main client listener
    return () => unsubscribeClients();

  }, [firestore, user?.uid]);
  
  const isLoading = isLoadingVehicles || isLoadingClients;

  if (isLoading) {
    return (
      <main className="flex-1 space-y-6 p-4 md:p-6 lg:p-8">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-10 w-40" />
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Lista de Veículos</CardTitle>
            <CardDescription>
              Gerencie os veículos da sua retífica.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
            </div>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="flex-1 space-y-6 p-4 md:p-6 lg:p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Veículos</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button disabled={isLoading || !clients || clients.length === 0}>
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
          <VehicleTable vehicles={vehicles || []} clients={clients || []} />
        </CardContent>
      </Card>
    </main>
  );
}

export default function VeiculosPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  if (isUserLoading || !user) {
    return (
      <SidebarProvider>
        <Sidebar><AppSidebar /></Sidebar>
        <SidebarInset>
          <AppHeader />
          <main className="flex-1 space-y-6 p-4 md:p-6 lg:p-8">
            <div className="flex items-center justify-between">
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-10 w-40" />
            </div>
            <Skeleton className="h-96 w-full" />
          </main>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <Sidebar>
        <AppSidebar />
      </Sidebar>
      <SidebarInset>
        <AppHeader />
        <VeiculosContent />
      </SidebarInset>
    </SidebarProvider>
  );
}
