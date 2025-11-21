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
import { useAuth, useFirestore } from '@/firebase';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { isValid } from 'cnpj-cpf-validator';

// Schema de validação para CNPJ
const cepRegex = /^[0-9]{8}$/;
const telefoneRegex = /^[0-9]{10,11}$/;
const ufRegex = /^[A-Z]{2}$/;

const formSchema = z
  .object({
    nome: z.string().min(2, 'O nome deve ter pelo menos 2 caracteres.'),
    sobrenome: z.string().min(2, 'O sobrenome deve ter pelo menos 2 caracteres.'),
    email: z.string().email('Formato de e-mail inválido.'),
    password: z
      .string()
      .min(8, 'A senha deve ter no mínimo 8 caracteres.'),
    confirmPassword: z.string(),
    nomeEmpresa: z.string().min(2, 'O nome da empresa deve ter pelo menos 2 caracteres.'),
    cnpj: z.string()
      .length(14, 'CNPJ deve ter 14 dígitos')
      .refine((val) => isValid(val) && val.match(/^\d+$/), {
        message: 'CNPJ inválido',
      }),
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
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas não coincidem.',
    path: ['confirmPassword'],
  });

export function CadastroForm() {
  const { toast } = useToast();
  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: '',
      sobrenome: '',
      email: '',
      password: '',
      confirmPassword: '',
      nomeEmpresa: '',
      cnpj: '',
      endereco: '',
      cidade: '',
      uf: '',
      cep: '',
      telefone: '',
    },
  });

  // Função para sanitizar os dados
  function sanitizeData(data: z.infer<typeof formSchema>) {
    return {
      nome: data.nome.trim(),
      sobrenome: data.sobrenome.trim(),
      email: data.email.trim().toLowerCase(),
      nomeEmpresa: data.nomeEmpresa.trim(),
      cnpj: data.cnpj.replace(/\D/g, ''), // Remover caracteres não numéricos
      endereco: data.endereco.trim(),
      cidade: data.cidade.trim(),
      uf: data.uf.toUpperCase(), // Converter para maiúsculas
      cep: data.cep.replace(/\D/g, ''), // Remover caracteres não numéricos
      telefone: data.telefone.replace(/\D/g, ''), // Remover caracteres não numéricos
    };
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setError(null);
    if (!auth || !firestore) return;

    try {
      // Sanitizar os dados antes de usar
      const sanitizedData = sanitizeData(values);

      // 1. Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        sanitizedData.email,
        values.password
      );
      const user = userCredential.user;

      // 2. Update Firebase Auth profile
      await updateProfile(user, {
        displayName: `${sanitizedData.nome} ${sanitizedData.sobrenome}`,
      });

      // 3. Create user profile in Firestore
      const userProfile = {
        uid: user.uid,
        email: user.email,
        nome: sanitizedData.nome,
        sobrenome: sanitizedData.sobrenome,
      };
      await setDoc(doc(firestore, 'users', user.uid), userProfile);

      // 4. Create workshop profile in Firestore
      const workshopProfile = {
        userId: user.uid,
        nomeEmpresa: sanitizedData.nomeEmpresa,
        cnpj: sanitizedData.cnpj,
        endereco: sanitizedData.endereco,
        cidade: sanitizedData.cidade,
        uf: sanitizedData.uf,
        cep: sanitizedData.cep,
        telefone: sanitizedData.telefone,
        email: sanitizedData.email,
        createdAt: new Date(),
      };
      await setDoc(doc(firestore, 'oficinas', user.uid), workshopProfile);

      toast({
        title: 'Cadastro realizado com sucesso!',
        description: 'Você será redirecionado para a tela de login.',
      });
      router.push('/login');
    } catch (error: any) {
      let errorMessage = 'Ocorreu um erro desconhecido.';
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'Este e-mail já está em uso por outra conta.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'A senha é muito fraca. Use pelo menos 6 caracteres.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'O e-mail fornecido é inválido.';
      }
      setError(errorMessage);
      toast({
        variant: 'destructive',
        title: 'Erro no Cadastro',
        description: errorMessage,
      });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
            <FormField
            control={form.control}
            name="nome"
            render={({ field }) => (
                <FormItem className='flex-1'>
                <FormLabel>Nome</FormLabel>
                <FormControl>
                    <Input placeholder="Seu nome" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
            control={form.control}
            name="sobrenome"
            render={({ field }) => (
                <FormItem className='flex-1'>
                <FormLabel>Sobrenome</FormLabel>
                <FormControl>
                    <Input placeholder="Seu sobrenome" {...field} />
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
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="seu@email.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Senha</FormLabel>
              <FormControl>
                <Input type="password" placeholder="Crie uma senha forte" {...field} />
              </FormControl>
               <p className="text-[0.8rem] text-muted-foreground">
                Mínimo 8 caracteres.
              </p>
              <FormMessage />
            </FormItem>
          )}
        />
         <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirmar Senha</FormLabel>
              <FormControl>
                <Input type="password" placeholder="Repita a senha" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Dados da Oficina */}
        <div className="border-t pt-4">
          <h3 className="text-lg font-medium mb-4">Dados da Oficina</h3>

          <FormField
            control={form.control}
            name="nomeEmpresa"
            render={({ field }) => (
              <FormItem className="mb-4">
                <FormLabel>Nome da Empresa</FormLabel>
                <FormControl>
                  <Input placeholder="Nome da sua oficina" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
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
              <FormItem className="mb-4">
                <FormLabel>Endereço</FormLabel>
                <FormControl>
                  <Input placeholder="Rua, número, complemento" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
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
        </div>

        {error && <p className="text-sm font-medium text-destructive">{error}</p>}
        <Button
          type="submit"
          className="w-full"
          disabled={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting ? 'Cadastrando...' : 'Criar Conta'}
        </Button>
      </form>
    </Form>
  );
}
