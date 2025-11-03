'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useFieldArray } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { doc, runTransaction, Transaction } from 'firebase/firestore';
import { useFirestore, useUser, useVehicles } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import type { OrdemServico, Cliente, Peca, Servico } from '@/lib/types';
import { Trash2, PlusCircle, CalendarIcon } from 'lucide-react';
import React, { useState, useEffect, useMemo } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Calendar } from '../ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ItemSelector } from '../orcamentos/item-selector';

const servicoSchema = z.object({
  descricao: z.string().min(1, 'A descrição é obrigatória.'),
  valor: z.coerce.number().min(0, 'O valor deve ser positivo.'),
});

const pecaSchema = z.object({
  itemId: z.string().optional(),
  descricao: z.string().min(1, 'A descrição é obrigatória.'),
  quantidade: z.coerce.number().min(0.1, 'A quantidade deve ser maior que 0.'),
  valorUnitario: z.coerce.number().min(0, 'O valor deve ser positivo.'),
});


type EditOrdemServicoFormProps = {
  ordemServico: OrdemServico;
  clients: Cliente[];
  pecas: Peca[];
  servicos: Servico[];
  setDialogOpen: (open: boolean) => void;
};

const toDate = (timestamp: any): Date | undefined => {
    if (!timestamp) return undefined;
    return timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
}


