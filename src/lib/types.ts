'use client';

import { z } from 'zod';

export interface UserProfile {
  uid: string;
  email: string;
  nome: string;
  sobrenome: string;
  photoURL?: string | null;
  disabled?: boolean;
}

export interface Oficina {
  userId: string;
  nomeEmpresa: string;
  cnpj: string;
  endereco: string;
  cidade: string;
  uf: string;
  cep: string;
  telefone: string;
  email?: string;
  createdAt?: any;
}


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
  userId: string;
  codigo: string;
  descricao: string;
  valorPadrao: number;
  tempoMedio: number; // in hours
  categoria: string;
  ativo: boolean;
  createdAt?: any;
}

export interface Veiculo {
  id: string;
  userId: string;
  clienteId: string;
  placa: string;
  fabricante: string;
  modelo: string;
  ano: number;
  motor?: string;
  cilindros?: string;
  numeroMotor?: string;
  cliente?: Cliente; // Optional for denormalization
  createdAt?: any;
}

export interface Cliente {
  id: string;
  userId: string;
  nome: string;
  telefone: string;
  email: string;
  cep: string;
  endereco: string;
  numero: string;
  bairro: string;
  cidade: string;
  uf: string;
  pontoReferencia?: string;
  createdAt?: any;
}

export interface ItemOrcamento {
  itemId?: string; // ID from Peca or Servico
  tipo?: 'peca' | 'servico';
  descricao: string;
  quantidade: number;
  valorUnitario: number;
  valorTotal: number;
}

export interface Orcamento {
  id: string;
  userId: string;
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
  ordemServicoId?: string;
  createdAt?: any;
}


export interface ItemServico {
  descricao: string;
  valor: number;
}

export interface ItemPeca {
    descricao: string;
    quantidade: number;
    valorUnitario: number;
}


export interface OrdemServico {
  id: string;
  userId: string;
  orcamentoId?: string;
  clienteId: string;
  veiculoId: string;
  status: 'pendente' | 'andamento' | 'concluida' | 'cancelada';
  statusPagamento: 'Pendente' | 'Pago' | 'Vencido';
  dataEntrada: any;
  dataPrevisao: any;
  dataConclusao?: any;
  dataPagamento?: any;
  mecanicoResponsavel: string;
  servicos: ItemServico[];
  pecas: ItemPeca[];
  valorTotal: number;
  observacoes: string;
  cliente?: Cliente;
  veiculo?: Veiculo;
  createdAt?: any;
}

export interface Peca {
  id: string;
  userId: string;
  codigo: string;
  descricao: string;
  quantidadeEstoque: number;
  quantidadeReservada: number;
  quantidadeMinima: number;
  valorCompra: number;
  valorVenda: number;
  fornecedor: string;
  alertaEstoqueBaixo: boolean;
  createdAt?: any;
}

export interface Notificacao {
    id: string;
    userId: string;
    titulo: string;
    descricao: string;
    tipo: 'estoque'; // Add more types later if needed
    lida: boolean;
    createdAt: any;
}


// Tipos para o fluxo de IA, para que possam ser usados no frontend sem importar o Zod
export type DiagnosticoMotorInput = {
  sintomas: string;
  motorInfo: string;
  servicosDisponiveis: { codigo: string; descricao: string }[];
  pecasDisponiveis: { codigo: string; descricao: string }[];
};

export type DiagnosticoMotorOutput = {
  diagnosticoProvavel: string;
  planoDeAcao: {
    passo: string;
    isCritico: boolean;
  }[];
  servicosSugeridos: { codigo: string; descricao: string }[];
  pecasSugeridas: { codigo: string; descricao: string }[];
};
