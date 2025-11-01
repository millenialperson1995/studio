import AppHeader from '@/components/layout/app-header';
import AppSidebar from '@/components/layout/app-sidebar';
import { Sidebar, SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { recentOrders } from '@/lib/mock-data'; // This is not used, but we'll keep it for future reference.
import ClientTable from '@/components/clientes/client-table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

// We will fetch the real data later on.
const getClients = async () => {
  const { clientes } = await import('@/lib/mock-data');
  return clientes;
};


export default async function ClientesPage() {
  const clients = await getClients();

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
                <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Adicionar Cliente
                </Button>
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle>Lista de Clientes</CardTitle>
                    <CardDescription>
                        Gerencie os clientes da sua retífica.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <ClientTable clients={clients} />
                </CardContent>
            </Card>

        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
