'use client';
import { useMemo, useEffect } from 'react';
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
import { collection, query, where, Timestamp } from 'firebase/firestore';
import { useMemoFirebase } from '@/firebase/provider';
import type { Cliente, OrdemServico, Orcamento } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';

function DashboardPage() {
  const firestore = useFirestore();
  const { user } = useUser();

  // --- Data Fetching (Scoped to current user) ---
  const clientesRef = useMemoFirebase(
    () => (firestore && user?.uid ? query(collection(firestore, 'clientes'), where('userId', '==', user.uid)) : null),
    [firestore, user?.uid]
  );
  const orcamentosRef = useMemoFirebase(
    () => (firestore && user?.uid ? query(collection(firestore, 'orcamentos'), where('userId', '==', user.uid)) : null),
    [firestore, user?.uid]
  );
  const ordensQuery = useMemoFirebase(
    () => (firestore && user?.uid ? query(collection(firestore, 'ordensServico'), where('userId', '==', user.uid)) : null),
    [firestore, user?.uid]
  );
  
  const { data: clientes, isLoading: isLoadingClientes } = useCollection<Cliente>(clientesRef);
  const { data: orcamentos, isLoading: isLoadingOrcamentos } = useCollection<Orcamento>(orcamentosRef);
  const { data: ordensServico, isLoading: isLoadingOrdens } = useCollection<OrdemServico>(ordensQuery);

  const isLoading = isLoadingClientes || isLoadingOrcamentos || isLoadingOrdens;

  const toDate = (timestamp: any): Date => {
      if (!timestamp) return new Date(0);
      if (timestamp.toDate) return timestamp.toDate();
      if (timestamp instanceof Date) return timestamp;
      // Handle cases where timestamp might be a string or number
      if (typeof timestamp === 'string' || typeof timestamp === 'number') {
        const d = new Date(timestamp);
        if (!isNaN(d.getTime())) return d;
      }
      return new Date(0);
  }

  // --- Data Processing & Calculations ---
  const dashboardStats = useMemo(() => {
    if (isLoading || !clientes || !orcamentos || !ordensServico) {
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

    const pendingQuotes = orcamentos
        .filter(o => o.status === 'pendente')
        .sort((a, b) => toDate(b.dataCriacao).getTime() - toDate(a.dataCriacao).getTime())
        .map(o => ({
            ...o,
            cliente: clientsMap.get(o.clienteId),
        }))
        .slice(0, 5);

    const recentOrders = ordensServico
        .sort((a, b) => toDate(b.dataEntrada).getTime() - toDate(a.dataEntrada).getTime())
        .map(os => ({
            ...os,
            cliente: clientsMap.get(os.clienteId),
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
  }, [isLoading, clientes, orcamentos, ordensServico]);
  
  if (isLoading) {
    return (
      <main className="flex-1 space-y-6 p-4 md:p-6 lg:p-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-28 w-full" />)}
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
                  <Skeleton className="h-[380px] w-full" />
            </div>
            <div className="lg:col-span-1">
                  <Skeleton className="h-[380px] w-full" />
            </div>
        </div>
        <Skeleton className="h-[380px] w-full" />
      </main>
    );
  }
  
  const stats = [
    { 
      title: "Receita Mensal", 
      value: `R$ ${dashboardStats.receitaMensal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 
      icon: <CircleDollarSign className="h-6 w-6 text-muted-foreground" />,
      description: "Receita do mês atual"
    },
    { 
      title: "Ordens em Andamento", 
      value: dashboardStats.ordensAndamento.toString(),
      icon: <Clock className="h-6 w-6 text-muted-foreground" />,
      description: "Serviços ativos no momento"
    },
    { 
      title: "Ordens Concluídas", 
      value: dashboardStats.ordensConcluidasMes.toString(),
      icon: <Wrench className="h-6 w-6 text-muted-foreground" />,
      description: "Ordens finalizadas este mês"
    },
    { 
      title: "Orçamentos Pendentes", 
      value: dashboardStats.orcamentosPendentes.toString(),
      icon: <FileText className="h-6 w-6 text-muted-foreground" />,
      description: "Aguardando aprovação do cliente"
    },
    { 
      title: "Total de Clientes", 
      value: dashboardStats.totalClientes.toString(),
      icon: <Users className="h-6 w-6 text-muted-foreground" />,
      description: `${dashboardStats.novosClientesMes} novos este mês`
    }
  ];

  return (
    <main className="flex-1 space-y-6 p-4 md:p-6 lg:p-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {stats.map(stat => (
              <StatCard
                key={stat.title}
                title={stat.title}
                value={stat.value}
                icon={stat.icon}
                description={stat.description}
              />
            ))}
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
  );
}

export default function Home() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  // Render a loading state while checking for user auth
  if (isUserLoading || !user) {
    return (
      <SidebarProvider>
        <Sidebar>
          <AppSidebar />
        </Sidebar>
        <SidebarInset>
          <AppHeader />
          <main className="flex-1 space-y-6 p-4 md:p-6 lg:p-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-28 w-full" />)}
            </div>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <Skeleton className="h-[380px] w-full" />
              </div>
              <div className="lg:col-span-1">
                <Skeleton className="h-[380px] w-full" />
              </div>
            </div>
            <Skeleton className="h-[380px] w-full" />
          </main>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  // Once user is authenticated, render the actual dashboard page
  return (
    <SidebarProvider>
      <Sidebar>
        <AppSidebar />
      </Sidebar>
      <SidebarInset>
        <AppHeader />
        <DashboardPage />
      </SidebarInset>
    </SidebarProvider>
  );
}
