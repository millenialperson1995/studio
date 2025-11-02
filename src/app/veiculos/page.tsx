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
import { useCollection, useFirestore, useUser } from '@/firebase';
import { useMemoFirebase } from '@/firebase/provider';
import { collection, collectionGroup, query, where, getDocs, Query } from 'firebase/firestore';
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
  const { user, isUserLoading } = useUser();
  const [vehicles, setVehicles] = useState<Veiculo[]>([]);
  const [isLoadingVehicles, setIsLoadingVehicles] = useState(true);

  const clientsCollectionRef = useMemoFirebase(
    () => (firestore && user?.uid ? query(collection(firestore, 'clientes'), where('userId', '==', user.uid)) : null),
    [firestore, user?.uid]
  );
  const { data: clients, isLoading: isLoadingClients } = useCollection<Cliente>(clientsCollectionRef);

  useEffect(() => {
    if (isUserLoading || !firestore || !user?.uid) {
        // Wait for user to be loaded
        return;
    }

    setIsLoadingVehicles(true);

    const fetchVehicles = async () => {
        try {
            const allVehicles: Veiculo[] = [];
            // This query is now safe because it will only run when firestore and user.uid are available
            const q = query(collectionGroup(firestore, 'veiculos'), where('userId', '==', user.uid));
            const querySnapshot = await getDocs(q);
            querySnapshot.forEach((doc) => {
                allVehicles.push(doc.data() as Veiculo);
            });
            setVehicles(allVehicles);
        } catch (error) {
            console.error("Error fetching vehicles: ", error);
        } finally {
            setIsLoadingVehicles(false);
        }
    };

    fetchVehicles();
  }, [firestore, user?.uid, isUserLoading]);
  
  const isLoading = isLoadingVehicles || isLoadingClients;

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
