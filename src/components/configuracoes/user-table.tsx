'use client';

import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, Pencil, UserX, UserCheck } from 'lucide-react';
import type { User } from '@/lib/types';
import { useFirestore } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { EditUserForm } from './edit-user-form';
import { updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { doc } from 'firebase/firestore';

interface UserTableProps {
  users: User[];
}

const roleMap: Record<User['role'], string> = {
    admin: 'Administrador',
    recepcionista: 'Recepcionista',
    mecanico: 'Mecânico',
};

export default function UserTable({ users = [] }: UserTableProps) {
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const handleEditClick = (user: User) => {
    setSelectedUser(user);
    setIsEditDialogOpen(true);
  };

  const handleToggleActivation = async (user: User) => {
      if (!firestore) return;
      const userDocRef = doc(firestore, 'users', user.uid);
      const newStatus = !user.disabled;
      try {
        await updateDocumentNonBlocking(userDocRef, { disabled: newStatus });
        toast({
            title: `Usuário ${newStatus ? 'Desativado' : 'Ativado'}`,
            description: `A conta de ${user.displayName} foi ${newStatus ? 'desativada' : 'ativada'}.`,
        });
      } catch (error) {
        toast({
            variant: 'destructive',
            title: 'Erro',
            description: 'Não foi possível alterar o status do usuário.',
        });
      }
  };

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead className="hidden sm:table-cell">Email</TableHead>
              <TableHead className="hidden md:table-cell">Função</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>
                <span className="sr-only">Ações</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length > 0 ? (
              users.map((user) => (
                <TableRow key={user.uid}>
                  <TableCell className="font-medium">{user.displayName}</TableCell>
                  <TableCell className="hidden sm:table-cell text-muted-foreground">
                    {user.email}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">
                    {roleMap[user.role]}
                  </TableCell>
                   <TableCell>
                    <Badge variant={user.disabled ? 'outline' : 'default'} className="text-xs">
                        {user.disabled ? 'Inativo' : 'Ativo'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button aria-haspopup="true" size="icon" variant="ghost">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Toggle menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Ações</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleEditClick(user)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleToggleActivation(user)}>
                            {user.disabled ? (
                                <>
                                    <UserCheck className="mr-2 h-4 w-4" />
                                    <span>Ativar</span>
                                </>
                            ) : (
                                <>
                                    <UserX className="mr-2 h-4 w-4" />
                                    <span>Desativar</span>
                                </>
                            )}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  Nenhum usuário encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Editar Usuário</DialogTitle>
            <DialogDescription>
              Altere os dados e a função do usuário.
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <EditUserForm
              user={selectedUser}
              setDialogOpen={setIsEditDialogOpen}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
