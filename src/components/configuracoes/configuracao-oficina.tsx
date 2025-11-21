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
import { useToast } from '@/hooks/use-toast';
import { useAuth, useFirestore, useUser } from '@/firebase';
import { doc, setDoc, updateDoc } from 'firebase/firestore';
import { useState } from 'react';

// Schema de validação para CNPJ
const cnpjRegex = /^[0-9]{14}$/;
const cepRegex = /^[0-9]{8}$/;
const telefoneRegex = /^[0-9]{10,11}$/;
const ufRegex = /^[A-Z]{2}$/;

const formSchema = z
  .object({
    nomeEmpresa: z.string().min(2, 'O nome da empresa deve ter pelo menos 2 caracteres.'),
    cnpj: z.string()
      .length(14, 'CNPJ deve ter 14 dígitos')
      .regex(/^\d+$/, 'CNPJ deve conter apenas números'),
    endereco: z.string().min(5, 'O endereço deve ter pelo menos 5 caracteres.'),
    cidade: z.string().min(2, 'O nome da cidade deve ter pelo menos 2 caracteres.'),
    uf: z.string()
      .regex(ufRegex, 'UF deve ter 2 letras maiúsculas')
      .length(2, 'UF deve ter 2 caracteres'),
    cep: z.string()
      .regex(cepRegex, 'CEP deve ter 8 dígitos numéricos')
      .length(8, 'CEP deve ter 8 dígitos'),
    telefone: z.string()
      .regex(telefoneRegex, 'Telefone deve ter 10 ou 11 dígitos')
      .min(10, 'Telefone deve ter pelo menos 10 dígitos')
      .max(11, 'Telefone deve ter no máximo 11 dígitos'),
  });

export function ConfiguracaoOficina() {
  const { toast } = useToast();
  const auth = useAuth();
  const firestore = useFirestore();
  const { user } = useUser();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nomeEmpresa: '',
      cnpj: '',
      endereco: '',
      cidade: '',
      uf: '',
      cep: '',
      telefone: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!auth || !firestore || !user) return;
    
    setIsSubmitting(true);
    
    try {
      // Sanitizar os dados antes de usar
      const sanitizedData = {
        nomeEmpresa: values.nomeEmpresa.trim(),
        cnpj: values.cnpj.replace(/\D/g, ''), // Remover caracteres não numéricos
        endereco: values.endereco.trim(),
        cidade: values.cidade.trim(),
        uf: values.uf.toUpperCase(), // Converter para maiúsculas
        cep: values.cep.replace(/\D/g, ''), // Remover caracteres não numéricos
        telefone: values.telefone.replace(/\D/g, ''), // Remover caracteres não numéricos
        userId: user.uid,
        createdAt: new Date(),
      };

      // Criar ou atualizar o perfil da oficina em Firestore
      await setDoc(doc(firestore, 'oficinas', user.uid), sanitizedData, { merge: true });

      toast({
        title: 'Configurações da oficina salvas com sucesso!',
        description: 'Os dados da sua oficina foram atualizados.',
      });
    } catch (error: any) {
      console.error('Erro ao salvar configurações da oficina:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao salvar configurações',
        description: 'Ocorreu um erro ao salvar as configurações da oficina. Tente novamente.',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-6">Configurações da Oficina</h2>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="nomeEmpresa"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome da Empresa</FormLabel>
                <FormControl>
                  <Input placeholder="Nome da sua oficina" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="cnpj"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CNPJ</FormLabel>
                  <FormControl>
                    <Input placeholder="00000000000000" {...field} />
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
                    <Input placeholder="(00) 00000-0000" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <FormField
            control={form.control}
            name="endereco"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Endereço</FormLabel>
                <FormControl>
                  <Input placeholder="Rua, número, complemento" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="cidade"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cidade</FormLabel>
                  <FormControl>
                    <Input placeholder="Sua cidade" {...field} />
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
                    <Input placeholder="XX" {...field} maxLength={2} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="cep"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CEP</FormLabel>
                  <FormControl>
                    <Input placeholder="00000000" {...field} maxLength={8} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Salvando...' : 'Salvar Configurações'}
          </Button>
        </form>
      </Form>
    </div>
  );
}