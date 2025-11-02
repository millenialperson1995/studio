'use client';

import { useEffect, useMemo } from 'react';
import AppHeader from '@/components/layout/app-header';
import AppSidebar from '@/components/layout/app-sidebar';
import {
  Sidebar,
  SidebarInset,
  SidebarProvider,
} from '@/components/ui/sidebar';
import { useCollection, useFirestore, useUser } from '@/firebase';
import { useMemoFirebase } from '@/firebase/provider';
import { collection, query, where } from 'firebase/firestore';
import type { OrdemServico } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';
import FaturamentoAnualCard from '@/components/relatorios/faturamento-anual-card';

function RelatoriosContent() {
  const firestore = useFirestore();
  const { user } = useUser();

  const ordensQuery = useMemoFirebase(
    () => (firestore && user?.uid ? query(collection(firestore, 'ordensServico'), where('userId', '==', user.uid), where('status', '==', 'concluida')) : null),
    [firestore, user?.uid]
  );
  
  const { data: ordensServico, isLoading: isLoadingOrdens } = useCollection<OrdemServico>(ordensQuery);

  const toDate = (timestamp: any): Date => {
      if (!timestamp) return new Date(0);
      if (timestamp.toDate) return timestamp.toDate();
      if (timestamp instanceof Date) return timestamp;
      if (typeof timestamp === 'string' || typeof timestamp === 'number') {
        const d = new Date(timestamp);
        if (!isNaN(d.getTime())) return d;
      }
      return new Date(0);
  }

  const revenueData = useMemo(() => {
    if (!ordensServico) return [];

    const now = new Date();
    const monthlyRevenue: { [key: string]: number } = {};
    const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

    // Initialize last 12 months
    for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthKey = `${monthNames[d.getMonth()]}/${d.getFullYear().toString().slice(-2)}`;
        monthlyRevenue[monthKey] = 0;
    }

    ordensServico.forEach(os => {
        if (os.status === 'concluida' && os.dataConclusao) {
            const conclusionDate = toDate(os.dataConclusao);
            const monthDiff = (now.getFullYear() - conclusionDate.getFullYear()) * 12 + (now.getMonth() - conclusionDate.getMonth());
            if (monthDiff >= 0 && monthDiff < 12) {
                 const monthKey = `${monthNames[conclusionDate.getMonth()]}/${conclusionDate.getFullYear().toString().slice(-2)}`;
                 monthlyRevenue[monthKey] += os.valorTotal;
            }
        }
    });

    return Object.keys(monthlyRevenue).map(month => ({
        month,
        revenue: monthlyRevenue[month],
    }));
  }, [ordensServico]);


  if (isLoadingOrdens) {
    return (
      <main className="flex-1 space-y-6 p-4 md:p-6 lg:p-8">
        <h1 className="text-2xl font-semibold">Relatórios</h1>
        <div className="grid grid-cols-1 gap-6">
          <Skeleton className="h-[400px] w-full" />
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 space-y-6 p-4 md:p-6 lg:p-8">
      <h1 className="text-2xl font-semibold">Relatórios</h1>
      <div className="grid grid-cols-1 gap-6">
        <FaturamentoAnualCard data={revenueData} />
      </div>
    </main>
  );
}

export default function RelatoriosPage() {
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
            <Skeleton className="h-8 w-32 mb-6" />
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
        <RelatoriosContent />
      </SidebarInset>
    </SidebarProvider>
  );
}
