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
import { collection, collectionGroup, query, where, getDocs } from 'firebase/firestore';
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
import { useRouter } from 'next/navigation';

function OrcamentosContent() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const [vehicles, setVehicles] = useState<Veiculo[]>([]);
  const [isLoadingVehicles, setIsLoadingVehicles] = useState(true);

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

  useEffect(() => {
    if (isUserLoading || !firestore || !user?.uid) return;

    setIsLoadingVehicles(true);
    const fetchVehicles = async () => {
        try {
            const q = query(collectionGroup(firestore, 'veiculos'), where('userId', '==', user.uid));
            const querySnapshot = await getDocs(q);
            const allVehicles: Veiculo[] = [];
            querySnapshot.forEach((doc) => {
                allVehicles.push(doc.data() as Veiculo);
            });
            setVehicles(allVehicles);
        } catch (error) {
            console.error("Error fetching vehicles for orcamentos: ", error);
        } finally {
            setIsLoadingVehicles(false);
        }
    };
    fetchVehicles();
  }, [firestore, user?.uid, isUserLoading]);


  const { data: orcamentos, isLoading: isLoadingOrcamentos } =
    useCollection<Orcamento>(orcamentosCollectionRef);
  const { data: clients, isLoading: isLoadingClients } =
    useCollection<Cliente>(clientesCollectionRef);
  const { data: servicos, isLoading: isLoadingServicos } =
    useCollection<Servico>(servicosCollectionRef);
  const { data: pecas, isLoading: isLoadingPecas } =
    useCollection<Peca>(pecasCollectionRef);

  const isLoading = isLoadingOrcamentos || isLoadingClients || isLoadingVehicles || isLoadingServicos || isLoadingPecas;

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
  );
}

export default function OrcamentosPage() {
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
        <OrcamentosContent />
      </SidebarInset>
    </SidebarProvider>
  );
}
