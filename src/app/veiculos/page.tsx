import AppHeader from '@/components/layout/app-header';
import AppSidebar from '@/components/layout/app-sidebar';
import { Sidebar, SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default async function VeiculosPage() {
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
                <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Adicionar Veículo
                </Button>
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle>Lista de Veículos</CardTitle>
                    <CardDescription>
                        Gerencie os veículos da sua retífica.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-center h-48 text-muted-foreground">
                        <p>Nenhum veículo encontrado. A funcionalidade será implementada em breve.</p>
                    </div>
                </CardContent>
            </Card>

        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
