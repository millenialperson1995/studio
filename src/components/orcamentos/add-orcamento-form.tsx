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
import { collection, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { useFirestore, useUser } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import type { Cliente, Veiculo, Peca, Servico } from '@/lib/types';
import { Trash2, PlusCircle, CalendarIcon } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Calendar } from '../ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ItemSelector } from './item-selector';

const itemSchema = z.object({
  itemId: z.string().min(1, 'Item inválido'),
  tipo: z.enum(['peca', 'servico']),
  descricao: z.string().min(1, 'A descrição é obrigatória.'),
  quantidade: z.coerce.number().min(0.1, 'A quantidade deve ser maior que 0.'),
  valorUnitario: z.coerce.number().min(0, 'O valor deve ser positivo.'),
  valorTotal: z.coerce.number(),
});

const formSchema = z.object({
  clienteId: z.string().min(1, 'Selecione um cliente.'),
  veiculoId: z.string().min(1, 'Selecione um veículo.'),
  dataValidade: z.date({
    required_error: 'A data de validade é obrigatória.',
  }),
  status: z.enum(['pendente', 'aprovado', 'rejeitado']),
  observacoes: z.string().optional(),
  itens: z.array(itemSchema).min(1, 'Adicione pelo menos um item.'),
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

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      clienteId: '',
      veiculoId: '',
      dataValidade: new Date(new Date().setDate(new Date().getDate() + 15)), // Default 15 days
      status: 'pendente',
      observacoes: '',
      itens: [],
      valorTotal: 0,
    },
  });

  const { fields, append, remove, update } = useFieldArray({
    control: form.control,
    name: 'itens',
  });

  const watchedItens = form.watch('itens');
  
  const selectedItemIds = useMemo(() => watchedItens.map(item => item.itemId), [watchedItens]);

  const totalValue = watchedItens.reduce((sum, item) => {
    const itemTotal = item.tipo === 'peca'
        ? (item.quantidade || 0) * (item.valorUnitario || 0)
        : (item.valorTotal || 0); // For services, use the manual total
      return sum + itemTotal;
  }, 0);

  useEffect(() => {
    form.setValue('valorTotal', totalValue, { shouldValidate: true });
  }, [totalValue, form]);


  const filteredVehicles = vehicles.filter(
    (v) => v.clienteId === selectedClientId
  );

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!firestore || !user) return;
    
    try {
      const orcamentosCollectionRef = collection(firestore, 'orcamentos');
      const newOrcamentoRef = doc(orcamentosCollectionRef);

      const finalItens = values.itens.map(item => {
        const valorTotal = item.tipo === 'peca' 
            ? (item.quantidade || 0) * (item.valorUnitario || 0) 
            : item.valorTotal;
        return {
          ...item,
          valorTotal,
        }
      });

      const orcamentoData = {
        ...values,
        itens: finalItens,
        valorTotal: totalValue,
        id: newOrcamentoRef.id,
        userId: user.uid, // Associate data with the logged-in user
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

  const handleItemSelect = (item: Peca | Servico, type: 'peca' | 'servico') => {
    append({
        itemId: item.id,
        tipo: type,
        descricao: item.descricao,
        valorUnitario: type === 'peca' ? (item as Peca).valorVenda : 0, // No unit value for service
        quantidade: 1,
        valorTotal: type === 'peca' ? (item as Peca).valorVenda : (item as Servico).valorPadrao, // For service, this is the manual total
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
          <div className="flex justify-between items-center">
            <h3 className="font-medium">Itens do Orçamento</h3>
             <ItemSelector
                pecas={pecas}
                servicos={servicos}
                onSelect={handleItemSelect}
                selectedItemIds={selectedItemIds}
                trigger={
                    <Button type="button" variant="outline" size="sm">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Adicionar Item
                    </Button>
                }
            />
          </div>
          {fields.length > 0 && (
             <div className="hidden md:grid grid-cols-12 gap-x-2 text-sm font-medium text-muted-foreground px-1">
                <div className="col-span-5">Item/Descrição</div>
                <div className="col-span-2">Qtd.</div>
                <div className="col-span-2">Vlr. Unitário</div>
                <div className="col-span-2">Subtotal</div>
             </div>
          )}
          {fields.map((field, index) => {
            const item = watchedItens[index];
            const isPeca = item.tipo === 'peca';
            const subtotal = isPeca ? (item.quantidade || 0) * (item.valorUnitario || 0) : item.valorTotal;

            if (isPeca) {
                 // Update total for peca automatically
                 const newTotal = (item.quantidade || 0) * (item.valorUnitario || 0);
                 if (item.valorTotal !== newTotal) {
                     form.setValue(`itens.${index}.valorTotal`, newTotal, { shouldValidate: true });
                 }
            }
            
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
                         <FormControl>
                            <Input
                                readOnly
                                disabled
                                {...field}
                            />
                        </FormControl>
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
                            <Input type="number" placeholder="100.00" {...field} disabled={!isPeca} readOnly={!isPeca}/>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                </div>
                <div className="col-span-10 md:col-span-2 w-full">
                    <FormLabel className="text-xs md:hidden">Subtotal</FormLabel>
                     <FormField
                      control={form.control}
                      name={`itens.${index}.valorTotal`}
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                             <Input 
                                type="number"
                                {...field} 
                                readOnly={isPeca}
                                disabled={isPeca}
                                value={isPeca ? subtotal.toFixed(2) : field.value}
                             />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                </div>
                <div className="col-span-2 md:col-span-1 flex items-end h-full w-full">
                    <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        onClick={() => remove(index)}
                        className="h-10 w-full"
                    >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Remover Item</span>
                    </Button>
                </div>
              </div>
            );
          })}
          {fields.length === 0 && (
             <p className="text-sm text-muted-foreground text-center py-4">Nenhum item adicionado.</p>
          )}
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
                <span>{totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
            </div>
            <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Salvando...' : 'Salvar Orçamento'}
            </Button>
        </div>
      </form>
    </Form>
  );
}
