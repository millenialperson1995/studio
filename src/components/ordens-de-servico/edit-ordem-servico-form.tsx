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
import { updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { doc } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import type { OrdemServico, Cliente, Veiculo, Peca, Servico } from '@/lib/types';
import { Trash2, PlusCircle, CalendarIcon } from 'lucide-react';
import { useState, useEffect } from 'react';
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
  descricao: z.string().min(1, 'A descrição é obrigatória.'),
  quantidade: z.coerce.number().min(0.1, 'A quantidade deve ser maior que 0.'),
  valorUnitario: z.coerce.number().min(0, 'O valor deve ser positivo.'),
});

const formSchema = z.object({
  clienteId: z.string().min(1, 'Selecione um cliente.'),
  veiculoId: z.string().min(1, 'Selecione um veículo.'),
  dataEntrada: z.date({ required_error: 'A data de entrada é obrigatória.' }),
  dataPrevisao: z.date({ required_error: 'A data de previsão é obrigatória.' }),
  dataConclusao: z.date().optional().nullable(),
  status: z.enum(['pendente', 'andamento', 'concluida', 'cancelada']),
  mecanicoResponsavel: z.string().min(1, 'Informe o mecânico responsável.'),
  observacoes: z.string().optional(),
  servicos: z.array(servicoSchema),
  pecas: z.array(pecaSchema),
  valorTotal: z.coerce.number(),
});

