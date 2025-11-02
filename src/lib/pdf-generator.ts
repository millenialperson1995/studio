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

  // 1. Header
  doc.setFontSize(20);
  doc.text('Orçamento de Serviços', 105, 20, { align: 'center' });
  doc.setFontSize(10);
  doc.text(`Orçamento #: ${orcamento.id.substring(0, 8)}`, 195, 25, { align: 'right' });
  
  // Company Info
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('REDÍFICA FIGUEIRÊDO', 15, 30);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('CNPJ: 33.925-338/0001-74', 15, 36);
  doc.text('Av. Presidente Kennedy, 1956, loja T.: Peixinhos', 15, 41);
  doc.text('CEP: 53.230-650 - OLINDA-PE', 15, 46);
  doc.text('Telefone: (81) 9.8836-6701', 15, 51);


  doc.setLineWidth(0.5);
  doc.line(15, 56, 195, 56);

  // 2. Client and Vehicle Info
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Informações do Cliente e Veículo', 15, 65);
  
  const clientInfoY = 72;
  const vehicleInfoX = 110;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  // Cliente
  doc.text(`Cliente: ${cliente.nome}`, 15, clientInfoY);
  doc.text(`Telefone: ${cliente.telefone}`, 15, clientInfoY + 5);
  const enderecoLinha1 = `${cliente.endereco}, ${cliente.numero} - ${cliente.bairro}`;
  const enderecoLinha2 = `${cliente.cidade} - ${cliente.uf}, CEP: ${cliente.cep}`;
  doc.text(`Endereço: ${enderecoLinha1}`, 15, clientInfoY + 10);
  doc.text(enderecoLinha2, 15, clientInfoY + 15);
  if (cliente.pontoReferencia) {
      doc.text(`Ref: ${cliente.pontoReferencia}`, 15, clientInfoY + 20);
  }

  // Veículo
  doc.text(`Veículo: ${veiculo.marca} ${veiculo.modelo}`, vehicleInfoX, clientInfoY);
  doc.text(`Placa: ${veiculo.placa}`, vehicleInfoX, clientInfoY + 5);
  doc.text(`Ano: ${veiculo.ano}`, vehicleInfoX, clientInfoY + 10);
  doc.text(`Info. Técnicas: ${veiculo.informacoesTecnicas}`, vehicleInfoX, clientInfoY + 15);

  doc.line(15, clientInfoY + 25, 195, clientInfoY + 25);

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
    startY: clientInfoY + 30,
    head: [tableColumn],
    body: tableRows,
    theme: 'striped',
    headStyles: { fillColor: [38, 50, 56] }, // Dark blue-gray
    styles: {
        fontSize: 9,
    },
  });

  // 4. Totals and Observations
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Valor Total:', 150, finalY, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.text(`R$ ${orcamento.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 195, finalY, { align: 'right' });

  if(orcamento.observacoes) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Observações:', 15, finalY + 10);
    doc.setFont('helvetica', 'normal');
    doc.text(orcamento.observacoes, 15, finalY + 15, { maxWidth: 180 });
  }

  // 5. Footer
  const pageCount = (doc as any).internal.getNumberOfPages();
  const footerY = doc.internal.pageSize.height - 15;
  for(let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.line(15, footerY - 5, 195, footerY - 5);
    const dataCriacao = orcamento.dataCriacao?.toDate ? orcamento.dataCriacao.toDate() : new Date();
    const dataValidade = orcamento.dataValidade?.toDate ? orcamento.dataValidade.toDate() : new Date();

    doc.setFontSize(8);
    doc.text(`Orçamento gerado em: ${format(dataCriacao, 'dd/MM/yyyy')}. Válido até: ${format(dataValidade, 'dd/MM/yyyy')}`, 15, footerY);
    doc.text(`Página ${i} de ${pageCount}`, 195, footerY, { align: 'right' });
  }

  // 6. Save the PDF
  doc.save(`Orcamento-${cliente.nome.split(' ')[0]}-${orcamento.id.substring(0, 4)}.pdf`);
};
