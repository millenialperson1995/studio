'use client';

import { useState, useEffect, useMemo, use } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
    CardFooter,
} from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { ArrowLeft, Plus, Save, Trash2, Printer, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useUser, useCollection } from '@/firebase';
import { useMemoFirebase } from '@/firebase/provider';
import { collection, query, where, orderBy, doc, getDoc, setDoc, updateDoc, addDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import type { Cliente, ResumoServico, ItemResumo } from '@/lib/types';
import MobileLayout from '@/components/layout/mobile-layout';
import Link from 'next/link';
import { generateResumoPDF } from '@/lib/pdf-generator';
import { DatePicker } from '@/components/ui/date-picker';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

interface PageProps {
    params: Promise<{
        id: string;
    }>;
}

export default function ResumoEditPage({ params }: PageProps) {
    const { id } = use(params);
    const router = useRouter();
    const { toast } = useToast();
    const firestore = useFirestore();
    const { user } = useUser();
    const isNew = id === 'novo';

    // Form States
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(!isNew);
    const [clienteId, setClienteId] = useState('');
    const [dataReferencia, setDataReferencia] = useState<Date | undefined>(new Date());
    const [itens, setItens] = useState<ItemResumo[]>([
        { veiculo: '', descricao: '', valor: 0, mes: new Date().getMonth() + 1, ano: new Date().getFullYear() }
    ]);
    const [observacoes, setObservacoes] = useState('');
    const [status, setStatus] = useState<'rascunho' | 'fechado'>('rascunho');

    // PDF Filter Dialog States
    const [showPdfDialog, setShowPdfDialog] = useState(false);
    const [pdfMes, setPdfMes] = useState<number>(new Date().getMonth() + 1);
    const [pdfAno, setPdfAno] = useState<number>(new Date().getFullYear());

    // Pagination States
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 5;

    // Fetch Clients
    const clientesCollectionRef = useMemoFirebase(
        () => (firestore && user?.uid ? query(collection(firestore, 'clientes'), where('userId', '==', user.uid), orderBy('createdAt', 'desc')) : null),
        [firestore, user?.uid]
    );
    const { data: rawClientes } = useCollection<Cliente>(clientesCollectionRef);

    // Sort clients alphabetically for the dropdown
    const clientes = useMemo(() => {
        if (!rawClientes) return [];
        return [...rawClientes].sort((a, b) => (a.nome || '').localeCompare(b.nome || ''));
    }, [rawClientes]);

    // Fetch Existing Resumo
    useEffect(() => {
        if (isNew || !firestore || !user?.uid) return;

        const fetchResumo = async () => {
            try {
                const docRef = doc(firestore, 'resumos', id);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const data = docSnap.data() as ResumoServico;
                    if (data.userId !== user.uid) {
                        toast({ title: 'Erro', description: 'Permissão negada.', variant: 'destructive' });
                        router.push('/resumos');
                        return;
                    }
                    setClienteId(data.clienteId);

                    // Handle Data Referencia
                    if (data.dataReferencia) {
                        // Check if it's a Firestore Timestamp
                        if (data.dataReferencia.toDate) {
                            setDataReferencia(data.dataReferencia.toDate());
                        } else if (data.dataReferencia instanceof Date) {
                            setDataReferencia(data.dataReferencia);
                        } else {
                            // Fallback if string or other?
                            setDataReferencia(new Date());
                        }
                    } else {
                        // Fallback implementation for old records if any
                        const d = new Date();
                        d.setMonth((data.mes || 1) - 1);
                        d.setFullYear(data.ano || d.getFullYear());
                        setDataReferencia(d);
                    }

                    setItens(data.itens);
                    setObservacoes(data.observacoes || '');
                    setStatus(data.status);
                } else {
                    toast({ title: 'Erro', description: 'Resumo não encontrado.', variant: 'destructive' });
                    router.push('/resumos');
                }
            } catch (error) {
                console.error("Error fetching resumo:", error);
                toast({ title: 'Erro', description: 'Falha ao carregar dados.', variant: 'destructive' });
            } finally {
                setInitialLoading(false);
            }
        };

        fetchResumo();
    }, [id, isNew, firestore, user?.uid, router, toast]);

    // Calculations
    const valorTotal = itens.reduce((acc, item) => acc + (Number(item.valor) || 0), 0);

    // Pagination
    const totalPages = Math.ceil(itens.length / ITEMS_PER_PAGE);
    const paginatedItens = itens.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    // Handlers
    const handleAddItem = () => {
        // Add new item at the BEGINNING (index 0)
        setItens([{ veiculo: '', descricao: '', valor: 0, mes: new Date().getMonth() + 1, ano: new Date().getFullYear() }, ...itens]);
        // Reset to first page to show the new item
        setCurrentPage(1);
    };

    const handleRemoveItem = (paginatedIndex: number) => {
        // Calculate actual index in full array
        const actualIndex = (currentPage - 1) * ITEMS_PER_PAGE + paginatedIndex;
        const newItens = [...itens];
        newItens.splice(actualIndex, 1);
        setItens(newItens);

        // If this was the last item on the page and we're not on page 1, go back one page
        if (paginatedItens.length === 1 && currentPage > 1) {
            setCurrentPage(currentPage - 1);
        }
    };

    const handleItemChange = (paginatedIndex: number, field: keyof ItemResumo, value: any) => {
        // Calculate actual index in full array
        const actualIndex = (currentPage - 1) * ITEMS_PER_PAGE + paginatedIndex;
        const newItens = [...itens];
        newItens[actualIndex] = { ...newItens[actualIndex], [field]: value };
        setItens(newItens);
    };

    const handlePrint = () => {
        if (!clienteId) {
            toast({ title: 'Atenção', description: 'Selecione um cliente.', variant: 'destructive' });
            return;
        }
        setShowPdfDialog(true);
    };

    const generateFilteredPDF = async () => {
        if (!clienteId) return;

        const clienteNome = clientes?.find(c => c.id === clienteId)?.nome || 'Cliente Desconhecido';

        // Filter items by selected month/year
        const filteredItens = itens.filter(item => item.mes === pdfMes && item.ano === pdfAno);

        if (filteredItens.length === 0) {
            toast({ title: 'Atenção', description: 'Nenhum serviço encontrado para este mês/ano.', variant: 'destructive' });
            return;
        }

        // Calculate total for filtered items only
        const filteredTotal = filteredItens.reduce((acc, item) => acc + (Number(item.valor) || 0), 0);

        const resumoData: ResumoServico = {
            id: id,
            userId: user?.uid || '',
            clienteId,
            clienteNome,
            mes: pdfMes,
            ano: pdfAno,
            dataReferencia: Timestamp.fromDate(new Date(pdfAno, pdfMes - 1, 1)),
            itens: filteredItens.map(i => ({ ...i, valor: Number(i.valor) })),
            valorTotal: filteredTotal,
            status,
            observacoes,
        };

        console.log('Gerando PDF filtrado:', resumoData);

        try {
            await generateResumoPDF(resumoData, null);
            toast({ title: 'Sucesso', description: 'PDF gerado com sucesso!' });
            setShowPdfDialog(false);
        } catch (error) {
            console.error("Erro ao gerar PDF:", error);
            toast({ title: 'Erro', description: 'Falha ao gerar PDF.', variant: 'destructive' });
        }
    };

    const handeSave = async () => {
        if (!clienteId) {
            toast({ title: 'Atenção', description: 'Selecione um cliente.', variant: 'destructive' });
            return;
        }
        if (!dataReferencia) {
            toast({ title: 'Atenção', description: 'Selecione uma data de referência.', variant: 'destructive' });
            return;
        }

        if (!firestore || !user?.uid) return;

        setLoading(true);
        try {
            const clienteNome = clientes?.find(c => c.id === clienteId)?.nome || 'Cliente Desconhecido';
            const mes = dataReferencia.getMonth() + 1;
            const ano = dataReferencia.getFullYear();

            if (isNew) {
                // Creating new - include createdAt
                const resumoData = {
                    userId: user.uid,
                    clienteId,
                    clienteNome,
                    mes,
                    ano,
                    dataReferencia: Timestamp.fromDate(dataReferencia),
                    itens: itens.map(i => ({ ...i, valor: Number(i.valor) })),
                    valorTotal,
                    status,
                    observacoes,
                    createdAt: serverTimestamp(),
                };
                await addDoc(collection(firestore, 'resumos'), resumoData);
                toast({ title: 'Sucesso', description: 'Resumo criado!' });
                router.push('/resumos');
            } else {
                // Updating existing - DON'T include createdAt
                const resumoData = {
                    userId: user.uid,
                    clienteId,
                    clienteNome,
                    mes,
                    ano,
                    dataReferencia: Timestamp.fromDate(dataReferencia),
                    itens: itens.map(i => ({ ...i, valor: Number(i.valor) })),
                    valorTotal,
                    status,
                    observacoes,
                };
                await updateDoc(doc(firestore, 'resumos', id), resumoData);
                toast({ title: 'Sucesso', description: 'Resumo atualizado!' });
            }
        } catch (error) {
            console.error("Error saving resumo:", error);
            toast({ title: 'Erro', description: 'Erro ao salvar.', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    if (initialLoading) {
        return (
            <MobileLayout>
                <div className="flex items-center justify-center h-screen">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            </MobileLayout>
        );
    }

    return (
        <MobileLayout>
            <main className="flex-1 space-y-6 p-4 md:p-6 lg:p-8 mb-20 md:mb-0">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" asChild>
                            <Link href="/resumos">
                                <ArrowLeft className="h-5 w-5" />
                            </Link>
                        </Button>
                        <h1 className="text-xl font-semibold">{isNew ? 'Novo Resumo' : 'Editar Resumo'}</h1>
                    </div>
                    <div className="flex gap-2">
                        {!isNew && (
                            <Button variant="outline" onClick={handlePrint}>
                                <Printer className="mr-2 h-4 w-4" />
                                PDF
                            </Button>
                        )}
                        <Button onClick={handeSave} disabled={loading}>
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            Salvar
                        </Button>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Dados do Resumo</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Cliente</label>
                            <Select value={clienteId} onValueChange={setClienteId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione o Cliente" />
                                </SelectTrigger>
                                <SelectContent>
                                    {clientes?.map((cliente) => (
                                        <SelectItem key={cliente.id} value={cliente.id}>
                                            {cliente.nome}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Status</label>
                            <Select value={status} onValueChange={(v: any) => setStatus(v)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="rascunho">Rascunho</SelectItem>
                                    <SelectItem value="fechado">Fechado</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                <Card className="overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Itens de Serviço</CardTitle>
                        <Button variant="outline" size="sm" onClick={handleAddItem}>
                            <Plus className="mr-2 h-4 w-4" />
                            Adicionar Linha
                        </Button>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="min-w-[120px] md:w-[18%]">Veículo/Motor</TableHead>
                                        <TableHead className="min-w-[150px] md:w-[30%]">Descrição</TableHead>
                                        <TableHead className="min-w-[90px] md:w-[12%] text-center">Mês</TableHead>
                                        <TableHead className="min-w-[90px] md:w-[12%] text-center">Ano</TableHead>
                                        <TableHead className="min-w-[100px] md:w-[15%] text-right">Valor</TableHead>
                                        <TableHead className="w-[50px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {paginatedItens.map((item, index) => (
                                        <TableRow key={index}>
                                            <TableCell>
                                                <Input
                                                    value={item.veiculo}
                                                    onChange={(e) => handleItemChange(index, 'veiculo', e.target.value)}
                                                    placeholder="Ex: Prisma 1.4"
                                                    className="h-9 min-w-[110px]"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Input
                                                    value={item.descricao}
                                                    onChange={(e) => handleItemChange(index, 'descricao', e.target.value)}
                                                    placeholder="Ex: Retífica de motor"
                                                    className="h-9 min-w-[140px]"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Select value={String(item.mes)} onValueChange={(v) => handleItemChange(index, 'mes', Number(v))}>
                                                    <SelectTrigger className="h-9 min-w-[85px]">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="1">Jan</SelectItem>
                                                        <SelectItem value="2">Fev</SelectItem>
                                                        <SelectItem value="3">Mar</SelectItem>
                                                        <SelectItem value="4">Abr</SelectItem>
                                                        <SelectItem value="5">Mai</SelectItem>
                                                        <SelectItem value="6">Jun</SelectItem>
                                                        <SelectItem value="7">Jul</SelectItem>
                                                        <SelectItem value="8">Ago</SelectItem>
                                                        <SelectItem value="9">Set</SelectItem>
                                                        <SelectItem value="10">Out</SelectItem>
                                                        <SelectItem value="11">Nov</SelectItem>
                                                        <SelectItem value="12">Dez</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </TableCell>
                                            <TableCell>
                                                <Select value={String(item.ano)} onValueChange={(v) => handleItemChange(index, 'ano', Number(v))}>
                                                    <SelectTrigger className="h-9 min-w-[85px]">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {Array.from({ length: 11 }, (_, i) => 2020 + i).map(year => (
                                                            <SelectItem key={year} value={String(year)}>{year}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </TableCell>
                                            <TableCell>
                                                <Input
                                                    type="number"
                                                    value={item.valor}
                                                    onChange={(e) => handleItemChange(index, 'valor', e.target.value)}
                                                    className="h-9 text-right min-w-[95px]"
                                                    step="0.01"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(index)} className="h-8 w-8 text-destructive hover:text-destructive/90">
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {itens.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                                Nenhum item adicionado. Clique em "Adicionar Linha".
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                        {totalPages > 1 && (
                            <div className="flex items-center justify-between px-4 py-3 border-t">
                                <div className="text-sm text-muted-foreground">
                                    Página {currentPage} de {totalPages} • {itens.length} {itens.length === 1 ? 'item' : 'itens'} total
                                </div>
                                <div className="flex gap-2">
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
                        )}
                    </CardContent>
                </Card>
            </main>

            {/* PDF Filter Dialog */}
            <Dialog open={showPdfDialog} onOpenChange={setShowPdfDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Selecione o Mês para o PDF</DialogTitle>
                        <DialogDescription>
                            Escolha o mês e ano que deseja incluir no PDF. Apenas os serviços deste período serão incluídos.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Mês</label>
                                <Select value={String(pdfMes)} onValueChange={(v) => setPdfMes(Number(v))}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="1">Janeiro</SelectItem>
                                        <SelectItem value="2">Fevereiro</SelectItem>
                                        <SelectItem value="3">Março</SelectItem>
                                        <SelectItem value="4">Abril</SelectItem>
                                        <SelectItem value="5">Maio</SelectItem>
                                        <SelectItem value="6">Junho</SelectItem>
                                        <SelectItem value="7">Julho</SelectItem>
                                        <SelectItem value="8">Agosto</SelectItem>
                                        <SelectItem value="9">Setembro</SelectItem>
                                        <SelectItem value="10">Outubro</SelectItem>
                                        <SelectItem value="11">Novembro</SelectItem>
                                        <SelectItem value="12">Dezembro</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Ano</label>
                                <Input
                                    type="number"
                                    value={pdfAno}
                                    onChange={(e) => setPdfAno(Number(e.target.value))}
                                    placeholder="2025"
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowPdfDialog(false)}>
                            Cancelar
                        </Button>
                        <Button onClick={generateFilteredPDF}>
                            <Printer className="mr-2 h-4 w-4" />
                            Gerar PDF
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </MobileLayout>
    );
}
