import AppHeader from '@/components/layout/app-header';
import AppSidebar from '@/components/layout/app-sidebar';
import { Sidebar, SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default async function ConfiguracoesPage() {
  return (
    <SidebarProvider>
      <Sidebar>
        <AppSidebar />
      </Sidebar>
      <SidebarInset>
        <AppHeader />
        <main className="flex-1 space-y-6 p-4 md:p-6 lg:p-8">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-semibold">Configurações</h1>
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle>Configurações Gerais</CardTitle>
                    <CardDescription>
                        Ajuste as configurações do sistema.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-center h-48 text-muted-foreground">
                        <p>A funcionalidade será implementada em breve.</p>
                    </div>
                </CardContent>
            </Card>

        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
