'use client';

import jsPDF from 'jspdf';
import 'jspdf-autotable';
import type { Orcamento, Cliente, Veiculo, Oficina, OrdemServico } from './types';
import { format } from 'date-fns';

// Extend the jsPDF interface to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

// Function to get the logo and convert it to a data URI
const getLogoDataUri = (): string => {
  // Just return the path to the logo file
  return '/icons/logo.png';
};


const drawHeader = (doc: jsPDF, oficina: Oficina | null, title: string) => {
  const pageHeight = doc.internal.pageSize.getHeight();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  let currentY = 15;

  // Document Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text(title, pageWidth / 2, currentY, { align: 'center' });
  currentY += 8;

  doc.setLineWidth(0.5);
  doc.line(margin, currentY, pageWidth - margin, currentY);
  currentY += 8;

  const headerInitialY = currentY;

  // Logo - Move it up to align better
  doc.addImage(`${process.env.PUBLIC_URL || ''}${getLogoDataUri()}`, 'PNG', margin, headerInitialY, 25, 25);

  // Workshop Info
  const nomeEmpresa = oficina?.nomeEmpresa || 'Retífica Figueirêdo';

  const workshopInfoLines = [
    oficina?.cnpj ? `CNPJ: ${oficina.cnpj}` : null,
    oficina?.endereco ? `Endereço: ${oficina.endereco}` : null,
    (oficina?.cep || oficina?.telefone) ? `${oficina.cep ? `CEP: ${oficina.cep}` : ''}${oficina.cep && oficina.telefone ? '   |   ' : ''}${oficina.telefone ? `Telefone: ${oficina.telefone}` : ''}` : null,
    (oficina?.cidade || oficina?.uf) ? `Cidade: ${oficina.cidade || ''} - ${oficina.uf || ''}` : null,
    oficina?.email ? `Email: ${oficina.email}` : null
  ].filter(Boolean) as string[]; // Filter out null/undefined lines

  const workshopInfoX = pageWidth - margin;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(nomeEmpresa, workshopInfoX, headerInitialY + 5, { align: 'right' });
  currentY = headerInitialY + 12;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(workshopInfoLines, workshopInfoX, currentY, { align: 'right' });

  const workshopInfoHeight = doc.getTextDimensions(workshopInfoLines.join('\n')).h;

  // Return Y position after the tallest element in the header section
  return Math.max(headerInitialY + 25 + 8, headerInitialY + workshopInfoHeight + 12);
}

const drawFooter = (doc: jsPDF, documentType: string, creationDate: Date) => {
  const pageCount = (doc as any).internal.getNumberOfPages();
  const pageHeight = doc.internal.pageSize.getHeight();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  const footerY = pageHeight - 15;

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5);

    doc.setFontSize(8);
    doc.text(`${documentType} gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm')}.`, margin, footerY);
    doc.text(`Página ${i} de ${pageCount}`, pageWidth - margin, footerY, { align: 'right' });
  }
}


