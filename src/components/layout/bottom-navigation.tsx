'use client';

import { Button } from '@/components/ui/button';
import { Car, FileText, LayoutDashboard, LineChart, List, Package, Plus, Settings, Users, Wrench, ScrollText } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useState, useRef, useEffect } from 'react';
import LogoImage from '../ui/logo-image';
import { useOnClickOutside } from 'usehooks-ts';

// Itens principais que sempre aparecem
const mainNavItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/clientes', label: 'Clientes', icon: Users },
  { href: '/orcamentos', label: 'Orçamentos', icon: FileText },
  { href: '/veiculos', label: 'Veículos', icon: Car },
];

// Itens secundários que aparecem ao expandir
const additionalNavItems = [
  { href: '/ordens-de-servico', label: 'Ordens', icon: Wrench },
  { href: '/resumos', label: 'Resumos', icon: ScrollText },
  { href: '/estoque', label: 'Estoque', icon: Package },
  { href: '/servicos', label: 'Serviços', icon: List },
  { href: '/relatorios', label: 'Relatórios', icon: LineChart },
];

export default function BottomNavigation() {
  const pathname = usePathname();
  const [isExpanded, setIsExpanded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const toggleExpanded = () => setIsExpanded(!isExpanded);

  // Close when clicking outside
  useOnClickOutside(containerRef as React.RefObject<HTMLElement>, () => setIsExpanded(false));

  // Close on scroll
  useEffect(() => {
    const handleScroll = () => {
      if (isExpanded) {
        setIsExpanded(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isExpanded]);

  return (
    <div ref={containerRef} className="fixed bottom-0 left-0 right-0 pointer-events-none md:hidden z-50">
      {/* Itens expandidos (Menu Flutuante) */}
      {isExpanded && (
        <div className="absolute bottom-20 left-4 right-4 pointer-events-auto bg-popover/95 backdrop-blur-md border border-border shadow-2xl rounded-xl overflow-hidden animate-in slide-in-from-bottom-5 fade-in duration-200">
          {/* Logo no topo */}
          <div className="flex justify-center py-3 bg-muted/30 border-b border-border/50">
            <div className="flex flex-col items-center">
              <LogoImage width={32} height={32} />
              <span className="text-xs mt-1 font-bold text-muted-foreground">Retífica Figueirêdo</span>
            </div>
          </div>

          {/* Itens adicionais */}
          <div className="grid grid-cols-4 gap-2 p-4">
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
                    "flex flex-col items-center justify-center h-20 w-auto p-1 rounded-lg hover:bg-accent",
                    isActive ? 'text-primary bg-primary/10' : 'text-muted-foreground'
                  )}
                >
                  <Link href={item.href} onClick={() => setIsExpanded(false)} className="flex flex-col items-center gap-1">
                    <IconComponent className={cn('h-6 w-6', {
                      'text-primary': isActive,
                    })} />
                    <span className={cn("text-[0.7rem] font-bold text-center leading-none", isActive && 'text-primary')}>
                      {item.label}
                    </span>
                  </Link>
                </Button>
              );
            })}
          </div>
        </div>
      )}

      {/* Navegação principal (inferior) */}
      <div className="pointer-events-auto bg-background/95 backdrop-blur-lg border-t border-border shadow-[0_-5px_20px_rgba(0,0,0,0.1)] flex justify-around items-end pb-2 pt-2 min-h-[80px]">
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
                "flex flex-col items-center justify-center h-16 w-16 p-1 rounded-xl transition-all duration-200 hover:bg-transparent focus:bg-transparent active:bg-transparent",
                isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Link href={item.href}>
                <IconComponent
                  className={cn('h-6 w-6 mb-1', {
                    'text-primary': isActive,
                  })}
                />
                <span className="text-[0.7rem] font-bold">{item.label}</span>
              </Link>
            </Button>
          );
        })}

        {/* Botão central de expansão */}
        <div className="relative flex flex-col items-center -top-6">
          <Button
            variant="default"
            size="lg"
            className={cn(
              "flex items-center justify-center h-16 w-16 rounded-full bg-primary text-primary-foreground shadow-xl border-4 border-background",
              "hover:scale-110 active:scale-95 transition-all duration-300",
              isExpanded && "bg-destructive text-destructive-foreground rotate-45"
            )}
            onClick={toggleExpanded}
          >
            <Plus className="h-8 w-8" />
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
                "flex flex-col items-center justify-center h-16 w-16 p-1 rounded-xl transition-all duration-200 hover:bg-transparent focus:bg-transparent active:bg-transparent",
                isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Link href={item.href}>
                <IconComponent
                  className={cn('h-6 w-6 mb-1', {
                    'text-primary': isActive,
                  })}
                />
                <span className="text-[0.7rem] font-bold">{item.label}</span>
              </Link>
            </Button>
          );
        })}
      </div>
    </div>
  );
}
