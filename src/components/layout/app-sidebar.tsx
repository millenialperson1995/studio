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
              <Link href="/" passHref>
                <SidebarMenuButton asChild isActive tooltip="Dashboard">
                  <span>
                    <LayoutDashboard />
                    Dashboard
                  </span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <Link href="#" passHref>
                <SidebarMenuButton asChild tooltip="Clientes">
                  <span>
                    <Users />
                    Clientes
                  </span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <Link href="#" passHref>
                <SidebarMenuButton asChild tooltip="Veículos">
                  <span>
                    <Car />
                    Veículos
                  </span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <Link href="#" passHref>
                <SidebarMenuButton asChild tooltip="Orçamentos">
                  <span>
                    <FileText />
                    Orçamentos
                  </span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <Link href="#" passHref>
                <SidebarMenuButton asChild tooltip="Ordens de Serviço">
                  <span>
                    <Wrench />
                    Ordens de Serviço
                  </span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <Link href="#" passHref>
                <SidebarMenuButton asChild tooltip="Estoque">
                  <span>
                    <Package />
                    Estoque
                  </span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <Link href="#" passHref>
                <SidebarMenuButton asChild tooltip="Serviços">
                  <span>
                    <List />
                    Serviços
                  </span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="p-2 border-t mt-auto">
            <SidebarMenu>
                <SidebarMenuItem>
                  <Link href="#" passHref>
                    <SidebarMenuButton asChild tooltip="Configurações">
                        <span>
                            <Settings />
                            Configurações
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
  