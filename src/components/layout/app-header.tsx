'use client';

import { Bell, Search, Settings, User, LogOut, PanelLeft, PackageWarning, CircleCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuFooter,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { SidebarTrigger } from '../ui/sidebar';
import { useAuth, useUser, useFirestore, useCollection, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import type { Notificacao } from '@/lib/types';
import { collection, query, where, doc, writeBatch } from 'firebase/firestore';
import { Badge } from '../ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function AppHeader() {
  const auth = useAuth();
  const { user } = useUser();
  const firestore = useFirestore();
  const router = useRouter();

  const notificacoesQuery = useMemoFirebase(
    () => (firestore && user?.uid ? query(collection(firestore, 'notificacoes'), where('userId', '==', user.uid)) : null),
    [firestore, user?.uid]
  );
  
  const { data: notificacoes } = useCollection<Notificacao>(notificacoesQuery);
  const unreadCount = notificacoes?.filter(n => !n.lida).length || 0;

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
  };

  const handleMarkAllAsRead = async () => {
    if (!firestore || !notificacoes || unreadCount === 0) return;

    const batch = writeBatch(firestore);
    notificacoes.forEach(notificacao => {
        if (!notificacao.lida) {
            const notificacaoRef = doc(firestore, 'notificacoes', notificacao.id);
            batch.update(notificacaoRef, { lida: true });
        }
    });

    try {
        await batch.commit();
    } catch (error) {
        console.error("Error marking notifications as read: ", error);
    }
  };

  const formatDate = (date: any) => {
      if (!date) return 'agora';
      const jsDate = date.toDate ? date.toDate() : new Date(date);
      return formatDistanceToNow(jsDate, { addSuffix: true, locale: ptBR });
  }

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
                 <Badge
                    variant="destructive"
                    className="absolute -top-1 -right-1 h-5 w-5 justify-center rounded-full p-0 text-xs"
                 >
                    {unreadCount}
                </Badge>
              )}
              <span className="sr-only">Toggle notifications</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel>Notificações</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {notificacoes && notificacoes.length > 0 ? (
                notificacoes.sort((a,b) => (b.createdAt?.toDate() || 0) - (a.createdAt?.toDate() || 0)).slice(0, 5).map(n => (
                   <DropdownMenuItem key={n.id} className="flex-col items-start gap-1 p-2">
                       <div className='flex items-center gap-2'>
                           <PackageWarning className='h-4 w-4 text-amber-500' />
                           <p className='font-bold text-sm'>{n.titulo}</p>
                       </div>
                       <p className='text-xs text-muted-foreground'>{n.descricao}</p>
                       <p className='text-xs text-muted-foreground/80 self-end'>{formatDate(n.createdAt)}</p>
                   </DropdownMenuItem>
                ))
            ) : (
                <div className="text-center text-sm text-muted-foreground py-4">
                    Nenhuma notificação nova.
                </div>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuFooter>
                <Button variant="ghost" size="sm" className='w-full' onClick={handleMarkAllAsRead} disabled={unreadCount === 0}>
                    <CircleCheck className="mr-2 h-4 w-4" />
                    Marcar todas como lidas
                </Button>
            </DropdownMenuFooter>
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
