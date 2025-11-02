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
import { useAuth, useFirestore } from '@/firebase';
import { updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import type { Cliente } from '@/lib/types';

const formSchema = z.object({
  nome: z.string().min(2, 'O nome deve ter pelo menos 2 caracteres.'),
  email: z.string().email('Formato de e-mail inválido.'),
  telefone: z
    .string()
    .min(10, 'O telefone deve ter pelo menos 10 caracteres.'),
  cep: z.string().min(8, 'O CEP deve ter 8 caracteres.').max(9, 'O CEP deve ter no máximo 9 caracteres (com hífen).'),
  endereco: z.string().min(3, 'O endereço deve ter pelo menos 3 caracteres.'),
  numero: z.string().min(1, 'O número é obrigatório.'),
  bairro: z.string().min(2, 'O bairro é obrigatório.'),
  cidade: z.string().min(2, 'A cidade é obrigatória.'),
  uf: z.string().length(2, 'A UF deve ter 2 caracteres.'),
  pontoReferencia: z.string().optional(),
});


type EditClientFormProps = {
  client: Cliente;
  setDialogOpen: (open: boolean) => void;
};

export function EditClientForm({ client, setDialogOpen }: EditClientFormProps) {
  const auth = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: client.nome,
      email: client.email,
      telefone: client.telefone,
      cep: client.cep || '',
      endereco: client.endereco,
      numero: client.numero || '',
      bairro: client.bairro || '',
      cidade: client.cidade || '',
      uf: client.uf || '',
      pontoReferencia: client.pontoReferencia || '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!auth.currentUser) {
      toast({
        variant: 'destructive',
        title: 'Erro de autenticação',
        description: 'Você precisa estar logado para editar um cliente.',
      });
      return;
    }
    if (!firestore) return;

    try {
      const clientDocRef = doc(firestore, 'clientes', client.id);
      updateDocumentNonBlocking(clientDocRef, values);

      toast({
        title: 'Sucesso!',
        description: 'Cliente atualizado com sucesso.',
      });
      form.reset();
      setDialogOpen(false);
    } catch (error) {
      console.error('Error updating document: ', error);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Não foi possível atualizar o cliente. Tente novamente.',
      });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="nome"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome</FormLabel>
              <FormControl>
                <Input placeholder="Nome completo do cliente" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input placeholder="email@exemplo.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="telefone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Telefone</FormLabel>
                <FormControl>
                  <Input placeholder="(11) 99999-9999" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
            control={form.control}
            name="cep"
            render={({ field }) => (
              <FormItem>
                <FormLabel>CEP</FormLabel>
                <FormControl>
                  <Input placeholder="00000-000" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <FormField
                control={form.control}
                name="endereco"
                render={({ field }) => (
                <FormItem className='col-span-2'>
                    <FormLabel>Endereço</FormLabel>
                    <FormControl>
                    <Input placeholder="Rua, Avenida, etc." {...field} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
             <FormField
                control={form.control}
                name="numero"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Número</FormLabel>
                    <FormControl>
                    <Input placeholder="123" {...field} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <FormField
                control={form.control}
                name="bairro"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Bairro</FormLabel>
                    <FormControl>
                    <Input placeholder="Centro" {...field} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
             <FormField
                control={form.control}
                name="cidade"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Cidade</FormLabel>
                    <FormControl>
                    <Input placeholder="São Paulo" {...field} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
             <FormField
                control={form.control}
                name="uf"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>UF</FormLabel>
                    <FormControl>
                    <Input placeholder="SP" {...field} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
        </div>
        <FormField
            control={form.control}
            name="pontoReferencia"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ponto de Referência (Opcional)</FormLabel>
                <FormControl>
                  <Input placeholder="Próximo ao mercado" {...field} />
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
