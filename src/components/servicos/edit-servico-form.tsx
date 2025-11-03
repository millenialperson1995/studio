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
import { updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { doc } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { Switch } from '../ui/switch';
import type { Servico } from '@/lib/types';

const formSchema = z.object({
  codigo: z.string().min(1, 'O código é obrigatório.'),
  descricao: z.string().min(2, 'A descrição deve ter pelo menos 2 caracteres.'),
  quantidade: z.coerce.number().min(0, 'A quantidade não pode ser negativa.'),
  valorPadrao: z.coerce.number().min(0, 'O valor deve ser positivo.'),
  tempoMedio: z.coerce.number().min(0, 'O tempo deve ser positivo.'),
  categoria: z.string().min(2, 'A categoria deve ter pelo menos 2 caracteres.'),
  ativo: z.boolean().default(true),
});

type EditServicoFormProps = {
  servico: Servico;
  setDialogOpen: (open: boolean) => void;
};

export function EditServicoForm({ servico, setDialogOpen }: EditServicoFormProps) {
  const firestore = useFirestore();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: servico,
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!firestore) return;

    try {
      const servicoDocRef = doc(firestore, 'servicos', servico.id);
      updateDocumentNonBlocking(servicoDocRef, values);

      toast({
        title: 'Sucesso!',
        description: 'Serviço atualizado com sucesso.',
      });
      form.reset();
      setDialogOpen(false);
    } catch (error) {
      console.error('Error updating document: ', error);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Não foi possível atualizar o serviço. Tente novamente.',
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
          name="quantidade"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Quantidade</FormLabel>
              <FormControl>
                <Input type="number" placeholder="1" {...field} />
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
            {form.formState.isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </div>
      </form>
    </Form>
  );
}

    