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

// AI Diagnosis Schemas
const ItemSchema = z.object({
  codigo: z.string(),
  descricao: z.string(),
});

export const DiagnosticoMotorInputSchema = z.object({
  sintomas: z.string().describe('Os sintomas observados no motor, descritos pelo mecânico ou cliente.'),
  motorInfo: z.string().describe('Informações sobre o motor (ex: VW AP 1.8, Fiat Fire 1.0).'),
  servicosDisponiveis: z.array(ItemSchema).describe('A lista de todos os serviços que a retífica oferece.'),
  pecasDisponiveis: z.array(ItemSchema).describe('A lista de todas as peças disponíveis no catálogo.'),
});
export type DiagnosticoMotorInput = z.infer<typeof DiagnosticoMotorInputSchema>;

export const DiagnosticoMotorOutputSchema = z.object({
  diagnosticoProvavel: z.string().describe('Um resumo técnico das causas mais prováveis para os sintomas, em uma ou duas frases.'),
  planoDeAcao: z.array(z.object({
      passo: z.string().describe('Ação de verificação ou diagnóstico a ser tomada.'),
      isCritico: z.boolean().describe('Indica se o passo é crítico para o diagnóstico.'),
  })).describe('Uma lista de passos investigativos para confirmar o diagnóstico.'),
  servicosSugeridos: z.array(ItemSchema).describe('Uma lista de serviços da retífica sugeridos para corrigir o problema. Deve usar APENAS itens da lista de `servicosDisponiveis`.'),
  pecasSugeridas: z.array(ItemSchema).describe('Uma lista de peças que provavelmente serão necessárias. Deve usar APENAS itens da lista de `pecasDisponiveis`.'),
});
export type DiagnosticoMotorOutput = z.infer<typeof DiagnosticoMotorOutputSchema>;
