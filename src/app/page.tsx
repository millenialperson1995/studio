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
import { dashboardData, recentOrders, pendingQuotes } from '@/lib/mock-data';
import RevenueChartCard from '@/components/dashboard/revenue-chart-card';
import RecentActivityCard from '@/components/dashboard/recent-activity-card';

export default function Home() {
  return (
    <SidebarProvider>
      <Sidebar>
        <AppSidebar />
      </Sidebar>
      <SidebarInset>
        <AppHeader />
        <main className="flex-1 space-y-6 p-4 md:p-6 lg:p-8">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            <StatCard
              title="Receita Mensal"
              value={`R$ ${dashboardData.receitaMensal.toLocaleString('pt-BR')}`}
              icon={<CircleDollarSign className="h-6 w-6 text-muted-foreground" />}
              description="Receita do mês atual"
            />
            <StatCard
              title="Ordens em Andamento"
              value={dashboardData.ordensAndamento.toString()}
              icon={<Clock className="h-6 w-6 text-muted-foreground" />}
              description="Serviços ativos no momento"
            />
            <StatCard
              title="Ordens Concluídas"
              value={dashboardData.ordensConcluidas.toString()}
              icon={<Wrench className="h-6 w-6 text-muted-foreground" />}
              description="Ordens finalizadas este mês"
            />
            <StatCard
              title="Orçamentos Pendentes"
              value={dashboardData.orcamentosPendentes.toString()}
              icon={<FileText className="h-6 w-6 text-muted-foreground" />}
              description="Aguardando aprovação do cliente"
            />
            <StatCard
              title="Total de Clientes"
              value={dashboardData.metricasClientes.totalClientes.toString()}
              icon={<Users className="h-6 w-6 text-muted-foreground" />}
              description={`${dashboardData.metricasClientes.novosEsteMes} novos este mês`}
            />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <RevenueChartCard />
            </div>
            <div className="lg:col-span-1">
              <RecentActivityCard
                title="Orçamentos Pendentes"
                items={pendingQuotes}
                icon={<FileText className="h-5 w-5" />}
                emptyMessage="Nenhum orçamento pendente."
              />
            </div>
          </div>
          
          <RecentActivityCard
            title="Ordens de Serviço Recentes"
            items={recentOrders}
            icon={<Car className="h-5 w-5" />}
            emptyMessage="Nenhuma ordem de serviço recente."
          />

        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
