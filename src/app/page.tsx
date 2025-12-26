'use client';
import { useMemo } from 'react';
import Link from 'next/link';
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
import { collection, query, where } from 'firebase/firestore';
import { useMemoFirebase } from '@/firebase/provider';
import type { Cliente, OrdemServico, Orcamento } from '@/lib/types';
import { toDate } from '@/lib/utils';
import MobileLayout from '@/components/layout/mobile-layout';

import DashboardSkeleton from '@/components/dashboard/dashboard-skeleton';

// ... imports

function DashboardContent() {
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
    const pendingQuotes = orcamentos
      .filter(o => o.status === 'pendente')
      .sort((a, b) => toDate(b.dataCriacao).getTime() - toDate(a.dataCriacao).getTime())
      .slice(0, 5);

    const recentOrders = ordensServico
      .sort((a, b) => toDate(b.dataEntrada).getTime() - toDate(a.dataEntrada).getTime())
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
    return <DashboardSkeleton />;
  }

  const stats = [
    {
      title: "Receita Mensal",
      value: `R$ ${dashboardStats.receitaMensal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: <CircleDollarSign className="h-6 w-6 text-muted-foreground" />,
      description: "Receita do mês atual",
      href: null,
    },
    {
      title: "Ordens em Andamento",
      value: dashboardStats.ordensAndamento.toString(),
      icon: <Clock className="h-6 w-6 text-muted-foreground" />,
      description: "Serviços ativos no momento",
      href: "/ordens-de-servico?status=andamento",
    },
    {
      title: "Ordens Concluídas",
      value: dashboardStats.ordensConcluidasMes.toString(),
      icon: <Wrench className="h-6 w-6 text-muted-foreground" />,
      description: "Ordens finalizadas este mês",
      href: "/ordens-de-servico?status=concluida",
    },
    {
      title: "Orçamentos Pendentes",
      value: dashboardStats.orcamentosPendentes.toString(),
      icon: <FileText className="h-6 w-6 text-muted-foreground" />,
      description: "Aguardando aprovação do cliente",
      href: "/orcamentos?status=pendente",
    },
    {
      title: "Total de Clientes",
      value: dashboardStats.totalClientes.toString(),
      icon: <Users className="h-6 w-6 text-muted-foreground" />,
      description: `${dashboardStats.novosClientesMes} novos este mês`,
      href: "/clientes",
    }
  ];

  return (
    <main className="flex-1 space-y-6 p-4 md:p-6 lg:p-8 mb-20 md:mb-0">
      {/* New Feature Announcement Banner */}
      <Link href="/resumos">
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 p-1 hover:shadow-lg transition-all duration-300 cursor-pointer group">
          <div className="bg-background rounded-lg p-4 md:p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 text-4xl animate-bounce">
                🚀
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-lg md:text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Novo Módulo Lançado!
                  </h3>
                  <span className="px-2 py-0.5 text-xs font-bold bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-full animate-pulse">
                    NOVO
                  </span>
                </div>
                <p className="text-sm md:text-base text-muted-foreground mb-2">
                  <span className="font-semibold text-foreground">Resumos de Serviços</span> - Organize e gerencie fechamentos mensais para seus clientes de forma fácil e profissional.
                </p>
                <p className="text-xs md:text-sm text-primary font-medium group-hover:underline">
                  Clique para experimentar agora →
                </p>
              </div>
            </div>
          </div>
        </div>
      </Link>

      <h1 className="text-2xl md:text-3xl font-bold">Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {stats.map(stat => {
          const card = (
            <StatCard
              title={stat.title}
              value={stat.value}
              icon={stat.icon}
              description={stat.description}
            />
          );

          if (stat.href) {
            return (
              <Link href={stat.href} key={stat.title} className="hover:cursor-pointer transition-transform duration-200 hover:scale-105">
                {card}
              </Link>
            );
          }

          return <div key={stat.title}>{card}</div>;
        })}
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
  return (
    <MobileLayout>
      <DashboardContent />
    </MobileLayout>
  );
}
