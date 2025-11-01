'use client';

import { useState } from 'react';
import AppHeader from '@/components/layout/app-header';
import AppSidebar from '@/components/layout/app-sidebar';
import {
  Sidebar,
  SidebarInset,
  SidebarProvider,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { useCollection, useFirestore } from '@/firebase';
import { useMemoFirebase } from '@/firebase/provider';
import { collection } from 'firebase/firestore';
import type { User } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import UserTable from '@/components/configuracoes/user-table';
import { AddUserForm } from '@/components/configuracoes/add-user-form';


export default function ConfiguracoesPage() {
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);
  const firestore = useFirestore();

  const usersCollectionRef = useMemoFirebase(
    () => (firestore ? collection(firestore, 'users') : null),
    [firestore]
  );
  
  const { data: users, isLoading, error } = useCollection<User>(usersCollectionRef);

  return (
    <SidebarProvider>
      <Sidebar>
        <AppSidebar />
      </Sidebar>
      <SidebarInset>
        <AppHeader />
        <main className="flex-1 space-y-6 p-4 md:p-6 lg:p-8">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold">Gerenciamento de Usuários</h1>
             <Dialog open={isAddUserDialogOpen} onOpenChange={setIsAddUserDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Adicionar Usuário
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Adicionar Novo Usuário</DialogTitle>
                  <DialogDescription>
                    Crie uma conta para um novo funcionário e defina sua função.
                  </DialogDescription>
                </DialogHeader>
                <AddUserForm setDialogOpen={setIsAddUserDialogOpen} />
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Lista de Usuários</CardTitle>
              <CardDescription>
                Gerencie as contas e permissões dos funcionários.
              </CardDescription>
            </CardHeader>
            <CardContent>
               {isLoading && (
                <div className="space-y-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              )}
              {!isLoading && <UserTable users={users || []} />}
              {error && (
                <div className="text-destructive text-center p-4">
                  Ocorreu um erro ao carregar os usuários. Verifique suas permissões de administrador.
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
