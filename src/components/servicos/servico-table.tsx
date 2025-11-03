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
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import type { Servico } from '@/lib/types';
import { deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { doc } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { EditServicoForm } from './edit-servico-form';
import { Card, CardContent } from '../ui/card';

interface ServicoTableProps {
  servicos: Servico[];
}

export default function ServicoTable({ servicos = [] }: ServicoTableProps) {
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedServico, setSelectedServico] = useState<Servico | null>(null);

  const handleEditClick = (servico: Servico) => {
    setSelectedServico(servico);
    setIsEditDialogOpen(true);
  };

  const handleDeleteClick = (servico: Servico) => {
    setSelectedServico(servico);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (selectedServico && firestore) {
      const servicoDocRef = doc(firestore, 'servicos', selectedServico.id);
      deleteDocumentNonBlocking(servicoDocRef);
      toast({
        title: 'Serviço excluído',
        description: `O serviço "${selectedServico.descricao}" foi removido.`,
      });
    }
    setIsDeleteDialogOpen(false);
    setSelectedServico(null);
  };

  const formatCurrency = (value: number) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

  return (
    <>
      {/* Desktop Table View */}
      <div className="relative w-full overflow-auto rounded-md border hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Qtd.</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>
                <span className="sr-only">Ações</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {servicos.length > 0 ? (
              servicos.map((servico) => (
                <TableRow key={servico.id}>
                  <TableCell className="font-medium">{servico.codigo}</TableCell>
                  <TableCell>{servico.descricao}</TableCell>
                  <TableCell>{servico.quantidade}</TableCell>
                  <TableCell>{formatCurrency(servico.valorPadrao)}</TableCell>
                  <TableCell>
                    <Badge variant={servico.ativo ? 'default' : 'outline'} className="text-xs">
                        {servico.ativo ? 'Ativo' : 'Inativo'}
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
                        <DropdownMenuItem onClick={() => handleEditClick(servico)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive focus:bg-destructive/10"
                          onClick={() => handleDeleteClick(servico)}
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
                <TableCell colSpan={6} className="h-24 text-center">
                  Nenhum serviço encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

       {/* Mobile Card View */}
      <div className="grid grid-cols-1 gap-4 md:hidden">
         {servicos.length > 0 ? (
              servicos.map((servico) => (
                <Card key={servico.id} className="w-full">
                    <CardContent className="p-4 flex flex-col space-y-2">
                         <div className="flex justify-between items-start">
                             <div>
                                <p className="font-bold text-base">{servico.descricao}</p>
                                <p className="text-sm text-muted-foreground">{servico.codigo}</p>
                             </div>
                             <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button aria-haspopup="true" size="icon" variant="ghost">
                                    <MoreHorizontal className="h-4 w-4" />
                                    <span className="sr-only">Toggle menu</span>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                    <DropdownMenuItem onClick={() => handleEditClick(servico)}>
                                        <Pencil className="mr-2 h-4 w-4" />
                                        Editar
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                    className="text-destructive focus:text-destructive focus:bg-destructive/10"
                                    onClick={() => handleDeleteClick(servico)}
                                    >
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Excluir
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>

                        <div className="flex justify-between items-center text-sm pt-2">
                           <div className="text-muted-foreground">Status</div>
                           <div>
                                <Badge variant={servico.ativo ? 'default' : 'outline'} className="text-xs">
                                    {servico.ativo ? 'Ativo' : 'Inativo'}
                                </Badge>
                           </div>
                        </div>
                        
                        <div className="flex justify-between items-center text-sm">
                           <div className="text-muted-foreground">Qtd.</div>
                           <div>{servico.quantidade}</div>
                        </div>

                        <div className="flex justify-between items-center text-sm">
                           <div className="text-muted-foreground">Valor</div>
                           <div className="font-semibold">{formatCurrency(servico.valorPadrao)}</div>
                        </div>
                    </CardContent>
                </Card>
              ))
            ) : (
                <div className="text-center text-muted-foreground p-8">
                    Nenhum serviço encontrado.
                </div>
            )}
      </div>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso excluirá permanentemente o serviço.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={handleDeleteConfirm}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Editar Serviço</DialogTitle>
            <DialogDescription>
              Altere os dados do serviço abaixo. Clique em salvar quando terminar.
            </DialogDescription>
          </DialogHeader>
          {selectedServico && (
            <EditServicoForm
              servico={selectedServico}
              setDialogOpen={setIsEditDialogOpen}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

    