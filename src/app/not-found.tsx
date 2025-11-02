'use client';

import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="flex h-screen w-screen flex-col items-center justify-center bg-background p-4 text-center">
      <AlertTriangle className="h-16 w-16 text-destructive mb-4" />
      <h1 className="text-4xl font-bold text-foreground mb-2">
        Erro 404
      </h1>
      <p className="text-xl text-muted-foreground mb-8">
        Página Não Encontrada
      </p>
      <div className="max-w-md">
        <p className="text-muted-foreground mb-6">
          Oops! O conteúdo que você está procurando não existe. Pode ter sido movido ou você digitou o endereço errado.
        </p>
        <Button asChild>
          <Link href="/">Voltar</Link>
        </Button>
      </div>
    </main>
  );
}
