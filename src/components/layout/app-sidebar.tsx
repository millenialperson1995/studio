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
              <Link href="/" legacyBehavior passHref>
                <SidebarMenuButton isActive tooltip="Dashboard">
                  <LayoutDashboard />
                  Dashboard
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <Link href="#" legacyBehavior passHref>
                <SidebarMenuButton tooltip="Clientes">
                  <Users />
                  Clientes
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <Link href="#" legacyBehavior passHref>
                <SidebarMenuButton tooltip="Veículos">
                  <Car />
                  Veículos
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <Link href="#" legacyBehavior passHref>
                <SidebarMenuButton tooltip="Orçamentos">
                  <FileText />
                  Orçamentos
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <Link href="#" legacyBehavior passHref>
                <SidebarMenuButton tooltip="Ordens de Serviço">
                  <Wrench />
                  Ordens de Serviço
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <Link href="#" legacyBehavior passHref>
                <SidebarMenuButton tooltip="Estoque">
                  <Package />
                  Estoque
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <Link href="#" legacyBehavior passHref>
                <SidebarMenuButton tooltip="Serviços">
                  <List />
                  Serviços
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="p-2 border-t mt-auto">
            <SidebarMenu>
                <SidebarMenuItem>
                    <Link href="#" legacyBehavior passHref>
                        <SidebarMenuButton tooltip="Configurações">
                            <Settings />
                            Configurações
                        </SidebarMenuButton>
                    </Link>
                </SidebarMenuItem>
            </SidebarMenu>
        </SidebarFooter>
      </>
    );
  };
  
  export default AppSidebar;
  