export function EditOrdemServicoForm({
  ordemServico,
  clients,
  pecas,
  servicos,
  setDialogOpen,
}: EditOrdemServicoFormProps) {
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const { vehicles } = useVehicles();
  const [selectedClientId, setSelectedClientId] = useState(ordemServico.clienteId);
  
  const pecasMap = new Map(pecas.map(p => [p.id, p]));

  const formSchema = z.object({
    clienteId: z.string().min(1, 'Selecione um cliente.'),
    veiculoId: z.string().min(1, 'Selecione um veículo.'),
    dataEntrada: z.date({ required_error: 'A data de entrada é obrigatória.' }),
    dataPrevisao: z.date({ required_error: 'A data de previsão é obrigatória.' }),
    dataConclusao: z.date().optional().nullable(),
    status: z.enum(['pendente', 'andamento', 'concluida', 'cancelada']),
    statusPagamento: z.enum(['Pendente', 'Pago', 'Vencido']),
    dataPagamento: z.date().optional().nullable(),
    mecanicoResponsavel: z.string().min(1, 'Informe o mecânico responsável.'),
    observacoes: z.string().optional(),
    servicos: z.array(servicoSchema),
    pecas: z.array(pecaSchema)
    .superRefine((pecas, ctx) => {
        pecas.forEach((item, index) => {
          if (item.itemId) {
            const peca = pecasMap.get(item.itemId);
            if (peca) {
              const pecaOriginal = ordemServico.pecas.find(p => p.itemId === item.itemId);
              const quantidadeOriginal = pecaOriginal?.quantidade || 0;
              // Check against physical stock, allowing for the quantity already in the OS
              if (item.quantidade > peca.quantidadeEstoque + quantidadeOriginal) {
                ctx.addIssue({
                  code: z.ZodIssueCode.custom,
                  message: `Estoque físico insuficiente. Total: ${peca.quantidadeEstoque}`,
                  path: [index, 'quantidade'],
                });
              }
            }
          }
        });
      }),
    valorTotal: z.coerce.number(),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ...ordemServico,
      dataEntrada: toDate(ordemServico.dataEntrada)!,
      dataPrevisao: toDate(ordemServico.dataPrevisao)!,
      dataConclusao: toDate(ordemServico.dataConclusao),
      dataPagamento: toDate(ordemServico.dataPagamento),
    },
  });

  const { fields: servicosFields, append: appendServico, remove: removeServico, update: updateServico } = useFieldArray({ control: form.control, name: 'servicos' });
  const { fields: pecasFields, append: appendPeca, remove: removePeca, update: updatePeca } = useFieldArray({ control: form.control, name: 'pecas' });

  const watchedServicos = form.watch('servicos');
  const watchedPecas = form.watch('pecas');
  const statusValue = form.watch('status');
  const paymentStatus = form.watch('statusPagamento');

  const selectedItemIds = useMemo(() => {
    const servicosIds = watchedServicos.map(s => s.descricao);
    const pecasIds = watchedPecas.map(p => p.itemId).filter(Boolean) as string[];
    return [...servicosIds, ...pecasIds];
  }, [watchedServicos, watchedPecas]);

   useEffect(() => {
    if (statusValue === 'concluida' && !form.getValues('dataConclusao')) {
      form.setValue('dataConclusao', new Date());
    }
     if (paymentStatus === 'Pago' && !form.getValues('dataPagamento')) {
      form.setValue('dataPagamento', new Date());
    }
  }, [statusValue, paymentStatus, form]);


  const totalValue = React.useMemo(() => {
    const totalServicos = watchedServicos.reduce((sum, servico) => sum + (servico.valor || 0), 0);
    const totalPecas = watchedPecas.reduce((sum, peca) => sum + ((peca.quantidade || 0) * (peca.valorUnitario || 0)), 0);
    const newTotal = totalServicos + totalPecas;
     if (form.getValues('valorTotal') !== newTotal) {
        form.setValue('valorTotal', newTotal);
    }
    return newTotal;
  }, [watchedServicos, watchedPecas, form]);


  const filteredVehicles = vehicles.filter(
    (v) => v.clienteId === selectedClientId
  );

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!firestore || !user) return;

    try {
        await runTransaction(firestore, async (transaction: Transaction) => {
            const ordemDocRef = doc(firestore, 'ordensServico', ordemServico.id);
            const originalOrdemDoc = await transaction.get(ordemDocRef);
            if (!originalOrdemDoc.exists()) {
                throw new Error("Ordem de serviço não encontrada.");
            }
            const originalOrdem = originalOrdemDoc.data() as OrdemServico;

            // Logic for status change
            const isChangingToConcluida = values.status === 'concluida' && originalOrdem.status !== 'concluida';
            const isChangingFromConcluida = values.status !== 'concluida' && originalOrdem.status === 'concluida';
            const isChangingToCancelada = values.status === 'cancelada' && originalOrdem.status !== 'cancelada';

            // From any status to "CONCLUÍDA"
            if (isChangingToConcluida) {
                for (const itemPeca of originalOrdem.pecas) {
                    if (!itemPeca.itemId) continue;
                    const pecaRef = doc(firestore, 'pecas', itemPeca.itemId);
                    const pecaDoc = await transaction.get(pecaRef);
                    if(pecaDoc.exists()){
                        const pecaData = pecaDoc.data() as Peca;
                        transaction.update(pecaRef, {
                            quantidadeEstoque: pecaData.quantidadeEstoque - itemPeca.quantidade,
                            quantidadeReservada: Math.max(0, (pecaData.quantidadeReservada || 0) - itemPeca.quantidade)
                        });
                    }
                }
            }
            // From "CONCLUÍDA" back to something else (e.g., "em andamento")
            else if (isChangingFromConcluida) {
                 for (const itemPeca of originalOrdem.pecas) {
                    if (!itemPeca.itemId) continue;
                    const pecaRef = doc(firestore, 'pecas', itemPeca.itemId);
                    const pecaDoc = await transaction.get(pecaRef);
                    if(pecaDoc.exists()){
                        const pecaData = pecaDoc.data() as Peca;
                        transaction.update(pecaRef, {
                            quantidadeEstoque: pecaData.quantidadeEstoque + itemPeca.quantidade,
                            quantidadeReservada: (pecaData.quantidadeReservada || 0) + itemPeca.quantidade
                        });
                    }
                }
            }
            // From "PENDENTE" or "ANDAMENTO" to "CANCELADA"
            else if (isChangingToCancelada && originalOrdem.orcamentoId) { 
                 for (const itemPeca of originalOrdem.pecas) {
                    if (!itemPeca.itemId) continue;
                    const pecaRef = doc(firestore, 'pecas', itemPeca.itemId);
                    const pecaDoc = await transaction.get(pecaRef);
                    if(pecaDoc.exists()){
                        const pecaData = pecaDoc.data() as Peca;
                         transaction.update(pecaRef, {
                            // On cancel, just un-reserve, don't touch physical stock
                            quantidadeReservada: Math.max(0, (pecaData.quantidadeReservada || 0) - itemPeca.quantidade)
                        });
                    }
                }
            }

            const finalValues = {
                ...values,
                dataConclusao: values.status === 'concluida' ? (values.dataConclusao || new Date()) : null,
                dataPagamento: values.statusPagamento === 'Pago' ? (values.dataPagamento || new Date()) : null,
            };

            transaction.update(ordemDocRef, finalValues);
        });

        toast({
            title: 'Sucesso!',
            description: 'Ordem de Serviço atualizada com sucesso.',
        });
        form.reset();
        setDialogOpen(false);

    } catch (error: any) {
        console.error('Error updating service order: ', error);
        toast({
            variant: 'destructive',
            title: 'Erro',
            description: error.message || 'Não foi possível atualizar a Ordem de Serviço. Tente novamente.',
            duration: 7000,
        });
    }
  }

  const handleItemSelect = (index: number, item: Peca | Servico, type: 'peca' | 'servico', itemType: 'servicos' | 'pecas') => {
    if (itemType === 'servicos') {
        updateServico(index, {
            ...form.getValues(`servicos.${index}`),
            descricao: item.descricao,
            valor: (item as Servico).valorPadrao,
        })
    } else { // itemType === 'pecas'
        updatePeca(index, {
            ...form.getValues(`pecas.${index}`),
            itemId: item.id,
            descricao: item.descricao,
            valorUnitario: (item as Peca).valorVenda,
            quantidade: 1,
        })
    }
  }


  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-h-[80vh] overflow-y-auto p-1 pr-4">
         <div className="flex flex-col md:flex-row gap-4">
          <FormField
            control={form.control}
            name="clienteId"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel>Cliente</FormLabel>
                <Select
                  onValueChange={(value) => {
                    field.onChange(value);
                    setSelectedClientId(value);
                    form.setValue('veiculoId', '');
                  }}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger><SelectValue placeholder="Selecione um cliente" /></SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>{client.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="veiculoId"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel>Veículo</FormLabel>
                <Select onValueChange={field.onChange} value={field.value} disabled={!selectedClientId}>
                  <FormControl>
                    <SelectTrigger><SelectValue placeholder="Selecione um veículo" /></SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {filteredVehicles.map((vehicle) => (
                      <SelectItem key={vehicle.id} value={vehicle.id}>
                        {`${vehicle.fabricante} ${vehicle.modelo} (${vehicle.placa})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex flex-col md:flex-row gap-4">
            <FormField name="dataEntrada" control={form.control} render={({ field }) => (
                <FormItem className="flex flex-col flex-1"><FormLabel>Data de Entrada</FormLabel>
                    <Popover><PopoverTrigger asChild><FormControl>
                        <Button variant={'outline'} className={cn('w-full pl-3 text-left font-normal',!field.value && 'text-muted-foreground')}>
                            {field.value ? format(field.value, 'PPP') : <span>Escolha uma data</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                    </FormControl></PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus/>
                    </PopoverContent></Popover><FormMessage />
                </FormItem>)}
            />
            <FormField name="dataPrevisao" control={form.control} render={({ field }) => (
                <FormItem className="flex flex-col flex-1"><FormLabel>Previsão de Conclusão</FormLabel>
                    <Popover><PopoverTrigger asChild><FormControl>
                        <Button variant={'outline'} className={cn('w-full pl-3 text-left font-normal',!field.value && 'text-muted-foreground')}>
                            {field.value ? format(field.value, 'PPP') : <span>Escolha uma data</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                    </FormControl></PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={(date) => date < form.getValues('dataEntrada')} initialFocus/>
                    </PopoverContent></Popover><FormMessage />
                </FormItem>)}
            />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField control={form.control} name="mecanicoResponsavel" render={({ field }) => (
                <FormItem className="flex-1"><FormLabel>Mecânico Responsável</FormLabel>
                <FormControl><Input placeholder="Nome do mecânico" {...field} /></FormControl>
                <FormMessage /></FormItem>)}
            />
            <FormField control={form.control} name="status" render={({ field }) => (
              <FormItem className="flex-1"><FormLabel>Status do Serviço</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Selecione o status" /></SelectTrigger></FormControl>
                  <SelectContent>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="andamento">Em Andamento</SelectItem>
                    <SelectItem value="concluida">Concluída</SelectItem>
                    <SelectItem value="cancelada">Cancelada</SelectItem>
                  </SelectContent>
                </Select><FormMessage />
              </FormItem>)}
            />
            <FormField control={form.control} name="statusPagamento" render={({ field }) => (
              <FormItem className="flex-1"><FormLabel>Status do Pagamento</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Selecione o status" /></SelectTrigger></FormControl>
                  <SelectContent>
                    <SelectItem value="Pendente">Pendente</SelectItem>
                    <SelectItem value="Pago">Pago</SelectItem>
                    <SelectItem value="Vencido">Vencido</SelectItem>
                  </SelectContent>
                </Select><FormMessage />
              </FormItem>)}
            />
        </div>

        {form.watch('status') === 'concluida' && (
             <FormField name="dataConclusao" control={form.control} render={({ field }) => (
                <FormItem className="flex flex-col"><FormLabel>Data de Conclusão</FormLabel>
                    <Popover><PopoverTrigger asChild><FormControl>
                        <Button variant={'outline'} className={cn('w-full pl-3 text-left font-normal',!field.value && 'text-muted-foreground')}>
                            {field.value ? format(field.value, 'PPP') : <span>Escolha uma data</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                    </FormControl></PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={field.value || undefined} onSelect={field.onChange} disabled={(date) => date < form.getValues('dataEntrada')} initialFocus/>
                    </PopoverContent></Popover><FormMessage />
                </FormItem>)}
            />
        )}
        {form.watch('statusPagamento') === 'Pago' && (
             <FormField name="dataPagamento" control={form.control} render={({ field }) => (
                <FormItem className="flex flex-col"><FormLabel>Data de Pagamento</FormLabel>
                    <Popover><PopoverTrigger asChild><FormControl>
                        <Button variant={'outline'} className={cn('w-full pl-3 text-left font-normal',!field.value && 'text-muted-foreground')}>
                            {field.value ? format(field.value, 'PPP') : <span>Escolha uma data</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                    </FormControl></PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={field.value || undefined} onSelect={field.onChange} initialFocus/>
                    </PopoverContent></Popover><FormMessage />
                </FormItem>)}
            />
        )}


        <div className="space-y-4 rounded-md border p-4">
          <h3 className="font-medium">Serviços</h3>
          {servicosFields.map((field, index) => (
              <div key={field.id} className="flex flex-col md:flex-row items-end gap-2 border-b md:border-none pb-4 md:pb-0 mb-4 md:mb-0">
                <div className="flex-1 w-full">
                  <FormLabel className={cn(index !== 0 && "md:hidden", "text-xs md:hidden")}>Descrição</FormLabel>
                   <FormField control={form.control} name={`servicos.${index}.descricao`} render={({ field }) => (
                        <FormItem>
                           <ItemSelector
                                pecas={[]}
                                servicos={servicos}
                                onSelect={(item, type) => handleItemSelect(index, item, type, 'servicos')}
                                selectedItemIds={selectedItemIds}
                                trigger={
                                    <FormControl>
                                        <Input placeholder="Selecione ou digite um serviço" {...field} />
                                    </FormControl>
                                }
                            />
                           <FormMessage />
                        </FormItem>)}
                    />
                </div>
                 <div className="flex-grow-0 flex-shrink-0 basis-1/3 w-full md:w-auto">
                    <FormLabel className={cn(index !== 0 && "md:hidden", "text-xs md:hidden")}>Valor</FormLabel>
                    <FormField control={form.control} name={`servicos.${index}.valor`} render={({ field }) => (
                        <FormItem><FormControl><Input type="number" placeholder="400.00" {...field} /></FormControl><FormMessage /></FormItem>)}
                    />
                </div>
                <div className="w-full md:w-auto">
                    <Button type="button" variant="destructive" size="icon" onClick={() => removeServico(index)} className="w-full md:w-10 h-10">
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Remover Serviço</span>
                    </Button>
                </div>
              </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={() => appendServico({ descricao: '', valor: 0 })}>
            <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Serviço
          </Button>
        </div>

        <div className="space-y-4 rounded-md border p-4">
          <h3 className="font-medium">Peças</h3>
          {pecasFields.length > 0 && (
            <div className="hidden md:grid grid-cols-12 gap-x-2 text-sm font-medium text-muted-foreground px-1">
                <div className="col-span-5">Item/Descrição</div>
                <div className="col-span-2">Qtd.</div>
                <div className="col-span-2">Vlr. Unitário</div>
                <div className="col-span-2">Subtotal</div>
            </div>
          )}
          {pecasFields.map((field, index) => (
              <div key={field.id} className="grid grid-cols-12 gap-x-2 gap-y-2 items-start border-b pb-4 mb-4 md:border-none md:pb-0 md:mb-2">
                <div className="col-span-12 md:col-span-5">
                  <FormLabel className="text-xs md:hidden">Descrição</FormLabel>
                   <FormField control={form.control} name={`pecas.${index}.descricao`} render={({ field }) => (
                        <FormItem>
                            <ItemSelector
                                pecas={pecas}
                                servicos={[]}
                                onSelect={(item, type) => handleItemSelect(index, item, type, 'pecas')}
                                selectedItemIds={selectedItemIds}
                                trigger={
                                    <FormControl>
                                        <Input placeholder="Selecione ou digite uma peça" {...field} />
                                    </FormControl>
                                }
                            />
                            <FormMessage />
                        </FormItem>)}
                    />
                </div>
                 <div className="col-span-4 md:col-span-2">
                    <FormLabel className="text-xs md:hidden">Qtd.</FormLabel>
                    <FormField control={form.control} name={`pecas.${index}.quantidade`} render={({ field }) => (
                        <FormItem><FormControl><Input type="number" placeholder="1" {...field} /></FormControl><FormMessage /></FormItem>)}
                    />
                </div>
                <div className="col-span-4 md:col-span-2">
                    <FormLabel className="text-xs md:hidden">Vlr. Unitário</FormLabel>
                    <FormField control={form.control} name={`pecas.${index}.valorUnitario`} render={({ field }) => (
                        <FormItem><FormControl><Input type="number" placeholder="100.00" {...field} /></FormControl><FormMessage /></FormItem>)}
                    />
                </div>
                <div className="col-span-4 md:col-span-2">
                     <FormLabel className="text-xs md:hidden">Subtotal</FormLabel>
                    <Input readOnly disabled value={((form.watch(`pecas.${index}.quantidade`) || 0) * (form.watch(`pecas.${index}.valorUnitario`) || 0)).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} />
                </div>
                <div className="col-span-12 md:col-span-1 flex items-end h-full">
                    <Button type="button" variant="destructive" size="icon" onClick={() => removePeca(index)} className="w-full h-10">
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Remover Peça</span>
                    </Button>
                </div>
              </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={() => appendPeca({ descricao: '', quantidade: 1, valorUnitario: 0, itemId: '' })}>
            <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Peça
          </Button>
        </div>
        
        <FormField control={form.control} name="observacoes" render={({ field }) => (
            <FormItem><FormLabel>Observações</FormLabel>
              <FormControl><Textarea placeholder="Detalhes adicionais, condições, etc." className="resize-none" {...field}/></FormControl>
              <FormMessage />
            </FormItem>)}
        />
        
        <div className="flex flex-col-reverse sm:flex-row items-center justify-between pt-4 sticky bottom-0 bg-background/95 pb-4">
            <div className="text-lg font-semibold mt-4 sm:mt-0">
                <span>Valor Total: </span>
                <span>{totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
            </div>
            <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
        </div>
      </form>
    </Form>
  );
}
