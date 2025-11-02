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
  DropdownMenuSeparator,
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
import { MoreHorizontal, Pencil, Trash2, DollarSign, FileDown } from 'lucide-react';
import type { OrdemServico, Cliente, Veiculo, Peca, Servico, Oficina } from '@/lib/types';
import { deleteDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { doc, getDoc, serverTimestamp } from 'firebase/firestore';
import { useFirestore, useUser } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { EditOrdemServicoForm } from './edit-ordem-servico-form';
import { format } from 'date-fns';
import { generateOrdemServicoPDF } from '@/lib/pdf-generator';

interface OrdemServicoTableProps {
  ordensServico: OrdemServico[];
  clients: Cliente[];
  vehicles: Veiculo[];
  pecas: Peca[];
  servicos: Servico[];
}

const statusVariantMap: { [key: string]: 'default' | 'secondary' | 'destructive' | 'outline' } = {
  andamento: 'default',
  concluida: 'secondary',
  pendente: 'outline',
  cancelada: 'destructive',
};

const statusLabelMap: { [key: string]: string } = {
  pendente: 'Pendente',
  andamento: 'Em Andamento',
  concluida: 'Concluída',
  cancelada: 'Cancelada',
};

const paymentStatusVariantMap: { [key: string]: 'default' | 'secondary' | 'destructive' | 'outline' } = {
    Pago: 'secondary',
    Pendente: 'outline',
    Vencido: 'destructive',
};

const paymentStatusLabelMap: { [key: string]: string } = {
    Pendente: 'Pendente',
    Pago: 'Pago',
    Vencido: 'Vencido',
};


export default function OrdemServicoTable({
  ordensServico = [],
  clients = [],
  vehicles = [],
  pecas = [],
  servicos = [],
}: OrdemServicoTableProps) {
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedOrdem, setSelectedOrdem] = useState<OrdemServico | null>(
    null
  );

  const clientsMap = useMemo(() => new Map(clients.map((c) => [c.id, c])), [clients]);
  const vehiclesMap = useMemo(() => new Map(vehicles.map((v) => [v.id, v])), [vehicles]);

  const handleEditClick = (ordem: OrdemServico) => {
    setSelectedOrdem(ordem);
    setIsEditDialogOpen(true);
  };

  const handleDeleteClick = (ordem: OrdemServico) => {
    setSelectedOrdem(ordem);
    setIsDeleteDialogOpen(true);
  };

  const handleMarkAsPaid = (ordem: OrdemServico) => {
    if (!firestore) return;
    const ordemDocRef = doc(firestore, 'ordensServico', ordem.id);
    updateDocumentNonBlocking(ordemDocRef, { 
      statusPagamento: 'Pago',
      dataPagamento: serverTimestamp() 
    });
    toast({
      title: 'Pagamento Registrado',
      description: `A ordem de serviço foi marcada como paga.`,
    });
  };

  const handleDownloadPDF = async (ordem: OrdemServico) => {
    if (!firestore || !user) return;
    
    const cliente = clientsMap.get(ordem.clienteId);
    const veiculo = vehiclesMap.get(ordem.veiculoId);
    
    try {
      const oficinaDocRef = doc(firestore, 'oficinas', user.uid);
      const oficinaSnap = await getDoc(oficinaDocRef);
      const oficina = oficinaSnap.exists() ? (oficinaSnap.data() as Oficina) : null;
      
      if (cliente && veiculo) {
        generateOrdemServicoPDF(ordem, cliente, veiculo, oficina);
        toast({
          title: 'PDF Gerado',
          description: 'O download do seu PDF foi iniciado.',
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Erro',
          description: 'Não foi possível encontrar os dados do cliente ou veículo para gerar o PDF.',
        });
      }
    } catch (error) {
       console.error("Error fetching workshop details for PDF: ", error);
       toast({
          variant: 'destructive',
          title: 'Erro ao gerar PDF',
          description: 'Não foi possível buscar as informações da oficina. Tente novamente.',
        });
    }
  };

  const handleDeleteConfirm = () => {
    if (selectedOrdem && firestore) {
      // Ordens de Serviço are now in a top-level collection
      const ordemDocRef = doc(firestore, 'ordensServico', selectedOrdem.id);
      deleteDocumentNonBlocking(ordemDocRef);
      toast({
        title: 'Ordem de Serviço excluída',
        description: `A ordem de serviço foi removida com sucesso.`,
      });
    }
    setIsDeleteDialogOpen(false);
    setSelectedOrdem(null);
  };
  
  const formatDate = (date: any) => {
      if (!date) return 'N/A';
      const jsDate = date.toDate ? date.toDate() : new Date(date);
      return format(jsDate, 'dd/MM/yyyy');
  }

  const enrichedOrdens = useMemo(() => {
    return ordensServico.map((ordem) => {
      const cliente = clientsMap.get(ordem.clienteId);
      const veiculo = vehiclesMap.get(ordem.veiculoId);
      return {
        ...ordem,
        clienteNome: cliente?.nome || 'Desconhecido',
        veiculoDesc: veiculo ? `${veiculo.fabricante} ${veiculo.modelo} (${veiculo.placa})` : 'Desconhecido',
      }
    });
  }, [ordensServico, clientsMap, vehiclesMap]);

  return (
    <>
      <div className="relative w-full overflow-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cliente</TableHead>
              <TableHead className="hidden lg:table-cell">Veículo</TableHead>
              <TableHead className="hidden md:table-cell">Valor</TableHead>
              <TableHead className="hidden sm:table-cell">Serviço</TableHead>
              <TableHead>Pagamento</TableHead>
              <TableHead>
                <span className="sr-only">Ações</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {enrichedOrdens.length > 0 ? (
              enrichedOrdens.map((ordem) => (
                <TableRow key={ordem.id}>
                  <TableCell>
                     <div className="font-medium">{ordem.clienteNome}</div>
                     <div className="text-xs text-muted-foreground">
                       OS Aberta em: {formatDate(ordem.dataEntrada)}
                    </div>
                  </TableCell>
                   <TableCell className="hidden lg:table-cell text-muted-foreground">{ordem.veiculoDesc}</TableCell>
                   <TableCell className="hidden md:table-cell">{`R$ ${ordem.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}</TableCell>
                   <TableCell className="hidden sm:table-cell">
                    <Badge variant={statusVariantMap[ordem.status]} className="text-xs">
                        {statusLabelMap[ordem.status]}
                    </Badge>
                  </TableCell>
                   <TableCell>
                    <Badge variant={paymentStatusVariantMap[ordem.statusPagamento]} className="text-xs">
                        {paymentStatusLabelMap[ordem.statusPagamento]}
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
                        <DropdownMenuItem onClick={() => handleDownloadPDF(ordem)}>
                            <FileDown className="mr-2 h-4 w-4" />
                            Baixar PDF
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleEditClick(ordem)}
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        {ordem.statusPagamento !== 'Pago' && (
                           <DropdownMenuItem onClick={() => handleMarkAsPaid(ordem)}>
                              <DollarSign className="mr-2 h-4 w-4" />
                              Marcar como Pago
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive focus:bg-destructive/10"
                          onClick={() => handleDeleteClick(ordem)}
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
                  Nenhuma ordem de serviço encontrada.
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
              Esta ação não pode ser desfeita. Isso excluirá permanentemente a
              ordem de serviço.
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
            <DialogTitle>Editar Ordem de Serviço</DialogTitle>
            <DialogDescription>
              Altere os dados da ordem de serviço abaixo.
            </DialogDescription>
          </DialogHeader>
          {selectedOrdem && (
            <EditOrdemServicoForm
              ordemServico={selectedOrdem}
              clients={clients}
              vehicles={vehicles}
              pecas={pecas}
              servicos={servicos}
              setDialogOpen={setIsEditDialogOpen}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
