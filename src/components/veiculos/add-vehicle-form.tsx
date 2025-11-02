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
import { collection, serverTimestamp, doc } from 'firebase/firestore';
import { useFirestore, useUser } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import type { Cliente } from '@/lib/types';

const formSchema = z.object({
  clienteId: z.string().min(1, 'Selecione um cliente.'),
  placa: z.string().min(7, 'A placa deve ter pelo menos 7 caracteres.'),
  fabricante: z.string().min(2, 'O fabricante deve ter pelo menos 2 caracteres.'),
  modelo: z.string().min(2, 'O modelo deve ter pelo menos 2 caracteres.'),
  ano: z.coerce.number().min(1900, 'Ano inválido.').max(new Date().getFullYear() + 1, 'Ano inválido.'),
  motor: z.string().optional(),
  cilindros: z.string().optional(),
  numeroMotor: z.string().optional(),
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
  const { user } = useUser();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      clienteId: '',
      placa: '',
      fabricante: '',
      modelo: '',
      ano: new Date().getFullYear(),
      motor: '',
      cilindros: '',
      numeroMotor: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!firestore || !user) return;

    try {
      const vehiclesCollectionRef = collection(firestore, 'clientes', values.clienteId, 'veiculos');
      const newVehicleRef = doc(vehiclesCollectionRef);

      const vehicleData = {
        ...values,
        id: newVehicleRef.id,
        userId: user.uid,
        createdAt: serverTimestamp(),
      };
      
      await addDocumentNonBlocking(newVehicleRef, vehicleData);

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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-h-[80vh] overflow-y-auto p-1 pr-4">
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
                <Input placeholder="ABC1D23" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
            control={form.control}
            name="fabricante"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Fabricante</FormLabel>
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
        </div>
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
         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
            control={form.control}
            name="motor"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Motor</FormLabel>
                <FormControl>
                    <Input placeholder="Ex: 1.6 MSI" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
            control={form.control}
            name="cilindros"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Cilindros</FormLabel>
                <FormControl>
                    <Input placeholder="Ex: 4" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
        </div>
         <FormField
          control={form.control}
          name="numeroMotor"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Número do Motor (Opcional)</FormLabel>
              <FormControl>
                <Input placeholder="9BW..." {...field} />
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
