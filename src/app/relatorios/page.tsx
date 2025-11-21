'use client';

import { useMemo } from 'react';
import { useCollection, useFirestore, useUser, useVehicles } from '@/firebase';
import { useMemoFirebase } from '@/firebase/provider';
import { collection, query, where } from 'firebase/firestore';
import type { OrdemServico, Cliente } from '@/lib/types';
import FaturamentoAnualCard from '@/components/relatorios/faturamento-anual-card';
import ServicosRentaveisCard from '@/components/relatorios/servicos-rentaveis-card';
import ReceitaClienteCard from '@/components/relatorios/receita-cliente-card';
import HistoricoVeiculoCard from '@/components/relatorios/historico-veiculo-card';
import { toDate } from '@/lib/utils';
import MobileLayout from '@/components/layout/mobile-layout';


function RelatoriosContent() {
  const firestore = useFirestore();
  const { user } = useUser();
  const { vehicles, isLoading: isLoadingVehicles } = useVehicles();

  const ordensQuery = useMemoFirebase(
    () => (firestore && user?.uid ? query(collection(firestore, 'ordensServico'), where('userId', '==', user.uid), where('status', '==', 'concluida')) : null),
    [firestore, user?.uid]
  );

  const clientesQuery = useMemoFirebase(
    () => (firestore && user?.uid ? query(collection(firestore, 'clientes'), where('userId', '==', user.uid)) : null),
    [firestore, user?.uid]
  );

  const { data: ordensServico, isLoading: isLoadingOrdens } = useCollection<OrdemServico>(ordensQuery);
  const { data: clientes, isLoading: isLoadingClientes } = useCollection<Cliente>(clientesQuery);


  const faturamentoData = useMemo(() => {
    if (!ordensServico) return [];

    const now = new Date();
    const monthlyRevenue: { [key: string]: number } = {};
    const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

    // Initialize last 12 months
    for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthKey = `${monthNames[d.getMonth()]}/${d.getFullYear().toString().slice(-2)}`;
        monthlyRevenue[monthKey] = 0;
    }

    ordensServico.forEach(os => {
        if (os.status === 'concluida' && os.dataConclusao) {
            const conclusionDate = toDate(os.dataConclusao);
            const monthDiff = (now.getFullYear() - conclusionDate.getFullYear()) * 12 + (now.getMonth() - conclusionDate.getMonth());
            if (monthDiff >= 0 && monthDiff < 12) {
                 const monthKey = `${monthNames[conclusionDate.getMonth()]}/${conclusionDate.getFullYear().toString().slice(-2)}`;
                 monthlyRevenue[monthKey] = (monthlyRevenue[monthKey] || 0) + os.valorTotal;
            }
        }
    });

    return Object.keys(monthlyRevenue).map(month => ({
        month,
        revenue: monthlyRevenue[month],
    }));
  }, [ordensServico]);

  const servicosRentaveisData = useMemo(() => {
    if (!ordensServico) return [];
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const servicosCount: { [key: string]: number } = {};

    ordensServico
      .filter(os => toDate(os.dataConclusao) >= startOfMonth)
      .forEach(os => {
        os.servicos.forEach(servico => {
          servicosCount[servico.descricao] = (servicosCount[servico.descricao] || 0) + servico.valor;
        });
      });

    return Object.entries(servicosCount)
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [ordensServico]);

  const receitaClienteData = useMemo(() => {
    if (!ordensServico || !clientes) return [];
    const clientesMap = new Map(clientes.map(c => [c.id, c.nome]));
    const receitaCount: { [key: string]: number } = {};

    ordensServico.forEach(os => {
      const clientName = clientesMap.get(os.clienteId);
      if (clientName) {
        receitaCount[clientName] = (receitaCount[clientName] || 0) + os.valorTotal;
      }
    });

    return Object.entries(receitaCount)
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [ordensServico, clientes]);


  const isLoading = isLoadingOrdens || isLoadingClientes || isLoadingVehicles;

  if (isLoading) {
    return null;
  }

  return (
    <main className="flex-1 space-y-6 p-4 md:p-6 lg:p-8">
      <h1 className="text-2xl font-semibold">Relatórios</h1>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <FaturamentoAnualCard data={faturamentoData} />
        <ServicosRentaveisCard data={servicosRentaveisData} />
        <ReceitaClienteCard data={receitaClienteData} />
        <HistoricoVeiculoCard
            vehicles={vehicles || []}
            clients={clientes || []}
            ordensServico={ordensServico || []}
        />
      </div>
    </main>
  );
}

export default function RelatoriosPage() {
  return (
    <MobileLayout>
      <RelatoriosContent />
    </MobileLayout>
  );
}
