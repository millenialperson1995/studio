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

const passwordValidation = new RegExp(
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
);

const formSchema = z
  .object({
    nome: z.string().min(2, 'O nome deve ter pelo menos 2 caracteres.'),
    sobrenome: z.string().min(2, 'O sobrenome deve ter pelo menos 2 caracteres.'),
    email: z.string().email('Formato de e-mail inválido.'),
    password: z
      .string()
      .min(8, 'A senha deve ter no mínimo 8 caracteres.')
      .regex(passwordValidation, {
        message: 'A senha precisa conter letra maiúscula, minúscula, número e símbolo.',
      }),
    confirmPassword: z.string(),
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
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setError(null);
    if (!auth || !firestore) return;

    try {
      // 1. Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        values.email,
        values.password
      );
      const user = userCredential.user;

      // 2. Update Firebase Auth profile
      await updateProfile(user, {
        displayName: `${values.nome} ${values.sobrenome}`,
      });

      // 3. Create user profile in Firestore
      const userProfile = {
        uid: user.uid,
        email: user.email,
        nome: values.nome,
        sobrenome: values.sobrenome,
      };
      await setDoc(doc(firestore, 'users', user.uid), userProfile);

      toast({
        title: 'Cadastro realizado com sucesso!',
        description: 'Você será redirecionado para a tela de login.',
      });
      router.push('/login');
    } catch (error: any) {
      let errorMessage = 'Ocorreu um erro desconhecido.';
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'Este e-mail já está em uso por outra conta.';
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
                Mínimo 8 caracteres, com maiúscula, minúscula, número e símbolo.
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
