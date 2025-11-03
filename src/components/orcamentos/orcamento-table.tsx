'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
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
import { MoreHorizontal, Pencil, Trash2, FilePlus2, FileDown, Loader2 } from 'lucide-react';
import type { Orcamento, Cliente, Veiculo, ItemServico, OrdemServico, Peca, Servico, Oficina } from '@/lib/types';
import { deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { doc, collection, serverTimestamp, getDoc, runTransaction, Transaction } from 'firebase/firestore';
import { useFirestore, useUser } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { EditOrcamentoForm } from './edit-orcamento-form';
import { format } from 'date-fns';
import { generateOrcamentoPDF } from '@/lib/pdf-generator';

interface OrcamentoTableProps {
  orcamentos: Orcamento[];
  clients: Cliente[];
  vehicles: Veiculo[];
  servicos: Servico[];
  pecas: Peca[];
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
  servicos = [],
  pecas = [],
}: OrcamentoTableProps) {
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const router = useRouter();


  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedOrcamento, setSelectedOrcamento] = useState<Orcamento | null>(
    null
  );
  const [isGeneratingOS, setIsGeneratingOS] = useState<string | null>(null);

  const clientsMap = useMemo(() => new Map(clients.map((c) => [c.id, c])), [clients]);
  const vehiclesMap = useMemo(() => new Map(vehicles.map((v) => [v.id, v])), [vehicles]);


  const handleEditClick = (orcamento: Orcamento) => {
    setSelectedOrcamento(orcamento);
    setIsEditDialogOpen(true);
  };

  const handleDeleteClick = (orcamento: Orcamento) => {
    setSelectedOrcamento(orcamento);
    setIsDeleteDialogOpen(true);
  };

  const handleDownloadPDF = async (orcamento: Orcamento) => {
    if (!firestore || !user) return;
    
    const cliente = clientsMap.get(orcamento.clienteId);
    const veiculo = vehiclesMap.get(orcamento.veiculoId);
    
    try {
      const oficinaDocRef = doc(firestore, 'oficinas', user.uid);
      const oficinaSnap = await getDoc(oficinaDocRef);
      const oficina = oficinaSnap.exists() ? (oficinaSnap.data() as Oficina) : null;
      
      if (cliente && veiculo) {
        generateOrcamentoPDF(orcamento, cliente, veiculo, oficina);
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
    if (selectedOrcamento && firestore) {
      if (selectedOrcamento.status === 'aprovado' && !selectedOrcamento.ordemServicoId) {
          toast({
              variant: 'destructive',
              title: 'Ação Bloqueada',
              description: 'Não é possível excluir um orçamento aprovado que está aguardando a geração da OS. Cancele-o primeiro.',
              duration: 7000,
          });
          setIsDeleteDialogOpen(false);
          return;
      }
      
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
  
  const handleGenerateOS = async (orcamento: Orcamento) => {
    if (!firestore || !user || !orcamento.clienteId || orcamento.ordemServicoId) return;
    
    setIsGeneratingOS(orcamento.id);

    try {
      await runTransaction(firestore, async (transaction: Transaction) => {
        const pecasDoOrcamento = orcamento.itens.filter(item => item.tipo === 'peca' && item.itemId);
        
        // 1. Check stock availability for all parts in the transaction
        for (const itemPeca of pecasDoOrcamento) {
          if (!itemPeca.itemId) throw new Error(`A peça ${itemPeca.descricao} não possui um ID de item válido.`);
          
          const pecaRef = doc(firestore, 'pecas', itemPeca.itemId);
          const pecaDoc = await transaction.get(pecaRef);

          if (!pecaDoc.exists()) {
            throw new Error(`A peça ${itemPeca.descricao} não foi encontrada no estoque.`);
          }

          const pecaData = pecaDoc.data() as Peca;
          // Check physical stock, not available stock after reservation.
          if (pecaData.quantidadeEstoque < itemPeca.quantidade) {
            throw new Error(`Estoque insuficiente para a peça: ${pecaData.descricao}. Em estoque: ${pecaData.quantidadeEstoque}, Solicitado: ${itemPeca.quantidade}`);
          }
        }
        
        // 2. Reserve all parts
        for (const itemPeca of pecasDoOrcamento) {
            const pecaRef = doc(firestore, 'pecas', itemPeca.itemId!);
            const pecaDoc = await transaction.get(pecaRef);
            const pecaData = pecaDoc.data() as Peca;
            
            transaction.update(pecaRef, {
                quantidadeReservada: (pecaData.quantidadeReservada || 0) + itemPeca.quantidade
            });
        }
        
        // 3. Create the Service Order
        const osServicos: ItemServico[] = orcamento.itens
            .filter(item => item.tipo === 'servico')
            .map(item => ({ descricao: item.descricao, valor: item.valorTotal }));
        
        const osPecas = orcamento.itens
        .filter(item => item.tipo === 'peca')
        .map(item => ({
            itemId: item.itemId!,
            descricao: item.descricao,
            quantidade: item.quantidade,
            valorUnitario: item.valorUnitario,
        }));
        
        const osCollectionRef = collection(firestore, 'ordensServico');
        const newOSRef = doc(osCollectionRef);

        const newOrdemServico: OrdemServico = {
            id: newOSRef.id,
            userId: user.uid,
            orcamentoId: orcamento.id,
            clienteId: orcamento.clienteId,
            veiculoId: orcamento.veiculoId,
            status: 'pendente',
            statusPagamento: 'Pendente',
            dataEntrada: serverTimestamp(),
            dataPrevisao: new Date(new Date().setDate(new Date().getDate() + 7)),
            mecanicoResponsavel: 'A definir',
            servicos: osServicos,
            pecas: osPecas,
            valorTotal: orcamento.valorTotal,
            observacoes: orcamento.observacoes,
            createdAt: serverTimestamp(),
        };

        transaction.set(newOSRef, newOrdemServico);

        // 4. Update the quote status
        const orcamentoDocRef = doc(firestore, 'orcamentos', orcamento.id);
        transaction.update(orcamentoDocRef, { ordemServicoId: newOSRef.id, status: 'aprovado' });
      });

      toast({
        title: 'Sucesso!',
        description: 'Ordem de Serviço gerada e estoque reservado.',
      });
      router.push('/ordens-de-servico');

    } catch (error: any) {
        console.error("Erro ao gerar OS e reservar estoque: ", error);
        toast({
            variant: 'destructive',
            title: 'Erro ao Gerar OS',
            description: error.message || 'Não foi possível gerar a Ordem de Serviço ou reservar o estoque.',
            duration: 7000,
        });
    } finally {
        setIsGeneratingOS(null);
    }
  };

  const formatDate = (date: any) => {
      if (!date) return 'N/A';
      const jsDate = date.toDate ? date.toDate() : new Date(date);
      return format(jsDate, 'dd/MM/yyyy');
  }

  const enrichedOrcamentos = useMemo(() => {
    return orcamentos.map((orc) => ({
      ...orc,
      cliente: clientsMap.get(orc.clienteId),
      veiculo: vehiclesMap.get(orc.veiculoId),
    }));
  }, [orcamentos, clientsMap, vehiclesMap]);

  return (
    <>
      <div className="relative w-full overflow-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cliente</TableHead>
              <TableHead className="hidden md:table-cell">Veículo</TableHead>
              <TableHead className="hidden sm:table-cell">Data</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead className="hidden sm:table-cell">Status</TableHead>
              <TableHead>
                <span className="sr-only">Ações</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {enrichedOrcamentos.length > 0 ? (
              enrichedOrcamentos.map((orcamento) => (
                <TableRow key={orcamento.id}>
                  <TableCell>
                    <div className="font-medium">{orcamento.cliente?.nome || 'Desconhecido'}</div>
                     <div className="block sm:hidden text-xs text-muted-foreground">
                       {statusLabelMap[orcamento.status]}
                    </div>
                  </TableCell>
                   <TableCell className="hidden md:table-cell text-muted-foreground">{orcamento.veiculo ? `${orcamento.veiculo.fabricante} ${orcamento.veiculo.modelo}` : 'Desconhecido'}</TableCell>
                   <TableCell className="hidden sm:table-cell text-muted-foreground">{formatDate(orcamento.dataCriacao)}</TableCell>
                  <TableCell>{`R$ ${orcamento.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}</TableCell>
                   <TableCell className="hidden sm:table-cell">
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
                        <DropdownMenuItem onClick={() => handleDownloadPDF(orcamento)}>
                            <FileDown className="mr-2 h-4 w-4" />
                            Baixar PDF
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleEditClick(orcamento)}
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        {orcamento.status === 'aprovado' && (
                            <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handleGenerateOS(orcamento)} disabled={!!orcamento.ordemServicoId || isGeneratingOS === orcamento.id}>
                                    {isGeneratingOS === orcamento.id ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                        <FilePlus2 className="mr-2 h-4 w-4" />
                                    )}
                                    {orcamento.ordemServicoId ? 'OS Gerada' : (isGeneratingOS === orcamento.id ? 'Gerando...' : 'Gerar Ordem de Serviço')}
                                </DropdownMenuItem>
                            </>
                        )}
                        <DropdownMenuSeparator />
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
              vehicles={vehicles || []}
              servicos={servicos}
              pecas={pecas}
              setDialogOpen={setIsEditDialogOpen}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
