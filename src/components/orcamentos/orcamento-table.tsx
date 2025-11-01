'use client';

import { useState, useMemo } from 'react';
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
import type { Orcamento, Cliente, Veiculo } from '@/lib/types';
import { deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { doc } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { EditOrcamentoForm } from './edit-orcamento-form';
import { format } from 'date-fns';

interface OrcamentoTableProps {
  orcamentos: Orcamento[];
  clients: Cliente[];
  vehicles: Veiculo[];
}

const statusVariantMap: { [key: string]: 'default' | 'secondary' | 'destructive' | 'outline' } = {
  aprovado: 'default',
  rejeitado: 'destructive',
  pendente: 'outline',
};

const statusLabelMap: { [key: string]: string } = {
  pendente: 'Pendente',
  aprovado: 'Aprovado',
  rejeitado: 'Rejeitado',
};


export default function OrcamentoTable({
  orcamentos = [],
  clients = [],
  vehicles = [],
}: OrcamentoTableProps) {
  const firestore = useFirestore();
  const { toast } = useToast();

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedOrcamento, setSelectedOrcamento] = useState<Orcamento | null>(
    null
  );

  const clientsMap = useMemo(() => new Map(clients.map((c) => [c.id, c.nome])), [clients]);
  const vehiclesMap = useMemo(() => new Map(vehicles.map((v) => [v.id, `${v.marca} ${v.modelo} (${v.placa})`])), [vehicles]);

  const handleEditClick = (orcamento: Orcamento) => {
    setSelectedOrcamento(orcamento);
    setIsEditDialogOpen(true);
  };

  const handleDeleteClick = (orcamento: Orcamento) => {
    setSelectedOrcamento(orcamento);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (selectedOrcamento && firestore) {
      const orcamentoDocRef = doc(firestore, 'orcamentos', selectedOrcamento.id);
      deleteDocumentNonBlocking(orcamentoDocRef);
      toast({
        title: 'Orçamento excluído',
        description: `O orçamento foi removido com sucesso.`,
      });
    }
    setIsDeleteDialogOpen(false);
    setSelectedOrcamento(null);
  };
  
  const formatDate = (date: any) => {
      if (!date) return 'N/A';
      // It might be a Firestore Timestamp, so convert to Date
      const jsDate = date.toDate ? date.toDate() : new Date(date);
      return format(jsDate, 'dd/MM/yyyy');
  }

  const enrichedOrcamentos = useMemo(() => {
    return orcamentos.map((orc) => ({
      ...orc,
      clienteNome: clientsMap.get(orc.clienteId) || 'Desconhecido',
      veiculoDesc: vehiclesMap.get(orc.veiculoId) || 'Desconhecido',
    }));
  }, [orcamentos, clientsMap, vehiclesMap]);

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cliente</TableHead>
              <TableHead className="hidden md:table-cell">Veículo</TableHead>
              <TableHead className="hidden sm:table-cell">Data</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>
                <span className="sr-only">Ações</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {enrichedOrcamentos.length > 0 ? (
              enrichedOrcamentos.map((orcamento) => (
                <TableRow key={orcamento.id}>
                  <TableCell className="font-medium">{orcamento.clienteNome}</TableCell>
                   <TableCell className="hidden md:table-cell text-muted-foreground">{orcamento.veiculoDesc}</TableCell>
                   <TableCell className="hidden sm:table-cell text-muted-foreground">{formatDate(orcamento.dataCriacao)}</TableCell>
                  <TableCell>{`R$ ${orcamento.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}</TableCell>
                   <TableCell>
                    <Badge variant={statusVariantMap[orcamento.status]} className="text-xs">
                        {statusLabelMap[orcamento.status]}
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
                        <DropdownMenuItem
                          onClick={() => handleEditClick(orcamento)}
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive focus:bg-destructive/10"
                          onClick={() => handleDeleteClick(orcamento)}
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
                  Nenhum orçamento encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso excluirá permanentemente o
              orçamento.
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
        <DialogContent className="sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>Editar Orçamento</DialogTitle>
            <DialogDescription>
              Altere os dados do orçamento abaixo.
            </DialogDescription>
          </DialogHeader>
          {selectedOrcamento && (
            <EditOrcamentoForm
              orcamento={selectedOrcamento}
              clients={clients}
              vehicles={vehicles}
              setDialogOpen={setIsEditDialogOpen}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
