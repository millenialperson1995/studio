'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card';
import { useCollection, useFirestore, useUser } from '@/firebase';
import { useMemoFirebase } from '@/firebase/provider';
import { collection, query, where } from 'firebase/firestore';
import type { Peca } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog';
import { AddPecaForm } from '@/components/estoque/add-peca-form';
import PecaTable from '@/components/estoque/peca-table';
import MobileLayout from '@/components/layout/mobile-layout';
import { PlusCircle } from 'lucide-react';

const ITEMS_PER_PAGE = 5;

function EstoqueContent() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const firestore = useFirestore();
  const { user } = useUser();
  const pecasCollectionRef = useMemoFirebase(
    () => (firestore && user?.uid ? query(collection(firestore, 'pecas'), where('userId', '==', user.uid)) : null),
    [firestore, user?.uid]
  );
  const { data: pecas, isLoading, error } = useCollection<Peca>(pecasCollectionRef);

  const totalPages = Math.ceil((pecas?.length || 0) / ITEMS_PER_PAGE);
  const paginatedPecas = pecas?.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  ) || [];

  if (isLoading) {
    return null; // Skeleton handled by AuthenticatedPage
  }

  return (
    <main className="flex-1 space-y-6 p-4 md:p-6 lg:p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Estoque de Peças</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Adicionar Peça
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Adicionar Nova Peça</DialogTitle>
              <DialogDescription>
                Preencha os dados para cadastrar uma nova peça no estoque.
              </DialogDescription>
            </DialogHeader>
            <AddPecaForm setDialogOpen={setIsDialogOpen} />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Controle de Estoque</CardTitle>
          <CardDescription>
            Gerencie as peças e produtos da sua retífica.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PecaTable pecas={paginatedPecas} />
          {error && (
            <div className="text-destructive text-center p-4">
              Ocorreu um erro ao carregar as peças. Tente novamente.
            </div>
          )}
        </CardContent>
        {totalPages > 1 && (
          <CardFooter>
            <div className="flex w-full items-center justify-between text-xs text-muted-foreground">
              <div>
                Página {currentPage} de {totalPages}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  Próxima
                </Button>
              </div>
            </div>
          </CardFooter>
        )}
      </Card>
    </main>
  );
}

export default function EstoquePage() {
  return (
    <MobileLayout>
      <EstoqueContent />
    </MobileLayout>
  );
}
