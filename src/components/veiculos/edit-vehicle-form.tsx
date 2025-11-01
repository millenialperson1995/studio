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
import { useFirestore } from '@/firebase';
import { updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import type { Veiculo } from '@/lib/types';

const formSchema = z.object({
  placa: z.string().min(7, 'A placa deve ter 7 caracteres.'),
  marca: z.string().min(2, 'A marca deve ter pelo menos 2 caracteres.'),
  modelo: z.string().min(2, 'O modelo deve ter pelo menos 2 caracteres.'),
  ano: z.coerce.number().min(1900, 'Ano inválido.').max(new Date().getFullYear() + 1, 'Ano inválido.'),
  informacoesTecnicas: z.string().optional(),
});

type EditVehicleFormProps = {
  vehicle: Veiculo;
  setDialogOpen: (open: boolean) => void;
};

export function EditVehicleForm({ vehicle, setDialogOpen }: EditVehicleFormProps) {
  const firestore = useFirestore();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      placa: vehicle.placa,
      marca: vehicle.marca,
      modelo: vehicle.modelo,
      ano: vehicle.ano,
      informacoesTecnicas: vehicle.informacoesTecnicas || '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!firestore) return;

    try {
      const vehicleDocRef = doc(firestore, 'clientes', vehicle.clienteId, 'veiculos', vehicle.id);
      updateDocumentNonBlocking(vehicleDocRef, values);

      toast({
        title: 'Sucesso!',
        description: 'Veículo atualizado com sucesso.',
      });
      form.reset();
      setDialogOpen(false);
    } catch (error) {
      console.error('Error updating document: ', error);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Não foi possível atualizar o veículo. Tente novamente.',
      });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
            {form.formState.isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
