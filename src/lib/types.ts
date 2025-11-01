export interface DashboardData {
  receitaMensal: number;
  receitaAnual: number;
  ordensAndamento: number;
  ordensConcluidas: number;
  orcamentosPendentes: number;
  metricasClientes: {
    totalClientes: number;
    novosEsteMes: number;
  };
}

export interface Servico {
  id: string;
  codigo: string;
  descricao: string;
  valorPadrao: number;
  tempoMedio: number; // in hours
  categoria: string;
  ativo: boolean;
}

export interface Veiculo {
  id: string;
  clienteId: string;
  placa: string;
  marca: string;
  modelo: string;
  ano: number;
  informacoesTecnicas: string;
  cliente?: Cliente; // Optional for denormalization
}

export interface Cliente {
  id: string;
  nome: string;
  telefone: string;
  email: string;
  endereco: string;
  createdAt?: any;
}

export interface ItemOrcamento {
  descricao: string;
  quantidade: number;
  valorUnitario: number;
  valorTotal: number;
}

export interface Orcamento {
  id: string;
  clienteId: string;
  veiculoId: string;
  dataCriacao: any; // Can be Date or Firestore Timestamp
  dataValidade: any; // Can be Date or Firestore Timestamp
  status: 'pendente' | 'aprovado' | 'rejeitado';
  itens: ItemOrcamento[];
  valorTotal: number;
  observacoes: string;
  pdfUrl?: string;
  cliente?: Cliente;
  veiculo?: Veiculo;
}

export interface OrdemServico {
  id: string;
  orcamentoId?: string;
  clienteId: string;
  veiculoId: string;
  status: 'pendente' | 'andamento' | 'concluida' | 'cancelada';
  dataEntrada: Date;
  dataPrevisao: Date;
  dataConclusao?: Date;
  mecanicoResponsavel: string;
  servicos: Array<{
    servicoId: string;
    descricao: string;
    valor: number;
    concluido: boolean;
  }>;
  pecas: Array<{
    pecaId: string;
    descricao: string;
    quantidade: number;
    valorUnitario: number;
  }>;
  valorTotal: number;
  observacoes: string;
  cliente?: Cliente;
  veiculo?: Veiculo;
}

export interface Peca {
  id: string;
  codigo: string;
  descricao: string;
  quantidadeEstoque: number;
  quantidadeMinima: number;
  valorCompra: number;
  valorVenda: number;
  fornecedor: string;
  alertaEstoqueBaixo: boolean;
}
