'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge";
import type { OrdemServico } from '@/lib/types';
import { format } from "date-fns";
import { ScrollArea } from "../ui/scroll-area";

interface HistoricoVeiculoDialogProps {
  ordens: OrdemServico[];
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

const formatDate = (date: any) => {
    if (!date) return 'N/A';
    const jsDate = date.toDate ? date.toDate() : new Date(date);
    return format(jsDate, 'dd/MM/yyyy');
}


export default function HistoricoVeiculoDialog({ ordens }: HistoricoVeiculoDialogProps) {
    if(ordens.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-center">
                <p className="text-muted-foreground">Nenhum histórico de serviço encontrado para este veículo.</p>
            </div>
        )
    }

  return (
    <ScrollArea className="h-[60vh] mt-4">
        <Accordion type="single" collapsible className="w-full pr-4">
        {ordens.sort((a, b) => (b.dataEntrada.toDate ? b.dataEntrada.toDate() : new Date(b.dataEntrada)).getTime() - (a.dataEntrada.toDate ? a.dataEntrada.toDate() : new Date(a.dataEntrada)).getTime())
        .map((os) => (
            <AccordionItem key={os.id} value={os.id}>
            <AccordionTrigger>
                <div className="flex justify-between w-full items-center pr-4">
                    <div className="flex flex-col text-left">
                        <span className="font-semibold">OS: {os.id.substring(0,8)}...</span>
                        <span className="text-sm text-muted-foreground">Data: {formatDate(os.dataEntrada)}</span>
                    </div>
                    <div className="flex flex-col items-end">
                        <span className="font-semibold">R$ {os.valorTotal.toLocaleString('pt-BR')}</span>
                        <Badge variant={statusVariantMap[os.status]} className="text-xs mt-1">{statusLabelMap[os.status]}</Badge>
                    </div>
                </div>
            </AccordionTrigger>
            <AccordionContent>
                <div className="space-y-4 px-2">
                    <div>
                        <h4 className="font-semibold text-sm mb-2">Detalhes da OS:</h4>
                        <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
                            <li><strong>Previsão de Conclusão:</strong> {formatDate(os.dataPrevisao)}</li>
                            {os.dataConclusao && <li><strong>Data de Conclusão:</strong> {formatDate(os.dataConclusao)}</li>}
                             <li><strong>Mecânico Responsável:</strong> {os.mecanicoResponsavel}</li>
                             <li><strong>Status Pagamento:</strong> {os.statusPagamento}</li>
                        </ul>
                    </div>
                    {os.servicos.length > 0 && <div>
                        <h4 className="font-semibold text-sm mb-2">Serviços Realizados:</h4>
                        <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
                            {os.servicos.map((serv, index) => (
                                <li key={index}>{serv.descricao} - R$ {serv.valor.toLocaleString('pt-BR')}</li>
                            ))}
                        </ul>
                    </div>}
                    {os.pecas.length > 0 && <div>
                        <h4 className="font-semibold text-sm mb-2">Peças Utilizadas:</h4>
                         <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
                            {os.pecas.map((peca, index) => (
                                <li key={index}>{peca.quantidade}x {peca.descricao} - R$ {peca.valorUnitario.toLocaleString('pt-BR')} (un.)</li>
                            ))}
                        </ul>
                    </div>}
                    {os.observacoes && <div>
                        <h4 className="font-semibold text-sm mb-2">Observações:</h4>
                        <p className="text-sm text-muted-foreground">{os.observacoes}</p>
                    </div>}
                </div>
            </AccordionContent>
            </AccordionItem>
        ))}
        </Accordion>
    </ScrollArea>
  )
}
