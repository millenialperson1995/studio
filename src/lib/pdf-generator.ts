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
    // This is the base64 representation of your logo.png file.
    // This avoids network requests and ensures the logo is always available for PDF generation.
    const base64Image = "iVBORw0KGgoAAAANSUhEUgAAAQAAAAEACAYAAABccqhmAAAABGdBTUEAALGPC/xhBQAAAAFzUkdCAK7OHOkAAAAJcEhZcwAACxMAAAsTAQCanBgAAAAjdEVYdFNvZnR3YXJlAFRodW5kZXJiaXJkRwAAeJxj/gE7A8//Z/i3/gGPDwD+8Y+BigEADk0EaHjarjG3TjJ3D2MzgEAs4L4b8i4wA+n6/6e/f//79y/Gj/8YwEAGAB0DEBJAuAwgH8B8c8B/J+hY+iYPCwO4/f/D3+Mj/8z/P3P/79/GH4w/jD+PP48/rz+vP59/f39+1/e37u36+5t/AYG/v379++fv37/9gUDg4GBgYGBgYGBgYGBgYFBgUGBQYFBgUGBQYFBgUGBQYFBgUGBQYFBgUGBQYFBgUGBQYFBgUGBQYFBgUGBQYFBgUGBQYFBgUGBQYFBgUGBQYFBgUGBQYFBgUGBQYFBgUGBQYFBgUGBQYFBgUGBQYFBgUGBQYFBgUGBQYFBgUGBQYFBgUGBQYFBgUGBQYFBgUGBQYFBgUGBQYFBgUGBQYFBgUGBQYFBgUGBQYFBgUGBQYFBgUGBQYFBgUGBQYFBgUGBQYFBgUGBQYFBgUGBQYFBgUGBQYFBgUGBQYFBgUGBQYFBgUGBQYFBgUGBQYFBgUGBQYFBgUGBQYFBgUGBQYFBgUGBQYFBgUGBQYFBgUGBQYFBgUGBQYFBgUGBQYFBgUGBQYFBgUGBQYFBgUGBQYFBgUGBQYFBgUGBQYFBgUGBQYFBgUGBQYFBgUGBQYFBgUGBQYFBgUGBQYFBgUGBQYFBgUGBQYFBgUGBQYFBgUGBQYFBgUGBQYFBgUGBQYFBgUGBQYFBgUGBQYFBgUGBQYFBgUGBQYFBgUGBQYFBgUGBQYFBgUGBQYFBgUGBQYFBgUGBQYFBgUGBQYFBgUGBQYFBgUGBQYFBgUGBQYFBgUGBQYFBgUGBQYFBgUGBQYFBgUGBQYFBgUGBQYFBgUGBQYFBgUGBQYFBgUGBQYFBgUGBQYFBgUGBQYFBgUGBQYFBgUGBQYFBgUGBQYFBgUGBQYFBgUGBQYFBgUGBQYFBgUGBQYFBgUGBQYFBgUGBQYFBgUGBQYFBgUGBQYFBgUGBQYFBgUGBQYFBgUGBQYFBgUGBQYFBgUGBQYFBgUGBQYFBgUGBQYFBgUGBQYFBgUGBQYFBgUGBQYFBgUGBQYFBgUGBQYFBgUGBQYFBgUGBQYFBgUGBQYFBgUGBQYFBgUGBQYFBgUGBQYFBgUGBQYFBgUGBQYFBgUGBQYFBgUGBQYFBgUGBQYFBgUGBQYFBgUGBQYFBgUGBQYFBgUGBQYFBgUGBQYFBgUGBQYFBgUGBQYFBgUGBQYFBgUGBQYFBgUGBQYFBgUGBQYFBgUGBQYFBgUGBQYFBgUGBQYFBgUGBQYFBgUGBQYFBgUGBQYFBgUGBQYFBgUGBQYFBgUGBQYFBgUGBQYFBgUGBQYFBgUGBQYFBgUGBQYFBgUGBQYFBgUGBQYFBgUGBQYFBgUGBQYFBgUGBQYFBgUGBQYFBgUGBQYFBgUGBQYFBgUGBQYFBgUGBQYFBgUGBQYFBgUGBQYFBgUGBQYFBgUGBQYFBgUGBQYFBgUGBQYFBgUGBQYFBgUGBQYFBgUGBQYFBgUGBQYFBgUGBQYFBgUGBQYFBgUGBQYFBgUGBQYFBgUGBQYFBgUGBQYFBgUGBQYFBgUGBQYFBgUGBQYFBgUGBQYFBgUGBQYFBgUGBQYFBgUGBQYFBgUGBQYFBgUGBQYFBgUGBQYFBgUGBQYFBgUGBQYFBgUGBQYFBgUGBQYFBgUGBQYFBgUGBQYFBgUGBQYFBgUGBQYFBgUGBQYFBgUGBQYFBgUGBQYFBgU-";
    return `data:image/png;base64,${base64Image}`;
};


const drawHeader = (doc: jsPDF, oficina: Oficina | null, title: string) => {
  const pageHeight = doc.internal.pageSize.getHeight();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  let currentY = 20;

  const logoDataUri = getLogoDataUri();
  
  if (logoDataUri) {
      doc.addImage(logoDataUri, 'PNG', margin, currentY, 30, 30);
  }

  const nomeEmpresa = oficina?.nomeEmpresa || 'Retífica Figueirêdo';
  const cnpj = oficina?.cnpj ? `CNPJ: ${oficina.cnpj}` : '';
  const telefone = oficina?.telefone ? `Telefone: ${oficina.telefone}` : '';
  const email = oficina?.email ? `Email: ${oficina.email}` : '';
  const enderecoOficina = oficina ? `${oficina.endereco}, ${oficina.cidade}-${oficina.uf}, CEP: ${oficina.cep}` : 'Endereço da Oficina';
  
  const headerTextX = logoDataUri ? margin + 40 : margin;

  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(title, pageWidth / 2, currentY + 5, { align: 'center' });
  
  currentY += 15;
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(nomeEmpresa, headerTextX, currentY);
  currentY += 6;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
   doc.text(enderecoOficina, headerTextX, currentY);
   currentY += 4;
   const contactInfo = [cnpj, telefone, email].filter(Boolean).join(' | ');
   doc.text(contactInfo, headerTextX, currentY);

  currentY += 10;
  
  doc.setLineWidth(0.5);
  doc.line(margin, currentY, pageWidth - margin, currentY);
  
  return currentY;
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
  
  let currentY = drawHeader(doc, oficina, 'Orçamento de Peças e Serviços');
  currentY += 8;

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

  if(orcamento.observacoes) {
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
  currentY += 8;

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
  
  const clientLines = [
    `Cliente: ${cliente.nome}`,
    `Telefone: ${cliente.telefone}`,
  ];
  const vehicleLines = [
      `Veículo: ${veiculo.fabricante} ${veiculo.modelo}`,
      `Placa: ${veiculo.placa}`,
      `Ano: ${veiculo.ano}`,
  ];

  doc.text(clientLines, margin, currentY);
  doc.text(vehicleLines, pageWidth / 2, currentY);
  currentY += 20;

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
  doc.text('Assinatura do Cliente', pageWidth / 2, signatureY + 5, { align: 'center'});

  // Footer
  drawFooter(doc, 'Ordem de Serviço', dataEntrada);

  // Save the PDF
  doc.save(`OS-${cliente.nome.split(' ')[0]}-${ordem.id.substring(0, 4)}.pdf`);
};
