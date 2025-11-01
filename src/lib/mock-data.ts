import type { DashboardData, Cliente, Veiculo, OrdemServico, Orcamento } from './types';

const clientes: Cliente[] = [
  {
    id: 'cli-001',
    nome: 'João da Silva',
    telefone: '(11) 98765-4321',
    email: 'joao.silva@example.com',
    endereco: 'Rua das Flores, 123, São Paulo, SP',
    veiculos: [],
    historicoServicos: [],
  },
  {
    id: 'cli-002',
    nome: 'Maria Oliveira',
    telefone: '(21) 91234-5678',
    email: 'maria.oliveira@example.com',
    endereco: 'Avenida Copacabana, 456, Rio de Janeiro, RJ',
    veiculos: [],
    historicoServicos: [],
  },
  {
    id: 'cli-003',
    nome: 'Carlos Pereira',
    telefone: '(31) 99999-8888',
    email: 'carlos.pereira@example.com',
    endereco: 'Praça da Liberdade, 789, Belo Horizonte, MG',
    veiculos: [],
    historicoServicos: [],
  },
];

const veiculos: Veiculo[] = [
  {
    id: 'vei-001',
    clienteId: 'cli-001',
    placa: 'ABC-1234',
    marca: 'Volkswagen',
    modelo: 'Gol',
    ano: 2020,
    informacoesTecnicas: 'Motor 1.6 MSI',
    historicoServicos: [],
  },
  {
    id: 'vei-002',
    clienteId: 'cli-002',
    placa: 'XYZ-5678',
    marca: 'Chevrolet',
    modelo: 'Onix',
    ano: 2022,
    informacoesTecnicas: 'Motor 1.0 Turbo',
    historicoServicos: [],
  },
  {
    id: 'vei-003',
    clienteId: 'cli-003',
    placa: 'QWE-9101',
    marca: 'Fiat',
    modelo: 'Toro',
    ano: 2021,
    informacoesTecnicas: 'Motor 1.3 Turbo Diesel',
    historicoServicos: [],
  },
   {
    id: 'vei-004',
    clienteId: 'cli-001',
    placa: 'RTY-1121',
    marca: 'Honda',
    modelo: 'Civic',
    ano: 2023,
    informacoesTecnicas: 'Motor 2.0 Híbrido',
    historicoServicos: [],
  },
];

clientes[0].veiculos.push(veiculos[0], veiculos[3]);
clientes[1].veiculos.push(veiculos[1]);
clientes[2].veiculos.push(veiculos[2]);


export const dashboardData: DashboardData = {
  receitaMensal: 45850.75,
  receitaAnual: 489230.50,
  ordensAndamento: 12,
  ordensConcluidas: 58,
  orcamentosPendentes: 7,
  metricasClientes: {
    totalClientes: 215,
    novosEsteMes: 14,
  },
};

export const recentOrders: OrdemServico[] = [
  {
    id: 'os-001',
    clienteId: 'cli-001',
    veiculoId: 'vei-001',
    status: 'andamento',
    dataEntrada: new Date('2024-07-28T09:00:00'),
    dataPrevisao: new Date('2024-07-30T18:00:00'),
    mecanicoResponsavel: 'Pedro Martins',
    servicos: [],
    pecas: [],
    valorTotal: 2500.00,
    observacoes: 'Verificar barulho na suspensão dianteira.',
    cliente: clientes[0],
    veiculo: veiculos[0],
  },
  {
    id: 'os-002',
    clienteId: 'cli-002',
    veiculoId: 'vei-002',
    status: 'concluida',
    dataEntrada: new Date('2024-07-25T14:30:00'),
    dataPrevisao: new Date('2024-07-26T17:00:00'),
    dataConclusao: new Date('2024-07-26T16:45:00'),
    mecanicoResponsavel: 'Ana Souza',
    servicos: [],
    pecas: [],
    valorTotal: 850.50,
    observacoes: 'Troca de óleo e filtros.',
    cliente: clientes[1],
    veiculo: veiculos[1],
  },
  {
    id: 'os-003',
    clienteId: 'cli-003',
    veiculoId: 'vei-003',
    status: 'pendente',
    dataEntrada: new Date('2024-07-29T11:00:00'),
    dataPrevisao: new Date('2024-08-01T18:00:00'),
    mecanicoResponsavel: 'Aguardando',
    servicos: [],
    pecas: [],
    valorTotal: 5200.00,
    observacoes: 'Retífica completa do motor.',
    cliente: clientes[2],
    veiculo: veiculos[2],
  },
  {
    id: 'os-004',
    clienteId: 'cli-001',
    veiculoId: 'vei-004',
    status: 'cancelada',
    dataEntrada: new Date('2024-07-22T10:00:00'),
    dataPrevisao: new Date('2024-07-22T18:00:00'),
    mecanicoResponsavel: 'Pedro Martins',
    servicos: [],
    pecas: [],
    valorTotal: 300.00,
    observacoes: 'Cliente desistiu do reparo.',
    cliente: clientes[0],
    veiculo: veiculos[3],
  },
];

export const pendingQuotes: Orcamento[] = [
    {
    id: 'orc-001',
    clienteId: 'cli-003',
    veiculoId: 'vei-003',
    dataCriacao: new Date('2024-07-28'),
    dataValidade: new Date('2024-08-07'),
    status: 'pendente',
    itens: [],
    valorTotal: 5200.00,
    observacoes: 'Retífica completa do motor.',
    cliente: clientes[2],
    veiculo: veiculos[2],
  },
  {
    id: 'orc-002',
    clienteId: 'cli-001',
    veiculoId: 'vei-001',
    dataCriacao: new Date('2024-07-29'),
    dataValidade: new Date('2024-08-08'),
    status: 'pendente',
    itens: [],
    valorTotal: 780.00,
    observacoes: 'Troca de amortecedores traseiros.',
    cliente: clientes[0],
    veiculo: veiculos[0],
  }
];


export const revenueData = [
    { month: 'Fev', revenue: 42000 },
    { month: 'Mar', revenue: 48000 },
    { month: 'Abr', revenue: 39000 },
    { month: 'Mai', revenue: 52000 },
    { month: 'Jun', revenue: 55000 },
    { month: 'Jul', revenue: 45850 },
];
