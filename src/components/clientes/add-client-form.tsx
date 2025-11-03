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
import { useUser } from '@/firebase';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { collection, serverTimestamp, doc } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { useEffect } from 'react';

const formSchema = z.object({
  nome: z.string().min(2, 'O nome deve ter pelo menos 2 caracteres.'),
  email: z.string().email('Formato de e-mail inválido.').optional().or(z.literal('')),
  telefone: z.string().optional(),
  cep: z.string().optional(),
  endereco: z.string().optional(),
  numero: z.string().optional(),
  bairro: z.string().optional(),
  cidade: z.string().optional(),
  uf: z.string().optional(),
  pontoReferencia: z.string().optional(),
});

type AddClientFormProps = {
  setDialogOpen: (open: boolean) => void;
};

export function AddClientForm({ setDialogOpen }: AddClientFormProps) {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: '',
      email: '',
      telefone: '',
      cep: '',
      endereco: '',
      numero: '',
      bairro: '',
      cidade: '',
      uf: '',
      pontoReferencia: '',
    },
  });

  const cepValue = form.watch('cep');

  useEffect(() => {
    const fetchAddress = async () => {
      const cep = cepValue?.replace(/\D/g, '');
      if (cep && cep.length === 8) {
        try {
          const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
          const data = await response.json();
          if (!data.erro) {
            form.setValue('endereco', data.logradouro, { shouldValidate: true });
            form.setValue('bairro', data.bairro, { shouldValidate: true });
            form.setValue('cidade', data.localidade, { shouldValidate: true });
            form.setValue('uf', data.uf, { shouldValidate: true });
          }
        } catch (error) {
          console.error("Failed to fetch CEP", error);
        }
      }
    };

    fetchAddress();
  }, [cepValue, form]);


  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Erro de autenticação',
        description: 'Você precisa estar logado para adicionar um cliente.',
      });
      return;
    }
    if (!firestore) return;

    try {
      const clientesCollectionRef = collection(firestore, 'clientes');
      const newClientRef = doc(clientesCollectionRef); // Create a new doc ref to get ID
      
      const clienteData = {
        ...values,
        id: newClientRef.id,
        userId: user.uid, // Associate data with the logged-in user
        createdAt: serverTimestamp(),
      };

      await addDocumentNonBlocking(newClientRef, clienteData);

      toast({
        title: 'Sucesso!',
        description: 'Cliente adicionado com sucesso.',
      });
      form.reset();
      setDialogOpen(false);
    } catch (error) {
      console.error('Error adding document: ', error);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Não foi possível adicionar o cliente. Tente novamente.',
      });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto p-1 pr-4">
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
                <FormLabel>Email (Opcional)</FormLabel>
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
                <FormLabel>Telefone (Opcional)</FormLabel>
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
                <FormLabel>CEP (Opcional)</FormLabel>
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
                <FormItem className='sm:col-span-2'>
                    <FormLabel>Endereço (Opcional)</FormLabel>
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
                    <FormLabel>Número (Opcional)</FormLabel>
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
                    <FormLabel>Bairro (Opcional)</FormLabel>
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
                    <FormLabel>Cidade (Opcional)</FormLabel>
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
                    <FormLabel>UF (Opcional)</FormLabel>
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
            {form.formState.isSubmitting ? 'Salvando...' : 'Salvar Cliente'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
