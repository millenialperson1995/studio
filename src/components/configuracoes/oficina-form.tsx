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
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { doc, serverTimestamp } from 'firebase/firestore';
import { useFirestore, useUser } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import type { Oficina } from '@/lib/types';
import { useEffect } from 'react';

const formSchema = z.object({
  nomeEmpresa: z.string().min(2, 'O nome da empresa é obrigatório.'),
  cnpj: z.string().min(14, 'O CNPJ deve ter 14 ou 18 caracteres.').max(18, 'O CNPJ deve ter 14 ou 18 caracteres.'),
  telefone: z.string().min(10, 'O telefone deve ter pelo menos 10 dígitos.'),
  email: z.string().email('Formato de e-mail inválido.').optional().or(z.literal('')),
  cep: z.string().min(8, 'O CEP deve ter 8 ou 9 caracteres.').max(9, 'O CEP deve ter no máximo 9 caracteres.'),
  endereco: z.string().min(3, 'O endereço é obrigatório.'),
  cidade: z.string().min(2, 'A cidade é obrigatória.'),
  uf: z.string().length(2, 'A UF deve ter 2 caracteres.'),
});

type OficinaFormProps = {
  oficina: Oficina | null;
};

export function OficinaForm({ oficina }: OficinaFormProps) {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    values: {
      nomeEmpresa: oficina?.nomeEmpresa || '',
      cnpj: oficina?.cnpj || '',
      telefone: oficina?.telefone || '',
      email: oficina?.email || '',
      cep: oficina?.cep || '',
      endereco: oficina?.endereco || '',
      cidade: oficina?.cidade || '',
      uf: oficina?.uf || '',
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
    if (!user || !firestore) {
      toast({
        variant: 'destructive',
        title: 'Erro de autenticação',
        description: 'Você precisa estar logado para salvar as configurações.',
      });
      return;
    }

    try {
      const oficinaDocRef = doc(firestore, 'oficinas', user.uid);
      
      const oficinaData = {
        ...values,
        userId: user.uid,
        createdAt: oficina?.createdAt || serverTimestamp(), // Preserve original creation date
      };

      await setDocumentNonBlocking(oficinaDocRef, oficinaData, { merge: true });

      toast({
        title: 'Sucesso!',
        description: 'Configurações da oficina salvas.',
      });
    } catch (error) {
      console.error('Error saving workshop settings: ', error);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Não foi possível salvar as configurações. Tente novamente.',
      });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="nomeEmpresa"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome da Empresa</FormLabel>
              <FormControl>
                <Input placeholder="O nome que aparece nos documentos" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
            control={form.control}
            name="cnpj"
            render={({ field }) => (
                <FormItem>
                <FormLabel>CNPJ</FormLabel>
                <FormControl>
                    <Input placeholder="00.000.000/0001-00" {...field} />
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
                    <Input placeholder="(81) 99999-9999" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
        </div>
         <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Email de Contato</FormLabel>
                <FormControl>
                    <Input type="email" placeholder="contato@suaoficina.com" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
             <FormField
                control={form.control}
                name="cep"
                render={({ field }) => (
                <FormItem className='md:col-span-1'>
                    <FormLabel>CEP</FormLabel>
                    <FormControl>
                    <Input placeholder="00000-000" {...field} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="endereco"
                render={({ field }) => (
                <FormItem className='md:col-span-4'>
                    <FormLabel>Endereço</FormLabel>
                    <FormControl>
                    <Input placeholder="Rua, Avenida, etc, Nº" {...field} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <FormField
                control={form.control}
                name="cidade"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Cidade</FormLabel>
                    <FormControl>
                    <Input placeholder="Ex: Olinda" {...field} />
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
                    <Input placeholder="PE" {...field} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
        </div>

        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? 'Salvando...' : 'Salvar Configurações'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
