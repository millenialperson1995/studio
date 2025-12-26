'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle, Search, ScrollText } from 'lucide-react';
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
import { collection, query, where, orderBy } from 'firebase/firestore';
import type { ResumoServico } from '@/lib/types';
import MobileLayout from '@/components/layout/mobile-layout';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

const ITEMS_PER_PAGE = 10;

function ResumosContent() {
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const firestore = useFirestore();
    const { user } = useUser();

    const resumosCollectionRef = useMemoFirebase(
        () => (firestore && user?.uid ? query(collection(firestore, 'resumos'), where('userId', '==', user.uid)) : null),
        [firestore, user?.uid]
    );

    const {
        data: rawResumos,
        isLoading,
        error,
    } = useCollection<ResumoServico>(resumosCollectionRef);

    const filteredResumos = useMemo(() => {
        if (!rawResumos) return [];

        // Sort by dataReferencia desc manually
        const sortedResumos = [...rawResumos].sort((a, b) => {
            const getDateVal = (r: ResumoServico) => {
                if (r.dataReferencia?.toDate) return r.dataReferencia.toDate().getTime();
                // Fallback for objects without dataReferencia but with mes/ano
                if (r.ano && r.mes) return new Date(r.ano, r.mes - 1, 1).getTime();
                // Fallback to createdAt
                return r.createdAt?.toDate ? r.createdAt.toDate().getTime() : 0;
            };

            return getDateVal(b) - getDateVal(a); // Descending
        });

        const lowercasedFilter = searchTerm.toLowerCase();
        return sortedResumos.filter(resumo => {
            const clienteNome = resumo.clienteNome?.toLowerCase() || '';
            const mesAno = `${resumo.mes}/${resumo.ano}`;
            const status = resumo.status === 'rascunho' ? 'rascunho' : 'fechado';

            return (
                clienteNome.includes(lowercasedFilter) ||
                mesAno.includes(searchTerm) ||
                status.includes(lowercasedFilter)
            );
        });
    }, [rawResumos, searchTerm]);

    const totalPages = Math.ceil((filteredResumos?.length || 0) / ITEMS_PER_PAGE);
    const paginatedResumos = filteredResumos?.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    ) || [];

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        }).format(value);
    };

    const getMonthName = (month: number) => {
        const months = [
            'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
            'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
        ];
        return months[month - 1] || '';
    };

    if (isLoading) {
        return null;
    }

    return (
        <MobileLayout>
            <main className="flex-1 space-y-6 p-4 md:p-6 lg:p-8 mb-20 md:mb-0">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <ScrollText className="h-6 w-6 text-primary" />
                        <h1 className="text-2xl font-semibold">Resumos de Serviços</h1>
                    </div>
                    <Button asChild>
                        <Link href="/resumos/novo">
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Novo Resumo
                        </Link>
                    </Button>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Histórico de Resumos</CardTitle>
                        <CardDescription>
                            Gerencie os fechamentos mensais de serviços por cliente.
                        </CardDescription>
                        <div className="pt-4 relative">
                            <Search className="absolute left-2.5 top-6 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar por cliente, mês (ex: 10/2025)..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-9"
                            />
                        </div>
                    </CardHeader>
                    <CardContent className="p-0 md:p-6">
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[70%]">Cliente</TableHead>
                                        <TableHead className="text-center w-[30%]">Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {paginatedResumos.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={2} className="h-24 text-center">
                                                Nenhum resumo encontrado.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        paginatedResumos.map((resumo) => (
                                            <TableRow key={resumo.id} className="cursor-pointer hover:bg-muted/50">
                                                <TableCell className="font-medium">
                                                    <Link href={`/resumos/${resumo.id}`} className="block w-full h-full">
                                                        {resumo.clienteNome}
                                                    </Link>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <Link href={`/resumos/${resumo.id}`} className="block w-full h-full">
                                                        <Badge variant={resumo.status === 'fechado' ? 'default' : 'secondary'}>
                                                            {resumo.status === 'fechado' ? 'Fechado' : 'Rascunho'}
                                                        </Badge>
                                                    </Link>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                    {totalPages > 1 && (
                        <CardFooter className="flex justify-between py-4">
                            <div className="text-xs text-muted-foreground">
                                Pág. {currentPage} de {totalPages}
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                >
                                    Ant
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                    disabled={currentPage === totalPages}
                                >
                                    Próx
                                </Button>
                            </div>
                        </CardFooter>
                    )}
                </Card>
            </main>
        </MobileLayout>
    );
}

export default function ResumosPage() {
    return <ResumosContent />;
}