export const generateOrcamentoPDF = async (
  orcamento: Orcamento,
  cliente: Cliente,
  veiculo: Veiculo,
  oficina: Oficina | null
) => {
  const doc = new jsPDF();
  const pageHeight = doc.internal.pageSize.getHeight();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;

  let currentY = drawHeader(doc, oficina, 'Orçamento');
  currentY += 5;

  // Orçamento Info
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(`Orçamento #: ${orcamento.id.substring(0, 8)}`, margin, currentY);
  const dataValidade = orcamento.dataValidade?.toDate ? orcamento.dataValidade.toDate() : new Date();
  doc.text(`Válido até: ${format(dataValidade, 'dd/MM/yyyy')}`, pageWidth - margin, currentY, { align: 'right' });
  currentY += 10;


  // Client and Vehicle Info
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Informações do Cliente e Veículo', margin, currentY);
  currentY += 8;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  const contentWidth = pageWidth - margin * 2;
  const halfWidth = contentWidth / 2 - 5;

  const clientLines = [
    `Cliente: ${cliente.nome}`,
    cliente.telefone ? `Telefone: ${cliente.telefone}` : null,
    cliente.endereco ? `Endereço: ${cliente.endereco}, ${cliente.numero || 'S/N'} - ${cliente.bairro || ''}` : null,
    (cliente.cidade || cliente.uf || cliente.cep) ? `${cliente.cidade || ''} - ${cliente.uf || ''}, CEP: ${cliente.cep || ''}` : null,
    cliente.pontoReferencia ? `Ref: ${cliente.pontoReferencia}` : null,
  ].filter(Boolean) as string[];

  const vehicleLines = [
    `Veículo: ${veiculo.fabricante} ${veiculo.modelo}`,
    `Placa: ${veiculo.placa}`,
    veiculo.ano ? `Ano: ${veiculo.ano}` : null,
    (veiculo.motor || veiculo.cilindros) ? `Motor: ${veiculo.motor || 'N/A'}, Cilindros: ${veiculo.cilindros || 'N/A'}` : null,
    veiculo.numeroMotor ? `Nº Motor: ${veiculo.numeroMotor}` : null,
  ].filter(Boolean) as string[];

  // Position vehicle info to the right
  doc.text(clientLines, margin, currentY, { maxWidth: halfWidth });
  doc.text(vehicleLines, margin + halfWidth + 10, currentY, { maxWidth: halfWidth });

  const clientBlockHeight = doc.getTextDimensions(clientLines.join('\n'), { maxWidth: halfWidth }).h;
  const vehicleBlockHeight = doc.getTextDimensions(vehicleLines.join('\n'), { maxWidth: halfWidth }).h;

  currentY += Math.max(clientBlockHeight, vehicleBlockHeight) + 10;

  doc.line(margin, currentY, pageWidth - margin, currentY);
  currentY += 5;

  // Items Table
  const tableColumn = ["Descrição", "Tipo", "Qtd.", "Vlr. Unitário", "Subtotal"];
  const tableRows = orcamento.itens.map(item => [
    item.descricao,
    item.tipo === 'peca' ? 'Peça' : 'Serviço',
    item.quantidade.toFixed(2),
    `R$ ${item.valorUnitario.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
    `R$ ${item.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
  ]);

  doc.autoTable({
    startY: currentY,
    head: [tableColumn],
    body: tableRows,
    theme: 'striped',
    headStyles: { fillColor: [38, 50, 56] }, // Dark blue-gray
    styles: {
      fontSize: 9,
    },
  });

  // Totals and Observations
  currentY = (doc as any).lastAutoTable.finalY + 10;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Valor Total:', 150, currentY, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.text(`R$ ${orcamento.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 195, currentY, { align: 'right' });
  currentY += 10;

  if (orcamento.observacoes) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Observações:', margin, currentY);
    currentY += 5;
    doc.setFont('helvetica', 'normal');
    doc.text(orcamento.observacoes, margin, currentY, { maxWidth: 180 });
  }

  // Footer
  const dataCriacao = orcamento.dataCriacao?.toDate ? orcamento.dataCriacao.toDate() : new Date();
  drawFooter(doc, 'Orçamento', dataCriacao);

  // Save the PDF
  doc.save(`Orcamento-${cliente.nome.split(' ')[0]}-${orcamento.id.substring(0, 4)}.pdf`);
};


export const generateOrdemServicoPDF = async (
  ordem: OrdemServico,
  cliente: Cliente,
  veiculo: Veiculo,
  oficina: Oficina | null
) => {
  const doc = new jsPDF();
  const pageHeight = doc.internal.pageSize.getHeight();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;

  let currentY = drawHeader(doc, oficina, 'Ordem de Serviço');
  currentY += 5;

  // OS Info
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(`Ordem de Serviço #: ${ordem.id.substring(0, 8)}`, margin, currentY);
  const dataEntrada = ordem.dataEntrada?.toDate ? ordem.dataEntrada.toDate() : new Date();
  doc.text(`Data de Entrada: ${format(dataEntrada, 'dd/MM/yyyy')}`, pageWidth - margin, currentY, { align: 'right' });
  currentY += 10;

  // Client and Vehicle Info
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Informações do Cliente e Veículo', margin, currentY);
  currentY += 8;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  const contentWidth = pageWidth - margin * 2;
  const halfWidth = contentWidth / 2 - 5;

  const clientLines = [
    `Cliente: ${cliente.nome}`,
    cliente.telefone ? `Telefone: ${cliente.telefone}` : null,
  ].filter(Boolean) as string[];

  const vehicleLines = [
    `Veículo: ${veiculo.fabricante} ${veiculo.modelo}`,
    `Placa: ${veiculo.placa}`,
    veiculo.ano ? `Ano: ${veiculo.ano}` : null,
  ].filter(Boolean) as string[];

  // Position vehicle info to the right
  doc.text(clientLines, margin, currentY, { maxWidth: halfWidth });
  doc.text(vehicleLines, margin + halfWidth + 10, currentY, { maxWidth: halfWidth });

  const clientBlockHeight = doc.getTextDimensions(clientLines.join('\n'), { maxWidth: halfWidth }).h;
  const vehicleBlockHeight = doc.getTextDimensions(vehicleLines.join('\n'), { maxWidth: halfWidth }).h;
  currentY += Math.max(clientBlockHeight, vehicleBlockHeight) + 10;


  doc.line(margin, currentY, pageWidth - margin, currentY);
  currentY += 5;

  // Items Table
  if (ordem.servicos.length > 0) {
    currentY += 5;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Serviços a Executar', margin, currentY);
    currentY += 2;
    doc.autoTable({
      startY: currentY,
      head: [["Descrição", "Valor"]],
      body: ordem.servicos.map(s => [s.descricao, `R$ ${s.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`]),
      theme: 'striped',
      headStyles: { fillColor: [38, 50, 56] },
    });
    currentY = (doc as any).lastAutoTable.finalY;
  }

  if (ordem.pecas.length > 0) {
    currentY += 8;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Peças a Utilizar', margin, currentY);
    currentY += 2;
    doc.autoTable({
      startY: currentY,
      head: [["Qtd.", "Descrição", "Vlr. Unitário", "Subtotal"]],
      body: ordem.pecas.map(p => [
        p.quantidade.toFixed(2),
        p.descricao,
        `R$ ${p.valorUnitario.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        `R$ ${(p.quantidade * p.valorUnitario).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
      ]),
      theme: 'striped',
      headStyles: { fillColor: [38, 50, 56] },
    });
    currentY = (doc as any).lastAutoTable.finalY;
  }

  // Totals and Observations
  currentY += 10;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Valor Total:', 150, currentY, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.text(`R$ ${ordem.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 195, currentY, { align: 'right' });
  currentY += 10;

  if (ordem.observacoes) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Observações:', margin, currentY);
    currentY += 5;
    doc.setFont('helvetica', 'normal');
    doc.text(ordem.observacoes, margin, currentY, { maxWidth: 180 });
    currentY += 15;
  }

  // Signature line
  const signatureY = pageHeight - 50;
  if (currentY > signatureY - 20) { // Check if there's enough space
    doc.addPage();
    currentY = 20; // Reset Y on new page
  }
  doc.line(margin + 30, signatureY, pageWidth - margin - 30, signatureY);
  doc.text('Assinatura do Cliente', pageWidth / 2, signatureY + 5, { align: 'center' });

  // Footer
  drawFooter(doc, 'Ordem de Serviço', dataEntrada);

  // Save the PDF
  doc.save(`OS-${cliente.nome.split(' ')[0]}-${ordem.id.substring(0, 4)}.pdf`);
};

