'use client';
import { useMemo } from 'react';
import AppHeader from '@/components/layout/app-header';
import AppSidebar from '@/components/layout/app-sidebar';
import { Sidebar, SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import StatCard from '@/components/dashboard/stat-card';
import {
  Car,
  CircleDollarSign,
  Clock,
  FileText,
  Users,
  Wrench,
} from 'lucide-react';
import RevenueChartCard from '@/components/dashboard/revenue-chart-card';
import RecentActivityCard from '@/components/dashboard/recent-activity-card';
import { useCollection, useFirestore, useUser } from '@/firebase';
import { collection, query, where, Timestamp, collectionGroup } from 'firebase/firestore';
import { useMemoFirebase } from '@/firebase/provider';
import type { Cliente, OrdemServico, Orcamento, Veiculo } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Home() {
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  // --- Data Fetching ---
  const clientesRef = useMemoFirebase(
    () => (firestore && user ? collection(firestore, 'clientes') : null),
    [firestore, user]
  );
  const orcamentosRef = useMemoFirebase(
    () => (firestore && user ? collection(firestore, 'orcamentos') : null),
    [firestore, user]
  );
  const ordensQuery = useMemoFirebase(
    () => (firestore && user ? query(collectionGroup(firestore, 'ordensServico')) : null),
    [firestore, user]
  );
   const veiculosQuery = useMemoFirebase(
    () => (firestore && user ? query(collectionGroup(firestore, 'veiculos')) : null),
    [firestore, user]
  );

  const { data: clientes, isLoading: isLoadingClientes } = useCollection<Cliente>(clientesRef);
  const { data: orcamentos, isLoading: isLoadingOrcamentos } = useCollection<Orcamento>(orcamentosRef);
  const { data: ordensServico, isLoading: isLoadingOrdens } = useCollection<OrdemServico>(ordensQuery);
  const { data: veiculos, isLoading: isLoadingVeiculos } = useCollection<Veiculo>(veiculosQuery);

  const isLoading = isUserLoading || isLoadingClientes || isLoadingOrcamentos || isLoadingOrdens || isLoadingVeiculos;

  const toDate = (timestamp: any): Date => {
      if (!timestamp) return new Date(0); // return an old date if timestamp is null/undefined
      if (timestamp.toDate) return timestamp.toDate();
      // Handle cases where it might already be a Date object or a string
      if (timestamp instanceof Date) return timestamp;
      return new Date(timestamp);
  }

  // --- Data Processing & Calculations ---
  const dashboardStats = useMemo(() => {
    if (isLoading || !clientes || !orcamentos || !ordensServico || !veiculos) {
      return {
        receitaMensal: 0,
        ordensAndamento: 0,
        ordensConcluidasMes: 0,
        orcamentosPendentes: 0,
        totalClientes: 0,
        novosClientesMes: 0,
        revenueData: [],
        pendingQuotes: [],
        recentOrders: [],
      };
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Stat Cards
    const ordensConcluidasMes = ordensServico.filter(os => 
      os.status === 'concluida' && 
      os.dataConclusao && 
      toDate(os.dataConclusao) >= startOfMonth
    );

    const receitaMensal = ordensConcluidasMes.reduce((acc, os) => acc + os.valorTotal, 0);
    const ordensAndamento = ordensServico.filter(os => os.status === 'andamento').length;
    const orcamentosPendentes = orcamentos.filter(o => o.status === 'pendente').length;
    const totalClientes = clientes.length;
    const novosClientesMes = clientes.filter(c => 
        c.createdAt && toDate(c.createdAt) >= startOfMonth
    ).length;

    // Revenue Chart (Last 3 months)
    const monthlyRevenue: { [key: string]: number } = {};
    const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    
    for (let i = 2; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthKey = `${monthNames[d.getMonth()]}`;
        monthlyRevenue[monthKey] = 0;
    }

    ordensServico.forEach(os => {
        if (os.status === 'concluida' && os.dataConclusao) {
            const conclusionDate = toDate(os.dataConclusao);
            const monthDiff = (now.getFullYear() - conclusionDate.getFullYear()) * 12 + (now.getMonth() - conclusionDate.getMonth());
            if (monthDiff >= 0 && monthDiff < 3) {
                 const monthKey = `${monthNames[conclusionDate.getMonth()]}`;
                 monthlyRevenue[monthKey] += os.valorTotal;
            }
        }
    });

    const revenueData = Object.keys(monthlyRevenue).map(month => ({
        month,
        revenue: monthlyRevenue[month],
    }));

    // Recent Activity Lists
    const clientsMap = new Map(clientes.map(c => [c.id, c]));
    const vehiclesMap = new Map(veiculos.map(v => [v.id, v]));

    const pendingQuotes = orcamentos
        .filter(o => o.status === 'pendente')
        .sort((a, b) => toDate(b.dataCriacao).getTime() - toDate(a.dataCriacao).getTime())
        .map(o => ({
            ...o,
            cliente: clientsMap.get(o.clienteId),
            veiculo: vehiclesMap.get(o.veiculoId),
        }))
        .slice(0, 5);

    const recentOrders = ordensServico
        .sort((a, b) => toDate(b.dataEntrada).getTime() - toDate(a.dataEntrada).getTime())
        .map(os => ({
            ...os,
            cliente: clientsMap.get(os.clienteId),
            veiculo: vehiclesMap.get(os.veiculoId),
        }))
        .slice(0, 5);


    return {
      receitaMensal,
      ordensAndamento,
      ordensConcluidasMes: ordensConcluidasMes.length,
      orcamentosPendentes,
      totalClientes,
      novosClientesMes,
      revenueData,
      pendingQuotes,
      recentOrders,
    };
  }, [clientes, orcamentos, ordensServico, veiculos, isLoading]);
  
  if (isLoading || !user) {
    return <div className="flex h-screen w-screen items-center justify-center"><Skeleton className="h-24 w-24" /></div>
  }
  

  return (
    <SidebarProvider>
      <Sidebar>
        <AppSidebar />
      </Sidebar>
      <SidebarInset>
        <AppHeader />
        <main className="flex-1 space-y-6 p-4 md:p-6 lg:p-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                <StatCard
                title="Receita Mensal"
                value={`R$ ${dashboardStats.receitaMensal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                icon={<CircleDollarSign className="h-6 w-6 text-muted-foreground" />}
                description="Receita do mês atual"
                />
                <StatCard
                title="Ordens em Andamento"
                value={dashboardStats.ordensAndamento.toString()}
                icon={<Clock className="h-6 w-6 text-muted-foreground" />}
                description="Serviços ativos no momento"
                />
                <StatCard
                title="Ordens Concluídas"
                value={dashboardStats.ordensConcluidasMes.toString()}
                icon={<Wrench className="h-6 w-6 text-muted-foreground" />}
                description="Ordens finalizadas este mês"
                />
                <StatCard
                title="Orçamentos Pendentes"
                value={dashboardStats.orcamentosPendentes.toString()}
                icon={<FileText className="h-6 w-6 text-muted-foreground" />}
                description="Aguardando aprovação do cliente"
                />
                <StatCard
                title="Total de Clientes"
                value={dashboardStats.totalClientes.toString()}
                icon={<Users className="h-6 w-6 text-muted-foreground" />}
                description={`${dashboardStats.novosClientesMes} novos este mês`}
                />
            </div>
         

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <RevenueChartCard data={dashboardStats.revenueData} />
            </div>
            <div className="lg:col-span-1">
                 <RecentActivityCard
                    title="Orçamentos Pendentes"
                    items={dashboardStats.pendingQuotes}
                    icon={<FileText className="h-5 w-5" />}
                    emptyMessage="Nenhum orçamento pendente."
                  />
            </div>
          </div>
          
                <RecentActivityCard
                    title="Ordens de Serviço Recentes"
                    items={dashboardStats.recentOrders}
                    icon={<Car className="h-5 w-5" />}
                    emptyMessage="Nenhuma ordem de serviço recente."
                />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
