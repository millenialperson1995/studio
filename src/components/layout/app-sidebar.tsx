import {
    Car,
    FileText,
    LayoutDashboard,
    List,
    Package,
    Settings,
    Users,
    Wrench,
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
  import Link from 'next/link';

  const AppSidebar = () => {
    const { state } = useSidebar();
    const isCollapsed = state === 'collapsed';
    return (
      <>
        <SidebarHeader>
          <div className="flex items-center gap-2 p-2">
            <Wrench className="h-8 w-8 text-primary shrink-0" />
            <h1
              className={`text-xl font-bold text-foreground transition-opacity duration-200 ${isCollapsed ? 'opacity-0' : 'opacity-100'}`}
            >
              Retífica Ágil
            </h1>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <Link href="/" passHref>
                <SidebarMenuButton asChild tooltip="Dashboard">
                  <span>
                    <LayoutDashboard />
                    {!isCollapsed && 'Dashboard'}
                  </span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <Link href="/clientes" passHref>
                <SidebarMenuButton asChild tooltip="Clientes">
                  <span>
                    <Users />
                    {!isCollapsed && 'Clientes'}
                  </span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <Link href="/veiculos" passHref>
                <SidebarMenuButton asChild tooltip="Veículos">
                  <span>
                    <Car />
                    {!isCollapsed && 'Veículos'}
                  </span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <Link href="/orcamentos" passHref>
                <SidebarMenuButton asChild tooltip="Orçamentos">
                  <span>
                    <FileText />
                    {!isCollapsed && 'Orçamentos'}
                  </span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <Link href="/ordens-de-servico" passHref>
                <SidebarMenuButton asChild tooltip="Ordens de Serviço">
                  <span>
                    <Wrench />
                    {!isCollapsed && 'Ordens de Serviço'}
                  </span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <Link href="/estoque" passHref>
                <SidebarMenuButton asChild tooltip="Estoque">
                  <span>
                    <Package />
                    {!isCollapsed && 'Estoque'}
                  </span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <Link href="/servicos" passHref>
                <SidebarMenuButton asChild tooltip="Serviços">
                  <span>
                    <List />
                    {!isCollapsed && 'Serviços'}
                  </span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="mt-auto">
            <SidebarMenu>
                <SidebarMenuItem>
                  <Link href="/configuracoes" passHref>
                    <SidebarMenuButton asChild tooltip="Configurações">
                        <span>
                            <Settings />
                            {!isCollapsed && 'Configurações'}
                        </span>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
            </SidebarMenu>
        </SidebarFooter>
      </>
    );
  };
  
  export default AppSidebar;
  