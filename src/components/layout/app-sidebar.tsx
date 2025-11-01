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
  } from '../ui/sidebar';
  import Link from 'next/link';

  const AppSidebar = () => {
    return (
      <>
        <SidebarHeader className="border-b">
          <div className="flex items-center gap-2 p-2">
            <Wrench className="h-8 w-8 text-primary" />
            <h1 className="text-xl font-bold text-foreground">Retífica Ágil</h1>
          </div>
        </SidebarHeader>
        <SidebarContent className="p-2">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive tooltip="Dashboard">
                <Link href="/">
                  <LayoutDashboard />
                  Dashboard
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Clientes">
                <Link href="#">
                  <Users />
                  Clientes
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Veículos">
                <Link href="#">
                  <Car />
                  Veículos
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Orçamentos">
                <Link href="#">
                  <FileText />
                  Orçamentos
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Ordens de Serviço">
                <Link href="#">
                  <Wrench />
                  Ordens de Serviço
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Estoque">
                <Link href="#">
                  <Package />
                  Estoque
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Serviços">
                <Link href="#">
                  <List />
                  Serviços
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="p-2 border-t mt-auto">
            <SidebarMenu>
                <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip="Configurações">
                        <Link href="#">
                            <Settings />
                            Configurações
                        </Link>
                    </SidebarMenuButton>
                </SidebarMenuItem>
            </SidebarMenu>
        </SidebarFooter>
      </>
    );
  };
  
  export default AppSidebar;
  