'use client';

import { Bell, Search, Settings, User, LogOut, PanelLeft, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { SidebarTrigger } from '../ui/sidebar';
import { useAuth, useCollection, useUser, useFirestore } from '@/firebase';
import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { collection, query, where, orderBy, limit, writeBatch, doc } from 'firebase/firestore';
import type { Notificacao } from '@/lib/types';
import { useMemoFirebase } from '@/firebase/provider';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function AppHeader() {
  const auth = useAuth();
  const firestore = useFirestore();
  const { user } = useUser();
  const router = useRouter();

  const notificationsQuery = useMemoFirebase(
    () => user && firestore 
      ? query(
          collection(firestore, 'notificacoes'), 
          where('userId', '==', user.uid), 
          orderBy('createdAt', 'desc'), 
          limit(10)
        ) 
      : null,
    [user, firestore]
  );
  
  const { data: notifications } = useCollection<Notificacao>(notificationsQuery);
  const unreadCount = notifications?.filter(n => !n.isRead).length || 0;

  const handleSignOut = async () => {
    try {
      if (auth) await signOut(auth);
      router.push('/login');
    } catch (error) {
      console.error('Error signing out: ', error);
    }
  };
  
  const getInitials = (name?: string | null) => {
    if (!name) return 'AD';
    const names = name.split(' ');
    return names.length > 1
      ? `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase()
      : name.substring(0, 2).toUpperCase();
  }

  const handleMarkAllAsRead = async () => {
    if (!firestore || !notifications || unreadCount === 0) return;
    
    const batch = writeBatch(firestore);
    notifications.forEach(notification => {
      if (!notification.isRead) {
        const notifRef = doc(firestore, 'notificacoes', notification.id);
        batch.update(notifRef, { isRead: true });
      }
    });
    
    await batch.commit();
  };


  return (
    <header className="flex h-16 items-center gap-4 border-b bg-card px-4 md:px-6 sticky top-0 z-30">
      <div className="md:hidden">
        <SidebarTrigger>
           <PanelLeft className="h-6 w-6" />
           <span className="sr-only">Toggle Sidebar</span>
        </SidebarTrigger>
      </div>
      
      <div className="w-full flex-1">
        <form>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar..."
              className="w-full appearance-none bg-background pl-9 shadow-none md:w-2/3 lg:w-1/3"
            />
          </div>
        </form>
      </div>

      <div className="flex items-center gap-2 md:gap-4 ml-auto">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full relative">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-destructive ring-2 ring-card" />
              )}
              <span className="sr-only">Toggle notifications</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel className="flex justify-between items-center">
              <span>Notificações</span>
              {unreadCount > 0 && <span className="text-xs font-normal text-primary">{unreadCount} nova(s)</span>}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
                {notifications && notifications.length > 0 ? (
                  notifications.map(notif => (
                    <DropdownMenuItem key={notif.id} className="flex flex-col items-start gap-1 whitespace-normal">
                      <p className={`font-medium ${!notif.isRead ? 'text-foreground' : 'text-muted-foreground'}`}>{notif.title}</p>
                      <p className={`text-xs ${!notif.isRead ? 'text-foreground/80' : 'text-muted-foreground/80'}`}>{notif.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(notif.createdAt?.toDate() || new Date(), { addSuffix: true, locale: ptBR })}
                      </p>
                    </DropdownMenuItem>
                  ))
                ) : (
                  <div className="text-center text-sm text-muted-foreground py-4">
                    Nenhuma notificação.
                  </div>
                )}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleMarkAllAsRead} disabled={unreadCount === 0}>
                <Check className="mr-2 h-4 w-4" />
                <span>Marcar todas como lidas</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Avatar className="h-8 w-8">
                {user?.photoURL ? (
                    <AvatarImage src={user.photoURL} alt={user.displayName || 'User'} />
                ) : null}
                <AvatarFallback>{getInitials(user?.displayName)}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              <span>Perfil</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              <span>Configurações</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sair</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

    