type EditOrdemServicoFormProps = {
  ordemServico: OrdemServico;
  clients: Cliente[];
  vehicles: Veiculo[];
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
  vehicles,
  pecas,
  servicos,
  setDialogOpen,
}: EditOrdemServicoFormProps) {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [selectedClientId, setSelectedClientId] = useState(ordemServico.clienteId);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ...ordemServico,
      dataEntrada: toDate(ordemServico.dataEntrada)!,
      dataPrevisao: toDate(ordemServico.dataPrevisao)!,
      dataConclusao: toDate(ordemServico.dataConclusao),
    },
  });

  const { fields: servicosFields, append: appendServico, remove: removeServico, update: updateServico } = useFieldArray({ control: form.control, name: 'servicos' });
  const { fields: pecasFields, append: appendPeca, remove: removePeca, update: updatePeca } = useFieldArray({ control: form.control, name: 'pecas' });

  const servicosValues = form.watch('servicos');
  const pecasValues = form.watch('pecas');

  useEffect(() => {
    const totalServicos = servicosValues.reduce((sum, servico) => sum + (servico.valor || 0), 0);
    const totalPecas = pecasValues.reduce((sum, peca) => sum + ((peca.quantidade || 0) * (peca.valorUnitario || 0)), 0);
    form.setValue('valorTotal', totalServicos + totalPecas);
  }, [servicosValues, pecasValues, form]);


  const filteredVehicles = vehicles.filter(
    (v) => v.clienteId === selectedClientId
  );

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!firestore) return;

    try {
      const ordemDocRef = doc(firestore, 'clientes', values.clienteId, 'ordensServico', ordemServico.id);
      updateDocumentNonBlocking(ordemDocRef, values);

      toast({
        title: 'Sucesso!',
        description: 'Ordem de Serviço atualizada com sucesso.',
      });
      form.reset();
      setDialogOpen(false);
    } catch (error) {
      console.error('Error updating document: ', error);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Não foi possível atualizar a Ordem de Serviço. Tente novamente.',
      });
    }
  }

    const handleItemSelect = (index: number, item: Peca | Servico, type: 'peca' | 'servico') => {
    if (type === 'servico') {
        updateServico(index, {
            ...form.getValues(`servicos.${index}`),
            descricao: item.descricao,
            valor: (item as Servico).valorPadrao,
        })
    } else { // type === 'peca'
        updatePeca(index, {
            ...form.getValues(`pecas.${index}`),
            descricao: item.descricao,
            valorUnitario: (item as Peca).valorVenda,
        })
    }
  }


  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-h-[80vh] overflow-y-auto p-1 pr-4">
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="clienteId"
            render={({ field }) => (
              <FormItem>
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
              <FormItem>
                <FormLabel>Veículo</FormLabel>
                <Select onValueChange={field.onChange} value={field.value} disabled={!selectedClientId}>
                  <FormControl>
                    <SelectTrigger><SelectValue placeholder="Selecione um veículo" /></SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {filteredVehicles.map((vehicle) => (
                      <SelectItem key={vehicle.id} value={vehicle.id}>
                        {`${vehicle.marca} ${vehicle.modelo} (${vehicle.placa})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField name="dataEntrada" control={form.control} render={({ field }) => (
                <FormItem className="flex flex-col"><FormLabel>Data de Entrada</FormLabel>
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
                <FormItem className="flex flex-col"><FormLabel>Previsão de Conclusão</FormLabel>
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

         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField control={form.control} name="mecanicoResponsavel" render={({ field }) => (
                <FormItem><FormLabel>Mecânico Responsável</FormLabel>
                <FormControl><Input placeholder="Nome do mecânico" {...field} /></FormControl>
                <FormMessage /></FormItem>)}
            />
            <FormField control={form.control} name="status" render={({ field }) => (
              <FormItem><FormLabel>Status</FormLabel>
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


        <div className="space-y-4 rounded-md border p-4">
          <h3 className="font-medium">Serviços</h3>
          {servicosFields.map((field, index) => (
              <div key={field.id} className="grid grid-cols-12 gap-x-2 gap-y-4 items-start">
                <div className="col-span-12 md:col-span-8"><FormLabel className={cn(index !== 0 && "sr-only")}>Descrição</FormLabel>
                   <FormField control={form.control} name={`servicos.${index}.descricao`} render={({ field }) => (
                        <FormItem className="w-full">
                           <ItemSelector
                                pecas={[]}
                                servicos={servicos}
                                onSelect={(item, type) => handleItemSelect(index, item, type)}
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
                 <div className="col-span-10 md:col-span-3"><FormLabel className={cn(index !== 0 && "sr-only")}>Valor</FormLabel>
                    <FormField control={form.control} name={`servicos.${index}.valor`} render={({ field }) => (
                        <FormItem><FormControl><Input type="number" placeholder="400.00" {...field} /></FormControl><FormMessage /></FormItem>)}
                    />
                </div>
                <div className="col-span-2 md:col-span-1 flex items-end h-full">
                    <Button type="button" variant="destructive" size="icon" onClick={() => removeServico(index)} disabled={servicosFields.length <= 1} className={cn(index !== 0 && "mt-auto")}>
                        <Trash2 className="h-4 w-4" />
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
          {pecasFields.map((field, index) => (
              <div key={field.id} className="grid grid-cols-12 gap-x-2 gap-y-4 items-start">
                <div className="col-span-12 md:col-span-5"><FormLabel className={cn(index !== 0 && "sr-only")}>Descrição</FormLabel>
                   <FormField control={form.control} name={`pecas.${index}.descricao`} render={({ field }) => (
                        <FormItem className="w-full">
                            <ItemSelector
                                pecas={pecas}
                                servicos={[]}
                                onSelect={(item, type) => handleItemSelect(index, item, type)}
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
                 <div className="col-span-6 md:col-span-2"><FormLabel className={cn(index !== 0 && "sr-only")}>Qtd.</FormLabel>
                    <FormField control={form.control} name={`pecas.${index}.quantidade`} render={({ field }) => (
                        <FormItem><FormControl><Input type="number" placeholder="1" {...field} /></FormControl><FormMessage /></FormItem>)}
                    />
                </div>
                <div className="col-span-6 md:col-span-2"><FormLabel className={cn(index !== 0 && "sr-only")}>Vlr. Unitário</FormLabel>
                    <FormField control={form.control} name={`pecas.${index}.valorUnitario`} render={({ field }) => (
                        <FormItem><FormControl><Input type="number" placeholder="100.00" {...field} /></FormControl><FormMessage /></FormItem>)}
                    />
                </div>
                <div className="col-span-10 md:col-span-2"><FormLabel className={cn(index !== 0 && "sr-only")}>Subtotal</FormLabel>
                    <Input readOnly disabled value={((form.watch(`pecas.${index}.quantidade`) || 0) * (form.watch(`pecas.${index}.valorUnitario`) || 0)).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} />
                </div>
                <div className="col-span-2 md:col-span-1 flex items-end h-full">
                    <Button type="button" variant="destructive" size="icon" onClick={() => removePeca(index)}>
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
              </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={() => appendPeca({ descricao: '', quantidade: 1, valorUnitario: 0 })}>
            <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Peça
          </Button>
        </div>
        
        <FormField control={form.control} name="observacoes" render={({ field }) => (
            <FormItem><FormLabel>Observações</FormLabel>
              <FormControl><Textarea placeholder="Detalhes adicionais, condições, etc." className="resize-none" {...field}/></FormControl>
              <FormMessage />
            </FormItem>)}
        />
        
        <div className="flex items-center justify-between pt-4 sticky bottom-0 bg-background/95 pb-4">
            <div className="text-lg font-semibold">
                <span>Valor Total: </span>
                <span>{form.watch('valorTotal').toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
            </div>
            <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
        </div>
      </form>
    </Form>
  );
}