import { ResumoServico } from './types';

export const generateResumoPDF = async (
  resumo: ResumoServico,
  oficina: Oficina | null
) => {
  const doc = new jsPDF();
  const pageHeight = doc.internal.pageSize.getHeight();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;

  // Use the same header as orcamento
  let currentY = drawHeader(doc, oficina, 'Resumo de Serviços');
  currentY += 5;

  // Resumo Info (similar to orcamento info line)
  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  const mesExtenso = monthNames[resumo.mes - 1] || '';

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(`Resumo #: ${resumo.id.substring(0, 8)}`, margin, currentY);
  doc.text(`Período: ${mesExtenso}/${resumo.ano}`, pageWidth - margin, currentY, { align: 'right' });
  currentY += 10;

  // Client Info Section
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Informações do Cliente', margin, currentY);
  currentY += 8;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Cliente: ${resumo.clienteNome}`, margin, currentY);
  currentY += 6;
  doc.text(`Status: ${resumo.status === 'fechado' ? 'Fechado' : 'Rascunho'}`, margin, currentY);
  currentY += 10;

  doc.line(margin, currentY, pageWidth - margin, currentY);
  currentY += 5;

  // Items Table (same style as orcamento)
  const tableColumn = ["Veículo/Motor", "Descrição", "Mês", "Ano", "Valor"];
  const tableRows = resumo.itens.map(item => [
    item.veiculo,
    item.descricao,
    monthNames[item.mes - 1]?.substring(0, 3) || item.mes.toString(),
    item.ano.toString(),
    `R$ ${item.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
  ]);

  doc.autoTable({
    startY: currentY,
    head: [tableColumn],
    body: tableRows,
    theme: 'striped',
    headStyles: { fillColor: [38, 50, 56] }, // Same dark blue-gray as orcamento
    styles: {
      fontSize: 9,
    },
    columnStyles: {
      0: { cellWidth: 35 },  // Veículo
      1: { cellWidth: 'auto' }, // Descrição
      2: { halign: 'center', cellWidth: 20 }, // Mês
      3: { halign: 'center', cellWidth: 20 }, // Ano
      4: { halign: 'right', cellWidth: 30 }  // Valor
    }
  });

  // Total
  currentY = (doc as any).lastAutoTable.finalY + 10;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Valor Total:', 150, currentY, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.text(`R$ ${resumo.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 195, currentY, { align: 'right' });
  currentY += 10;

  // Observations (if any)
  if (resumo.observacoes) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Observações:', margin, currentY);
    currentY += 5;
    doc.setFont('helvetica', 'normal');
    doc.text(resumo.observacoes, margin, currentY, { maxWidth: 180 });
  }

  // Footer (same style as orcamento)
  const dataCriacao = resumo.createdAt?.toDate ? resumo.createdAt.toDate() : new Date();
  drawFooter(doc, 'Resumo de Serviços', dataCriacao);

  // Save the PDF
  const fileName = `Resumo-${resumo.clienteNome.replace(/\s+/g, '-')}-${mesExtenso}-${resumo.ano}.pdf`;
  doc.save(fileName);
};
