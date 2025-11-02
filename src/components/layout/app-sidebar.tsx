import {
    Car,
    FileText,
    LayoutDashboard,
    LineChart,
    List,
    Package,
    Settings,
    Users,
    Wrench,
    Sparkles,
  } from 'lucide-react';
  import {
    SidebarHeader,
    SidebarContent,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
    SidebarFooter,
    useSidebar,
  } from '../ui/sidebar';
  import { cn } from '@/lib/utils';
  import { Wrench as Logo } from 'lucide-react';


  const AppSidebar = () => {
    const { state } = useSidebar();
    const isCollapsed = state === 'collapsed';
    return (
      <>
        <SidebarHeader>
          <div className={cn("flex items-center gap-2 p-2", isCollapsed ? 'justify-center' : '')}>
            <Logo className="w-8 h-8 text-primary" />
            <h1
              className={`text-lg font-semibold text-foreground transition-opacity duration-200 ${isCollapsed ? 'opacity-0 w-0' : 'opacity-100'}`}
            >
              Retífica Figueirêdo
            </h1>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            <SidebarMenuItem>
                <SidebarMenuButton href="/" tooltip="Dashboard">
                    <LayoutDashboard />
                    {!isCollapsed && 'Dashboard'}
                </SidebarMenuButton>
            </SidebarMenuItem>
             <SidebarMenuItem>
                <SidebarMenuButton href="/relatorios" tooltip="Relatórios">
                    <LineChart />
                    {!isCollapsed && 'Relatórios'}
                </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
                <SidebarMenuButton href="/clientes" tooltip="Clientes">
                    <Users />
                    {!isCollapsed && 'Clientes'}
                </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
                <SidebarMenuButton href="/veiculos" tooltip="Veículos">
                    <Car />
                    {!isCollapsed && 'Veículos'}
                </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
                <SidebarMenuButton href="/orcamentos" tooltip="Orçamentos">
                    <FileText />
                    {!isCollapsed && 'Orçamentos'}
                </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
                <SidebarMenuButton href="/ordens-de-servico" tooltip="Ordens de Serviço">
                    <Wrench />
                    {!isCollapsed && 'Ordens de Serviço'}
                </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
                <SidebarMenuButton href="/estoque" tooltip="Estoque">
                    <Package />
                    {!isCollapsed && 'Estoque'}
                </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
                <SidebarMenuButton href="/servicos" tooltip="Serviços">
                    <List />
                    {!isCollapsed && 'Serviços'}
                </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="mt-auto">
            <SidebarMenu>
                 <SidebarMenuItem>
                    <SidebarMenuButton href="/configuracoes" tooltip="Configurações">
                        <Settings />
                        {!isCollapsed && 'Configurações'}
                    </SidebarMenuButton>
                </SidebarMenuItem>
            </SidebarMenu>
        </SidebarFooter>
      </>
    );
  };
  
  export default AppSidebar;
  