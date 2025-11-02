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
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { collection, serverTimestamp, doc } from 'firebase/firestore';
import { useFirestore, useUser } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import type { Cliente, Veiculo, Peca, Servico } from '@/lib/types';
import { Trash2, PlusCircle, CalendarIcon } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Calendar } from '../ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ItemSelector } from './item-selector';

const itemSchema = z.object({
  itemId: z.string().optional(),
  tipo: z.enum(['peca', 'servico']).optional(),
  descricao: z.string().min(1, 'A descrição é obrigatória.'),
  quantidade: z.coerce.number().min(0.1, 'A quantidade deve ser maior que 0.'),
  valorUnitario: z.coerce.number().min(0, 'O valor deve ser positivo.'),
  valorTotal: z.coerce.number(),
});

type AddOrcamentoFormProps = {
  clients: Cliente[];
  vehicles: Veiculo[];
  servicos: Servico[];
  pecas: Peca[];
  setDialogOpen: (open: boolean) => void;
};

export function AddOrcamentoForm({
  clients,
  vehicles,
  servicos,
  pecas,
  setDialogOpen,
}: AddOrcamentoFormProps) {
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const [selectedClientId, setSelectedClientId] = useState('');
  
  const pecasMap = new Map(pecas.map(p => [p.id, p]));

  const formSchema = z.object({
    clienteId: z.string().min(1, 'Selecione um cliente.'),
    veiculoId: z.string().min(1, 'Selecione um veículo.'),
    dataValidade: z.date({
      required_error: 'A data de validade é obrigatória.',
    }),
    status: z.enum(['pendente', 'aprovado', 'rejeitado']),
    observacoes: z.string().optional(),
    itens: z.array(itemSchema).min(1, 'Adicione pelo menos um item.')
      .superRefine((itens, ctx) => {
        itens.forEach((item, index) => {
          if (item.tipo === 'peca' && item.itemId) {
            const peca = pecasMap.get(item.itemId);
            if (peca) {
              const estoqueDisponivel = peca.quantidadeEstoque - (peca.quantidadeReservada || 0);
              if (item.quantidade > estoqueDisponivel) {
                ctx.addIssue({
                  code: z.ZodIssueCode.custom,
                  message: `Estoque insuficiente. Disponível: ${estoqueDisponivel}`,
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
      dataValidade: new Date(new Date().setDate(new Date().getDate() + 15)), // Default 15 days
      status: 'pendente',
      observacoes: '',
      itens: [{ descricao: '', quantidade: 1, valorUnitario: 0, valorTotal: 0 }],
      valorTotal: 0,
    },
  });

  const { fields, append, remove, update } = useFieldArray({
    control: form.control,
    name: 'itens',
  });

  const itensValues = form.watch('itens');

  useEffect(() => {
    const total = itensValues.reduce((sum, item) => {
      const valorTotalItem = (item.quantidade || 0) * (item.valorUnitario || 0);
      return sum + valorTotalItem;
    }, 0);
    form.setValue('valorTotal', total);
  }, [itensValues, form]);


  const filteredVehicles = vehicles.filter(
    (v) => v.clienteId === selectedClientId
  );

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!firestore || !user) return;
    
    // Final stock check before submission
    for (const item of values.itens) {
        if (item.tipo === 'peca' && item.itemId) {
            const pecaRef = doc(firestore, 'pecas', item.itemId);
            const pecaDoc = await doc(pecaRef).get();
            if (pecaDoc.exists()) {
                const pecaData = pecaDoc.data() as Peca;
                const estoqueDisponivel = pecaData.quantidadeEstoque - (pecaData.quantidadeReservada || 0);
                if (item.quantidade > estoqueDisponivel) {
                    toast({
                        variant: 'destructive',
                        title: 'Erro de Estoque',
                        description: `A peça "${item.descricao}" não tem estoque suficiente. Ação cancelada.`,
                        duration: 7000,
                    });
                    return; // Abort submission
                }
            }
        }
    }


    try {
      const orcamentosCollectionRef = collection(firestore, 'orcamentos');
      const newOrcamentoRef = doc(orcamentosCollectionRef);

      const orcamentoData = {
        ...values,
        id: newOrcamentoRef.id,
        userId: user.uid, // Associate data with the logged-in user
        itens: values.itens.map(item => ({...item, valorTotal: (item.quantidade || 0) * (item.valorUnitario || 0)})),
        dataCriacao: serverTimestamp(),
        createdAt: serverTimestamp(),
      };

      await addDocumentNonBlocking(newOrcamentoRef, orcamentoData);

      toast({
        title: 'Sucesso!',
        description: 'Orçamento criado com sucesso.',
      });
      form.reset();
      setDialogOpen(false);
    } catch (error) {
      console.error('Error adding document: ', error);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description:
          'Não foi possível criar o orçamento. Tente novamente.',
      });
    }
  }

  const handleItemSelect = (index: number, item: Peca | Servico, type: 'peca' | 'servico') => {
    update(index, {
        ...form.getValues(`itens.${index}`),
        itemId: item.id,
        tipo: type,
        descricao: item.descricao,
        valorUnitario: type === 'peca' ? (item as Peca).valorVenda : (item as Servico).valorPadrao
    })
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
                    form.setValue('veiculoId', ''); // Reset vehicle on client change
                  }}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um cliente" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.nome}
                      </SelectItem>
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
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                  disabled={!selectedClientId}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um veículo" />
                    </SelectTrigger>
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

        <div className="space-y-4 rounded-md border p-4">
          <h3 className="font-medium">Itens do Orçamento</h3>
          <div className="hidden md:grid grid-cols-12 gap-x-2 text-sm font-medium text-muted-foreground px-1">
             <div className="col-span-5">Item/Descrição</div>
             <div className="col-span-2">Qtd.</div>
             <div className="col-span-2">Vlr. Unitário</div>
             <div className="col-span-2">Subtotal</div>
          </div>
          {fields.map((field, index) => {
            const qty = form.watch(`itens.${index}.quantidade`) || 0;
            const price = form.watch(`itens.${index}.valorUnitario`) || 0;
            const total = qty * price;
            
            return (
              <div
                key={field.id}
                className="flex flex-col md:grid md:grid-cols-12 gap-2 md:gap-x-2 items-start border-b md:border-none pb-4 md:pb-0 mb-4 md:mb-0"
              >
                <div className="col-span-12 md:col-span-5 w-full">
                  <FormLabel className="text-xs md:hidden">Item/Descrição</FormLabel>
                  <FormField
                    control={form.control}
                    name={`itens.${index}.descricao`}
                    render={({ field }) => (
                      <FormItem className="w-full">
                        <ItemSelector
                          pecas={pecas}
                          servicos={servicos}
                          onSelect={(item, type) =>
                            handleItemSelect(index, item, type)
                          }
                          trigger={
                            <FormControl>
                              <Input
                                placeholder="Selecione ou digite um item"
                                {...field}
                              />
                            </FormControl>
                          }
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                 <div className="col-span-12 md:col-span-2 w-full">
                    <FormLabel className="text-xs md:hidden">Qtd.</FormLabel>
                    <FormField
                      control={form.control}
                      name={`itens.${index}.quantidade`}
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input type="number" placeholder="1" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                </div>
                <div className="col-span-12 md:col-span-2 w-full">
                    <FormLabel className="text-xs md:hidden">Vlr. Unitário</FormLabel>
                    <FormField
                      control={form.control}
                      name={`itens.${index}.valorUnitario`}
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input type="number" placeholder="100.00" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                </div>
                <div className="col-span-10 md:col-span-2 w-full">
                    <FormLabel className="text-xs md:hidden">Subtotal</FormLabel>
                    <Input readOnly disabled value={total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} />
                </div>
                <div className="col-span-2 md:col-span-1 flex items-end h-full w-full">
                    <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        onClick={() => remove(index)}
                        disabled={fields.length <= 1}
                        className="h-10 w-full"
                    >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Remover Item</span>
                    </Button>
                </div>
              </div>
            );
          })}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => append({ descricao: '', quantidade: 1, valorUnitario: 0, valorTotal: 0 })}
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Adicionar Item
          </Button>
        </div>
        
        <div className="flex flex-col md:flex-row gap-4">
             <FormField
                control={form.control}
                name="dataValidade"
                render={({ field }) => (
                  <FormItem className="flex flex-col flex-1">
                    <FormLabel>Data de Validade</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={'outline'}
                            className={cn(
                              'w-full pl-3 text-left font-normal',
                              !field.value && 'text-muted-foreground'
                            )}
                          >
                            {field.value ? (
                              format(field.value, 'PPP')
                            ) : (
                              <span>Escolha uma data</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date < new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

             <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="pendente">Pendente</SelectItem>
                        <SelectItem value="aprovado">Aprovado</SelectItem>
                        <SelectItem value="rejeitado">Rejeitado</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
        </div>


        <FormField
          control={form.control}
          name="observacoes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Observações</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Detalhes adicionais, condições, etc."
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="flex flex-col-reverse sm:flex-row items-center justify-between pt-4">
            <div className="text-lg font-semibold mt-4 sm:mt-0">
                <span>Valor Total: </span>
                <span>{form.watch('valorTotal').toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
            </div>
            <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Salvando...' : 'Salvar Orçamento'}
            </Button>
        </div>
      </form>
    </Form>
  );
}
