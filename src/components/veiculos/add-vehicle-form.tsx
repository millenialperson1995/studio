'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
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
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { collection, serverTimestamp } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import type { Cliente } from '@/lib/types';

const formSchema = z.object({
  clienteId: z.string().min(1, 'Selecione um cliente.'),
  placa: z.string().min(7, 'A placa deve ter 7 caracteres.'),
  marca: z.string().min(2, 'A marca deve ter pelo menos 2 caracteres.'),
  modelo: z.string().min(2, 'O modelo deve ter pelo menos 2 caracteres.'),
  ano: z.coerce.number().min(1900, 'Ano inválido.').max(new Date().getFullYear() + 1, 'Ano inválido.'),
  informacoesTecnicas: z.string().optional(),
});

type AddVehicleFormProps = {
  clients: Cliente[];
  setDialogOpen: (open: boolean) => void;
};

export function AddVehicleForm({
  clients,
  setDialogOpen,
}: AddVehicleFormProps) {
  const firestore = useFirestore();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      clienteId: '',
      placa: '',
      marca: '',
      modelo: '',
      ano: new Date().getFullYear(),
      informacoesTecnicas: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!firestore) return;

    try {
      const vehicleData = {
        ...values,
        createdAt: serverTimestamp(),
      };
      
      const vehiclesCollectionRef = collection(firestore, 'clientes', values.clienteId, 'veiculos');
      await addDocumentNonBlocking(vehiclesCollectionRef, vehicleData);

      toast({
        title: 'Sucesso!',
        description: 'Veículo adicionado com sucesso.',
      });
      form.reset();
      setDialogOpen(false);
    } catch (error) {
      console.error('Error adding document: ', error);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Não foi possível adicionar o veículo. Tente novamente.',
      });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="clienteId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cliente</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o proprietário do veículo" />
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
          name="placa"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Placa</FormLabel>
              <FormControl>
                <Input placeholder="ABC-1234" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="marca"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Marca</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Volkswagen" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="modelo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Modelo</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Gol" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="ano"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ano</FormLabel>
              <FormControl>
                <Input type="number" placeholder="Ex: 2023" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
         <FormField
          control={form.control}
          name="informacoesTecnicas"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Informações Técnicas (Opcional)</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Motor 1.6 MSI" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? 'Salvando...' : 'Salvar Veículo'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
