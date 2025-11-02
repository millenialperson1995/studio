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
import { useFirestore, useUser } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import type { Peca } from '@/lib/types';

const formSchema = z.object({
  codigo: z.string().min(1, 'O código é obrigatório.'),
  descricao: z.string().min(2, 'A descrição é obrigatória.'),
  fornecedor: z.string().min(2, 'O fornecedor é obrigatório.'),
  quantidadeEstoque: z.coerce.number().min(0, 'A quantidade não pode ser negativa.'),
  quantidadeReservada: z.coerce.number().min(0, 'A quantidade não pode ser negativa.'),
  quantidadeMinima: z.coerce.number().min(0, 'A quantidade não pode ser negativa.'),
  valorCompra: z.coerce.number().min(0, 'O valor deve ser positivo.'),
  valorVenda: z.coerce.number().min(0, 'O valor deve ser positivo.'),
});

type EditPecaFormProps = {
  peca: Peca;
  setDialogOpen: (open: boolean) => void;
};

export function EditPecaForm({ peca, setDialogOpen }: EditPecaFormProps) {
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
        ...peca,
        quantidadeReservada: peca.quantidadeReservada || 0,
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!firestore || !user) return;

    try {
      const pecaDocRef = doc(firestore, 'pecas', peca.id);
      const isEstoqueBaixo = values.quantidadeEstoque <= values.quantidadeMinima;
      const pecaData = {
        ...values,
        alertaEstoqueBaixo: isEstoqueBaixo,
      };
      updateDocumentNonBlocking(pecaDocRef, pecaData);

      toast({
        title: 'Sucesso!',
        description: 'Peça atualizada com sucesso.',
      });
      form.reset();
      setDialogOpen(false);
    } catch (error) {
      console.error('Error updating document: ', error);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Não foi possível atualizar a peça. Tente novamente.',
      });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField name="codigo" control={form.control} render={({ field }) => (
            <FormItem>
              <FormLabel>Código da Peça</FormLabel>
              <FormControl><Input placeholder="Ex: P-08712" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField name="descricao" control={form.control} render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição</FormLabel>
              <FormControl><Input placeholder="Ex: Jogo de Pistões 1.6" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField name="fornecedor" control={form.control} render={({ field }) => (
            <FormItem>
              <FormLabel>Fornecedor</FormLabel>
              <FormControl><Input placeholder="Ex: Metal Leve" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField name="quantidadeEstoque" control={form.control} render={({ field }) => (
                <FormItem>
                <FormLabel>Qtd. em Estoque</FormLabel>
                <FormControl><Input type="number" placeholder="10" {...field} /></FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField name="quantidadeReservada" control={form.control} render={({ field }) => (
                <FormItem>
                <FormLabel>Qtd. Reservada</FormLabel>
                <FormControl><Input type="number" placeholder="0" {...field} readOnly /></FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
             <FormField name="quantidadeMinima" control={form.control} render={({ field }) => (
                <FormItem>
                <FormLabel>Qtd. Mínima</FormLabel>
                <FormControl><Input type="number" placeholder="2" {...field} /></FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
        </div>
         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField name="valorCompra" control={form.control} render={({ field }) => (
                <FormItem>
                <FormLabel>Valor de Compra (R$)</FormLabel>
                <FormControl><Input type="number" placeholder="80.50" {...field} /></FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField name="valorVenda" control={form.control} render={({ field }) => (
                <FormItem>
                <FormLabel>Valor de Venda (R$)</FormLabel>
                <FormControl><Input type="number" placeholder="120.00" {...field} /></FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
        </div>
        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
