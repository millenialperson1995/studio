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
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { collection, serverTimestamp, doc } from 'firebase/firestore';
import { useFirestore, useUser } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { Switch } from '../ui/switch';

const formSchema = z.object({
  codigo: z.string().min(1, 'O código é obrigatório.'),
  descricao: z.string().min(2, 'A descrição deve ter pelo menos 2 caracteres.'),
  valorPadrao: z.coerce.number().min(0, 'O valor deve ser positivo.'),
  tempoMedio: z.coerce.number().min(0, 'O tempo deve ser positivo.'),
  categoria: z.string().min(2, 'A categoria deve ter pelo menos 2 caracteres.'),
  ativo: z.boolean().default(true),
});

type AddServicoFormProps = {
  setDialogOpen: (open: boolean) => void;
};

export function AddServicoForm({ setDialogOpen }: AddServicoFormProps) {
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      codigo: '',
      descricao: '',
      valorPadrao: 0,
      tempoMedio: 1,
      categoria: '',
      ativo: true,
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!firestore || !user) return;

    try {
      const servicosCollectionRef = collection(firestore, 'servicos');
      const newServicoRef = doc(servicosCollectionRef);
      
      const servicoData = {
        ...values,
        id: newServicoRef.id,
        userId: user.uid,
        createdAt: serverTimestamp(),
      };
      
      await addDocumentNonBlocking(newServicoRef, servicoData);

      toast({
        title: 'Sucesso!',
        description: 'Serviço adicionado com sucesso.',
      });
      form.reset();
      setDialogOpen(false);
    } catch (error) {
      console.error('Error adding document: ', error);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Não foi possível adicionar o serviço. Tente novamente.',
      });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="codigo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Código</FormLabel>
              <FormControl>
                <Input placeholder="Ex: SERV-001" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="descricao"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Retífica de motor" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="valorPadrao"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Valor Padrão (R$)</FormLabel>
              <FormControl>
                <Input type="number" placeholder="150.00" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="tempoMedio"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tempo Médio (horas)</FormLabel>
              <FormControl>
                <Input type="number" placeholder="2.5" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="categoria"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Categoria</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Motor" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="ativo"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
              <div className="space-y-0.5">
                <FormLabel>Ativo</FormLabel>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />
        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? 'Salvando...' : 'Salvar Serviço'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
