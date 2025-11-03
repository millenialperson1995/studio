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
  placa: z.string().min(1, 'A placa é obrigatória.'),
  fabricante: z.string().min(1, 'O fabricante é obrigatório.'),
  modelo: z.string().min(1, 'O modelo é obrigatório.'),
  ano: z.coerce.number().optional().nullable(),
  motor: z.string().optional(),
  cilindros: z.string().optional(),
  numeroMotor: z.string().optional(),
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
      fabricante: vehicle.fabricante,
      modelo: vehicle.modelo,
      ano: vehicle.ano || null,
      motor: vehicle.motor || '',
      cilindros: vehicle.cilindros || '',
      numeroMotor: vehicle.numeroMotor || '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!firestore) return;

    try {
      const vehicleDocRef = doc(firestore, 'clientes', vehicle.clienteId, 'veiculos', vehicle.id);
      
      const vehicleData = {
        ...values,
        ano: values.ano || null,
      }
      
      updateDocumentNonBlocking(vehicleDocRef, vehicleData);

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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-h-[80vh] overflow-y-auto p-1 pr-4">
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
              <FormLabel>Ano (Opcional)</FormLabel>
              <FormControl>
                 <Input type="number" placeholder="Ex: 2023" {...field} value={field.value ?? ''} />
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
                <FormLabel>Motor (Opcional)</FormLabel>
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
                <FormLabel>Cilindros (Opcional)</FormLabel>
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
            {form.formState.isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
