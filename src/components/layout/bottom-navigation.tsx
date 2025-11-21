'use client';

import { Button } from '@/components/ui/button';
import { Car, FileText, LayoutDashboard, LineChart, List, Package, Plus, Settings, Users, Wrench } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import LogoImage from '../ui/logo-image';

// Itens principais que sempre aparecem
const mainNavItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/clientes', label: 'Clientes', icon: Users },
  { href: '/orcamentos', label: 'Orçamentos', icon: FileText },
  { href: '/ordens-de-servico', label: 'Ordens', icon: Wrench },
];

// Itens secundários que aparecem ao expandir
const additionalNavItems = [
  { href: '/veiculos', label: 'Veículos', icon: Car },
  { href: '/estoque', label: 'Estoque', icon: Package },
  { href: '/servicos', label: 'Serviços', icon: List },
  { href: '/relatorios', label: 'Relatórios', icon: LineChart },
];

export default function BottomNavigation() {
  const pathname = usePathname();
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpanded = () => setIsExpanded(!isExpanded);

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background border-t md:hidden z-50 shadow-lg">
      {/* Itens expandidos acima */}
      {isExpanded && (
        <div className="relative z-40 bg-popover border-b border-muted shadow-lg">
          {/* Logo no topo */}
          <div className="flex justify-center py-2">
            <div className="flex flex-col items-center">
              <LogoImage width={32} height={32} />
              <span className="text-xs mt-1 text-muted-foreground">Retífica Figueirêdo</span>
            </div>
          </div>

          {/* Itens adicionais */}
          <div className="flex justify-around items-center p-1">
            {additionalNavItems.map((item) => {
              const isActive = pathname === item.href;
              const IconComponent = item.icon;

              return (
                <Button
                  key={item.href}
                  asChild
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "flex flex-col items-center justify-center h-14 w-14 p-2 rounded-none",
                    isActive ? 'text-primary' : 'text-muted-foreground'
                  )}
                >
                  <Link href={item.href} onClick={() => setIsExpanded(false)}>
                    <IconComponent
                      className={cn('h-5 w-5', {
                        'text-primary': isActive,
                      })}
                    />
                    <span className="text-[0.5rem] mt-1 font-medium">{item.label}</span>
                  </Link>
                </Button>
              );
            })}
          </div>
        </div>
      )}

      {/* Navegação principal (inferior) */}
      <div className="flex justify-around items-center p-1">
        {mainNavItems.slice(0, 2).map((item) => {
          const isActive = pathname === item.href;
          const IconComponent = item.icon;

          return (
            <Button
              key={item.href}
              asChild
              variant="ghost"
              size="sm"
              className={cn(
                "flex flex-col items-center justify-center h-16 w-14 p-2 rounded-none",
                isActive ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <Link href={item.href}>
                <IconComponent
                  className={cn('h-6 w-6', {
                    'text-primary': isActive,
                  })}
                />
                <span className="text-[0.6rem] mt-1 font-medium">{item.label}</span>
              </Link>
            </Button>
          );
        })}

        {/* Botão central de expansão */}
        <div className="relative flex flex-col items-center">
          <Button
            variant="default"
            size="sm"
            className={cn(
              "flex items-center justify-center h-16 w-16 rounded-full bg-gradient-to-r from-primary to-primary/90 text-primary-foreground -mt-6 z-10",
              "shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 active:scale-95"
            )}
            onClick={toggleExpanded}
          >
            <Plus
              className={cn(
                "h-6 w-6 transition-transform duration-300",
                isExpanded ? "rotate-45" : ""
              )}
            />
          </Button>
        </div>

        {mainNavItems.slice(2).map((item) => {
          const isActive = pathname === item.href;
          const IconComponent = item.icon;

          return (
            <Button
              key={item.href}
              asChild
              variant="ghost"
              size="sm"
              className={cn(
                "flex flex-col items-center justify-center h-16 w-14 p-2 rounded-none",
                isActive ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <Link href={item.href}>
                <IconComponent
                  className={cn('h-6 w-6', {
                    'text-primary': isActive,
                  })}
                />
                <span className="text-[0.6rem] mt-1 font-medium">{item.label}</span>
              </Link>
            </Button>
          );
        })}
      </div>
    </div>
  );
}