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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Pencil, Trash2, Loader2 } from 'lucide-react';
import type { Cliente } from '@/lib/types';
import { deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { doc, getDocs, collection, query, where, limit, writeBatch } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { EditClientForm } from './edit-client-form';

interface ClientTableProps {
  clients: Cliente[];
}

export default function ClientTable({ clients = [] }: ClientTableProps) {
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Cliente | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleEditClick = (client: Cliente) => {
    setSelectedClient(client);
    setIsEditDialogOpen(true);
  };

  const handleDeleteClick = (client: Cliente) => {
    setSelectedClient(client);
    setIsDeleteDialogOpen(true);
  };

  const checkForDependencies = async (clientId: string): Promise<string[]> => {
    if (!firestore) return ['Erro de conexão com o banco de dados.'];
    const dependencies: string[] = [];

    // Check for orcamentos
    const orcamentosQuery = query(collection(firestore, 'orcamentos'), where('clienteId', '==', clientId), limit(1));
    const orcamentosSnapshot = await getDocs(orcamentosQuery);
    if (!orcamentosSnapshot.empty) {
      dependencies.push('orçamentos');
    }

    // Check for ordens de serviço
    const ordensQuery = query(collection(firestore, 'ordensServico'), where('clienteId', '==', clientId), limit(1));
    const ordensSnapshot = await getDocs(ordensQuery);
    if (!ordensSnapshot.empty) {
      dependencies.push('ordens de serviço');
    }
    
    return dependencies;
};


  const handleDeleteConfirm = async () => {
    if (!selectedClient || !firestore) return;
    
    setIsDeleting(true);

    try {
        const dependencies = await checkForDependencies(selectedClient.id);
      
        if (dependencies.length > 0) {
            toast({
            variant: 'destructive',
            title: 'Exclusão Bloqueada',
            description: `Não é possível excluir este cliente. Ele possui ${dependencies.join(', ')} associados.`,
            duration: 7000,
            });
            setIsDeleting(false);
            setIsDeleteDialogOpen(false);
            return;
        }

        // Batch delete all vehicles in the subcollection first
        const vehiclesQuery = collection(firestore, `clientes/${selectedClient.id}/veiculos`);
        const vehiclesSnapshot = await getDocs(vehiclesQuery);
        
        const batch = writeBatch(firestore);

        vehiclesSnapshot.forEach(vehicleDoc => {
            batch.delete(vehicleDoc.ref);
        });

        // Delete the client document itself
        const clientDocRef = doc(firestore, 'clientes', selectedClient.id);
        batch.delete(clientDocRef);
        
        await batch.commit();

        toast({
            title: 'Cliente excluído',
            description: `${selectedClient.nome} e todos os seus veículos foram removidos.`,
        });

    } catch (error: any) {
        console.error("Error deleting client and their vehicles: ", error);
        toast({
            variant: 'destructive',
            title: 'Erro ao Excluir',
            description: `Ocorreu um erro: ${error.message}`,
        });
    } finally {
        setIsDeleting(false);
        setIsDeleteDialogOpen(false);
        setSelectedClient(null);
    }
  };

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead className="hidden sm:table-cell">Telefone</TableHead>
              <TableHead className="hidden md:table-cell">Email</TableHead>
              <TableHead>
                <span className="sr-only">Ações</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clients.length > 0 ? (
              clients.map((client) => (
                <TableRow key={client.id}>
                  <TableCell className="font-medium">{client.nome}</TableCell>
                  <TableCell className="hidden sm:table-cell text-muted-foreground">
                    {client.telefone}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">
                    {client.email}
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
                        <DropdownMenuItem onClick={() => handleEditClick(client)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive focus:bg-destructive/10"
                          onClick={() => handleDeleteClick(client)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  Nenhum cliente encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso excluirá permanentemente o
              cliente &quot;{selectedClient?.nome}&quot; e **todos os veículos associados a ele**.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isDeleting ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Cliente</DialogTitle>
            <DialogDescription>
              Altere os dados do cliente abaixo. Clique em salvar quando terminar.
            </DialogDescription>
          </DialogHeader>
          {selectedClient && (
            <EditClientForm
              client={selectedClient}
              setDialogOpen={setIsEditDialogOpen}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
