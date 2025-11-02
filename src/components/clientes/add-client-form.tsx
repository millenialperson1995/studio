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
      const cep = cepValue.replace(/\D/g, '');
      if (cep.length !== 8) {
        return;
      }

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
                <FormItem className='sm:col-span-2'>
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
            {form.formState.isSubmitting ? 'Salvando...' : 'Salvar Cliente'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
