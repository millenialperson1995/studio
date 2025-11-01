'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
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
import type { Orcamento, Cliente, Veiculo } from '@/lib/types';
import { Trash2, PlusCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { CalendarIcon } from 'lucide-react';
import { Calendar } from '../ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const itemSchema = z.object({
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

type EditOrcamentoFormProps = {
  orcamento: Orcamento;
  clients: Cliente[];
  vehicles: Veiculo[];
  setDialogOpen: (open: boolean) => void;
};

export function EditOrcamentoForm({
  orcamento,
  clients,
  vehicles,
  setDialogOpen,
}: EditOrcamentoFormProps) {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [selectedClientId, setSelectedClientId] = useState(orcamento.clienteId);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ...orcamento,
      dataValidade: orcamento.dataValidade.toDate(), // Convert timestamp to Date
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'itens',
  });

  const itensValues = form.watch('itens');

  useEffect(() => {
    const total = itensValues.reduce((sum, item) => {
       const valorTotalItem = (item.quantidade || 0) * (item.valorUnitario || 0);
       return sum + valorTotalItem;
    }, 0);
    form.setValue('valorTotal', total, { shouldDirty: true, shouldValidate: true });
  }, [itensValues, form]);


  const filteredVehicles = vehicles.filter(
    (v) => v.clienteId === selectedClientId
  );

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!firestore) return;

    try {
      const orcamentoDocRef = doc(firestore, 'orcamentos', orcamento.id);
      const orcamentoData = {
        ...values,
        itens: values.itens.map(item => ({...item, valorTotal: (item.quantidade || 0) * (item.valorUnitario || 0)})),
      };
      
      updateDocumentNonBlocking(orcamentoDocRef, orcamentoData);

      toast({
        title: 'Sucesso!',
        description: 'Orçamento atualizado com sucesso.',
      });
      form.reset();
      setDialogOpen(false);
    } catch (error) {
      console.error('Error updating document: ', error);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description:
          'Não foi possível atualizar o orçamento. Tente novamente.',
      });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                    form.setValue('veiculoId', ''); // Reset vehicle
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
              <FormItem>
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

        <div className="space-y-4 rounded-md border p-4">
          <h3 className="font-medium">Itens do Orçamento</h3>
          {fields.map((field, index) => {
            const qty = form.watch(`itens.${index}.quantidade`) || 0;
            const price = form.watch(`itens.${index}.valorUnitario`) || 0;
            const total = qty * price;
            
            return (
              <div
                key={field.id}
                className="grid grid-cols-12 gap-x-2 gap-y-4 items-start"
              >
                <div className="col-span-12 md:col-span-5">
                  <FormLabel className={cn(index !== 0 && "sr-only")}>Descrição</FormLabel>
                   <FormField
                      control={form.control}
                      name={`itens.${index}.descricao`}
                      render={({ field }) => (
                        <FormItem className="w-full">
                           <FormControl>
                              <Input placeholder="Ex: Troca de óleo" {...field} />
                           </FormControl>
                           <FormMessage />
                        </FormItem>
                      )}
                    />
                </div>
                 <div className="col-span-6 md:col-span-2">
                    <FormLabel className={cn(index !== 0 && "sr-only")}>Qtd.</FormLabel>
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
                <div className="col-span-6 md:col-span-2">
                    <FormLabel className={cn(index !== 0 && "sr-only")}>Vlr. Unitário</FormLabel>
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
                <div className="col-span-10 md:col-span-2">
                    <FormLabel className={cn(index !== 0 && "sr-only")}>Subtotal</FormLabel>
                    <Input readOnly disabled value={total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} />
                </div>
                <div className="col-span-2 md:col-span-1 flex items-end h-full">
                    <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        onClick={() => remove(index)}
                        disabled={fields.length <= 1}
                        className={cn(index !== 0 && "mt-auto")}
                    >
                        <Trash2 className="h-4 w-4" />
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
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <FormField
                control={form.control}
                name="dataValidade"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
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
                  <FormItem>
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
        
        <div className="flex items-center justify-between pt-4">
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
