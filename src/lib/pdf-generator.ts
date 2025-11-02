'use client';

import jsPDF from 'jspdf';
import 'jspdf-autotable';
import type { Orcamento, Cliente, Veiculo } from './types';
import { format } from 'date-fns';

// Extend the jsPDF interface to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

export const generateOrcamentoPDF = (
  orcamento: Orcamento,
  cliente: Cliente,
  veiculo: Veiculo
) => {
  const doc = new jsPDF();
  const pageHeight = doc.internal.pageSize.getHeight();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  let currentY = 20;

  // 1. Header
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('RETÍFICA FIGUEIRÊDO', pageWidth / 2, currentY, { align: 'center' });
  currentY += 8;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const companyInfo = 'CNPJ: 33.925-338/0001-74 · Av. Presidente Kennedy, 1956, Peixinhos, OLINDA-PE · (81) 9.8836-6701';
  doc.text(companyInfo, pageWidth / 2, currentY, { align: 'center' });
  currentY += 10;
  
  doc.setLineWidth(0.5);
  doc.line(margin, currentY, pageWidth - margin, currentY);
  currentY += 8;

  // Orçamento Info
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(`Orçamento #: ${orcamento.id.substring(0, 8)}`, margin, currentY);
  const dataValidade = orcamento.dataValidade?.toDate ? orcamento.dataValidade.toDate() : new Date();
  doc.text(`Válido até: ${format(dataValidade, 'dd/MM/yyyy')}`, pageWidth - margin, currentY, { align: 'right' });
  currentY += 10;


  // 2. Client and Vehicle Info
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
    `Telefone: ${cliente.telefone}`,
    `Endereço: ${cliente.endereco}, ${cliente.numero} - ${cliente.bairro}`,
    `${cliente.cidade} - ${cliente.uf}, CEP: ${cliente.cep}`
  ];
  if (cliente.pontoReferencia) {
    clientLines.push(`Ref: ${cliente.pontoReferencia}`);
  }

  const vehicleLines = [
      `Veículo: ${veiculo.fabricante} ${veiculo.modelo}`,
      `Placa: ${veiculo.placa}`,
      `Ano: ${veiculo.ano}`,
      `Motor: ${veiculo.motor || 'N/A'}, Cilindros: ${veiculo.cilindros || 'N/A'}`
  ];

  doc.text(clientLines, margin, currentY, { maxWidth: halfWidth });
  doc.text(vehicleLines, margin + halfWidth + 10, currentY, { maxWidth: halfWidth });

  const clientBlockHeight = doc.getTextDimensions(clientLines.join('\n'), { maxWidth: halfWidth }).h;
  const vehicleBlockHeight = doc.getTextDimensions(vehicleLines.join('\n'), { maxWidth: halfWidth }).h;
  
  currentY += Math.max(clientBlockHeight, vehicleBlockHeight) + 10;
  
  doc.line(margin, currentY, pageWidth - margin, currentY);
  currentY += 5;

  // 3. Items Table
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

  // 4. Totals and Observations
  currentY = (doc as any).lastAutoTable.finalY + 10;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Valor Total:', 150, currentY, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.text(`R$ ${orcamento.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 195, currentY, { align: 'right' });
  currentY += 10;

  if(orcamento.observacoes) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Observações:', margin, currentY);
    currentY += 5;
    doc.setFont('helvetica', 'normal');
    doc.text(orcamento.observacoes, margin, currentY, { maxWidth: 180 });
  }

  // 5. Footer
  const pageCount = (doc as any).internal.getNumberOfPages();
  const footerY = pageHeight - 15;
  for(let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5);
    const dataCriacao = orcamento.dataCriacao?.toDate ? orcamento.dataCriacao.toDate() : new Date();

    doc.setFontSize(8);
    doc.text(`Orçamento gerado em: ${format(dataCriacao, 'dd/MM/yyyy')}.`, margin, footerY);
    doc.text(`Página ${i} de ${pageCount}`, pageWidth - margin, footerY, { align: 'right' });
  }

  // 6. Save the PDF
  doc.save(`Orcamento-${cliente.nome.split(' ')[0]}-${orcamento.id.substring(0, 4)}.pdf`);
};
