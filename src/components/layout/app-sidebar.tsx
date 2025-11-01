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
  import Image from 'next/image';

  const AppSidebar = () => {
    const { state } = useSidebar();
    const isCollapsed = state === 'collapsed';
    return (
      <>
        <SidebarHeader>
          <div className="flex items-center gap-2 p-2">
            <Image src="https://storage.googleapis.com/aifirebase-1.appspot.com/images/158a156f-2032-4d2c-a28a-8742880d46d0.png" alt="Logo Retífica Figueirêdo" width={40} height={40} className="shrink-0 rounded-full" />
            <h1
              className={`text-lg font-semibold text-foreground transition-opacity duration-200 ${isCollapsed ? 'opacity-0' : 'opacity-100'}`}
            >
              RETÍFICA FIGUEIRÊDO
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
  