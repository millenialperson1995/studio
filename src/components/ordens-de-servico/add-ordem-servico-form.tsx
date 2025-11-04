'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useFieldArray } from 'react-hook-form';
import { z } from 'zod';
import React, { useState, useMemo, useEffect } from 'react';
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
import { collection, serverTimestamp, doc, runTransaction, Transaction } from 'firebase/firestore';
import { useFirestore, useUser } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import type { Cliente, Veiculo, Peca, Servico } from '@/lib/types';
import { Trash2, PlusCircle, CalendarIcon } from 'lucide-react';
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


type AddOrdemServicoFormProps = {
  clients: Cliente[];
  vehicles: Veiculo[];
  pecas: Peca[];
  servicos: Servico[];
  setDialogOpen: (open: boolean) => void;
};

export function AddOrdemServicoForm({
  clients,
  vehicles,
  pecas,
  servicos,
  setDialogOpen,
}: AddOrdemServicoFormProps) {
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const [selectedClientId, setSelectedClientId] = useState('');
  
  const pecasMap = new Map(pecas.map(p => [p.id, p]));

  const formSchema = z.object({
    clienteId: z.string().min(1, 'Selecione um cliente.'),
    veiculoId: z.string().min(1, 'Selecione um veículo.'),
    clienteNome: z.string(), // Denormalized
    veiculoInfo: z.string(), // Denormalized
    dataEntrada: z.date({ required_error: 'A data de entrada é obrigatória.' }),
    dataPrevisao: z.date({ required_error: 'A data de previsão é obrigatória.' }),
    status: z.enum(['pendente', 'andamento', 'concluida', 'cancelada']),
    statusPagamento: z.enum(['Pendente', 'Pago', 'Vencido']),
    mecanicoResponsavel: z.string().min(1, 'Informe o mecânico responsável.'),
    observacoes: z.string().optional(),
    servicos: z.array(servicoSchema),
    pecas: z.array(pecaSchema)
    .superRefine((pecas, ctx) => {
        pecas.forEach((item, index) => {
          if (item.itemId) {
            const peca = pecasMap.get(item.itemId);
            if (peca) {
              const estoqueDisponivel = peca.quantidadeEstoque - (peca.quantidadeReservada || 0);
              if (item.quantidade > estoqueDisponivel) {
                ctx.addIssue({
                  code: z.ZodIssueCode.custom,
                  message: `Estoque indisponível. Disponível: ${estoqueDisponivel}`,
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
      clienteId: '',
      veiculoId: '',
      clienteNome: '',
      veiculoInfo: '',
      dataEntrada: new Date(),
      dataPrevisao: new Date(new Date().setDate(new Date().getDate() + 7)),
      status: 'pendente',
      statusPagamento: 'Pendente',
      mecanicoResponsavel: '',
      observacoes: '',
      servicos: [],
      pecas: [],
      valorTotal: 0,
    },
  });

  const { fields: servicosFields, append: appendServico, remove: removeServico, update: updateServico } = useFieldArray({ control: form.control, name: 'servicos' });
  const { fields: pecasFields, append: appendPeca, remove: removePeca, update: updatePeca } = useFieldArray({ control: form.control, name: 'pecas' });

  const watchedServicos = form.watch('servicos');
  const watchedPecas = form.watch('pecas');
  
  const selectedItemIds = useMemo(() => {
    // For services, we use description as a unique key if no ID is present
    const servicosIds = watchedServicos.map(s => s.descricao); 
    const pecasIds = watchedPecas.map(p => p.itemId).filter(Boolean) as string[];
    // A service might not have an ID if manually typed, so we use description as a temp key
    const allServicos = servicos.map(s => s.id)
    return [...pecasIds, ...allServicos];
  }, [watchedServicos, watchedPecas, servicos]);


  useEffect(() => {
    const totalServicos = watchedServicos.reduce((sum, servico) => sum + (Number(servico.valor) || 0), 0);
    const totalPecas = watchedPecas.reduce((sum, peca) => sum + ((Number(peca.quantidade) || 0) * (Number(peca.valorUnitario) || 0)), 0);
    form.setValue('valorTotal', totalServicos + totalPecas);
  }, [watchedServicos, watchedPecas, form]);

  const valorTotal = form.watch('valorTotal');


  const filteredVehicles = vehicles.filter(
    (v) => v.clienteId === selectedClientId
  );

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!firestore || !user) return;
    
    try {
        await runTransaction(firestore, async (transaction: Transaction) => {
            // 1. Reserve all parts and check stock
            for (const itemPeca of values.pecas) {
                if (!itemPeca.itemId) continue; // Skip manually added parts without an ID
                
                const pecaRef = doc(firestore, 'pecas', itemPeca.itemId);
                const pecaDoc = await transaction.get(pecaRef);

                if (!pecaDoc.exists()) {
                    throw new Error(`A peça ${itemPeca.descricao} não foi encontrada no estoque.`);
                }
                const pecaData = pecaDoc.data() as Peca;
                const estoqueDisponivel = pecaData.quantidadeEstoque - (pecaData.quantidadeReservada || 0);
                if (itemPeca.quantidade > estoqueDisponivel) {
                    throw new Error(`Estoque insuficiente para: ${pecaData.descricao}. Disponível: ${estoqueDisponivel}, solicitado: ${itemPeca.quantidade}.`);
                }
                // Reserve the part
                transaction.update(pecaRef, {
                    quantidadeReservada: (pecaData.quantidadeReservada || 0) + itemPeca.quantidade
                });
            }

            // 2. Create the Service Order
            const osCollectionRef = collection(firestore, 'ordensServico');
            const newOSRef = doc(osCollectionRef);

            const osData = {
                ...values,
                id: newOSRef.id,
                userId: user.uid,
                valorTotal: values.valorTotal,
                createdAt: serverTimestamp()
            };
            
            transaction.set(newOSRef, osData);
        });

        toast({
            title: 'Sucesso!',
            description: 'Ordem de Serviço criada e estoque reservado com sucesso.',
        });
        form.reset();
        setDialogOpen(false);

    } catch (error: any) {
      console.error('Error adding document: ', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao Criar OS',
        description: error.message || 'Não foi possível criar a Ordem de Serviço. Tente novamente.',
        duration: 7000,
      });
    }
  }

  const handleItemSelect = (item: Peca | Servico, type: 'peca' | 'servico') => {
    if (type === 'servico') {
        appendServico({
            descricao: item.descricao,
            valor: (item as Servico).valorPadrao,
        })
    } else { // type === 'peca'
        appendPeca({
            itemId: item.id,
            descricao: item.descricao,
            valorUnitario: (item as Peca).valorVenda,
            quantidade: 1,
        })
    }
  }


  const handleClientChange = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    if(client) {
        form.setValue('clienteId', clientId);
        form.setValue('clienteNome', client.nome);
        setSelectedClientId(clientId);
        form.setValue('veiculoId', ''); // Reset vehicle
        form.setValue('veiculoInfo', '');
    }
  }
  
  const handleVehicleChange = (vehicleId: string) => {
    const vehicle = vehicles.find(v => v.id === vehicleId);
    if(vehicle) {
        form.setValue('veiculoId', vehicleId);
        form.setValue('veiculoInfo', `${vehicle.fabricante} ${vehicle.modelo} (${vehicle.placa})`);
    }
  }


  return (
    <Form {...form}>
       <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="pr-4 space-y-6 h-[calc(80vh-8rem)] overflow-y-auto">
        <div className="flex flex-col md:flex-row gap-4">
          <FormField
            control={form.control}
            name="clienteId"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel>Cliente</FormLabel>
                <Select
                  onValueChange={handleClientChange}
                  defaultValue={field.value}
                >
                  <FormControl><SelectTrigger><SelectValue placeholder="Selecione um cliente" /></SelectTrigger></FormControl>
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
                <Select onValueChange={handleVehicleChange} value={field.value} disabled={!selectedClientId}>
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

        <div className="space-y-4 rounded-md border p-4">
            <div className="flex justify-between items-center">
                <h3 className="font-medium">Serviços e Peças</h3>
                <ItemSelector
                    pecas={pecas}
                    servicos={servicos}
                    onSelect={handleItemSelect}
                    selectedItemIds={selectedItemIds}
                />
            </div>
            {servicosFields.length > 0 && <h4 className="text-sm font-medium text-muted-foreground">Serviços</h4>}
            {servicosFields.map((field, index) => (
              <div key={field.id} className="flex flex-col md:flex-row items-end gap-2 border-b md:border-none pb-4 md:pb-0 mb-4 md:mb-0">
                <div className="flex-1 w-full">
                  <FormLabel className={cn(index !== 0 && "md:hidden", "text-xs md:hidden")}>Descrição</FormLabel>
                   <FormField control={form.control} name={`servicos.${index}.descricao`} render={({ field }) => (
                        <FormItem>
                           <FormControl>
                                <Input placeholder="Digite um serviço" {...field} />
                            </FormControl>
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
            {pecasFields.length > 0 && <h4 className="text-sm font-medium text-muted-foreground pt-4">Peças</h4>}
            {pecasFields.map((field, index) => (
              <div key={field.id} className="grid grid-cols-12 gap-x-2 gap-y-2 items-start border-b pb-4 mb-4 md:border-none md:pb-0 md:mb-2">
                <div className="col-span-12 md:col-span-5">
                  <FormLabel className="text-xs md:hidden">Descrição</FormLabel>
                   <FormField control={form.control} name={`pecas.${index}.descricao`} render={({ field }) => (
                        <FormItem>
                            <FormControl>
                                <Input placeholder="Digite uma peça" {...field} />
                            </FormControl>
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
        </div>

        <FormField control={form.control} name="observacoes" render={({ field }) => (
            <FormItem><FormLabel>Observações</FormLabel>
              <FormControl><Textarea placeholder="Detalhes adicionais, condições, etc." className="resize-none" {...field}/></FormControl>
              <FormMessage />
            </FormItem>)}
        />
        </div>
        
        <div className="flex flex-col-reverse sm:flex-row items-center justify-between pt-4 border-t">
            <div className="text-lg font-semibold mt-4 sm:mt-0">
                <span>Valor Total: </span>
                <span>{valorTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
            </div>
            <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Salvando...' : 'Salvar Ordem de Serviço'}
            </Button>
        </div>
      </form>
    </Form>
  );
}
