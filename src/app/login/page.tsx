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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth, useUser } from '@/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { setDoc, doc, getDoc } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Wrench } from 'lucide-react';


const formSchema = z.object({
  email: z.string().email('Formato de e-mail inválido.'),
  password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres.'),
});

export default function LoginPage() {
  const { toast } = useToast();
  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const [error, setError] = useState<string | null>(null);

  // Seed o primeiro usuário admin
  useEffect(() => {
    const seedAdminUser = async () => {
      if (auth && firestore) {
        try {
          // Tenta criar o usuário. Se já existir, vai dar um erro que será ignorado.
          const userCredential = await createUserWithEmailAndPassword(auth, 'admin@retifica.com', '123456');
          const user = userCredential.user;
          // Cria o documento do usuário no Firestore
           await setDoc(doc(firestore, "users", user.uid), {
            uid: user.uid,
            email: 'admin@retifica.com',
            displayName: 'Admin Retífica',
            role: 'admin',
            disabled: false,
          });
          console.log("Usuário admin e perfil criados com sucesso.");
        } catch (error: any) {
          if (error.code === 'auth/email-already-in-use') {
             console.log("Usuário admin de autenticação já existe.");
             // Garante que o perfil do admin existe no firestore, mesmo que a autenticação já exista.
             const adminEmail = 'admin@retifica.com';
             // NOTE: Não há uma forma direta de obter o UID a partir do e-mail no lado do cliente
             // sem fazer login. Como este é um script de seeding, a abordagem mais simples
             // é ignorar a criação do perfil se a autenticação já existe. O admin real
             // deve ser criado manualmente no console do Firebase ou por um script de admin.
          } else {
            console.error("Erro ao criar usuário admin:", error);
          }
        }
      }
    };

    if (!isUserLoading) {
        seedAdminUser();
    }
  }, [auth, firestore, isUserLoading]);

  useEffect(() => {
    if (!isUserLoading && user) {
      router.push('/');
    }
  }, [user, isUserLoading, router]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setError(null);
    if (!auth) return;
    
    try {
      await signInWithEmailAndPassword(auth, values.email, values.password);
      toast({
        title: 'Login bem-sucedido!',
        description: 'Você será redirecionado para o dashboard.',
      });
      router.push('/');
    } catch (error: any) {
      let errorMessage = 'Ocorreu um erro desconhecido. Tente novamente.';
      switch (error.code) {
        case 'auth/user-not-found':
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
          errorMessage = 'E-mail ou senha inválidos.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'O formato do e-mail é inválido.';
          break;
        case 'auth/user-disabled':
            errorMessage = 'Este usuário foi desativado.';
            break;
      }
      setError(errorMessage);
       toast({
        variant: 'destructive',
        title: 'Erro no Login',
        description: errorMessage,
      });
    }
  }
  
  if (isUserLoading || user) {
    // Render a loading state or nothing while redirecting
    return <div className="flex h-screen w-screen items-center justify-center">Carregando...</div>;
  }

  return (
    <main className="flex h-screen w-screen items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
       <div className="w-full max-w-sm mx-auto flex flex-col items-center text-center">
            <Wrench className="h-12 w-12 text-primary mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-50">Retífica Ágil</h1>
            <p className="text-gray-500 dark:text-gray-400 mb-8">Faça login para gerenciar sua oficina</p>
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Login</CardTitle>
          <CardDescription>Acesse o painel com seu e-mail e senha.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="email@exemplo.com" {...field} />
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
                      <Input type="password" placeholder="******" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {error && <p className="text-sm font-medium text-destructive">{error}</p>}
              <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Entrando...' : 'Entrar'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
      </div>
    </main>
  );
}
