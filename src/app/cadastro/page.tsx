'use client';

import { CadastroForm } from '@/components/auth/cadastro-form';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useUser } from '@/firebase';
import { Wrench } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function CadastroPage() {
    const router = useRouter();
    const { user, isUserLoading } = useUser();

    useEffect(() => {
        if (!isUserLoading && user) {
            router.push('/');
        }
    }, [user, isUserLoading, router]);

    if (isUserLoading || user) {
        return (
          <div className="flex h-screen w-screen items-center justify-center">
            Carregando...
          </div>
        );
      }

  return (
    <main className="flex h-screen w-screen items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <div className="w-full max-w-md mx-auto flex flex-col items-center text-center">
        <Wrench className="h-12 w-12 text-primary mb-4" />
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-50">
          Bem-vindo à Retífica Figueirêdo
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mb-8">
          Crie sua conta para gerenciar sua oficina
        </p>
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Cadastro</CardTitle>
            <CardDescription>
              Preencha os dados abaixo para criar sua conta.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CadastroForm />
          </CardContent>
           <CardFooter className="justify-center text-sm">
            <p className="text-muted-foreground">
              Já tem uma conta?{' '}
              <Link
                href="/login"
                className="font-semibold text-primary hover:underline"
              >
                Faça login
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </main>
  );
}
