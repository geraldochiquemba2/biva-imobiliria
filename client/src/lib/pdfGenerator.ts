import jsPDF from 'jspdf';
import type { Contract, User } from '@shared/schema';
import { formatAOA } from './currency';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface PDFData {
  contract: Contract;
  propertyTitle: string;
  proprietario: User;
  cliente: User;
}

export function generateContractPDF(data: PDFData) {
  const { contract, propertyTitle, proprietario, cliente } = data;
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const margin = 20;
  const contentWidth = pageWidth - 2 * margin;
  let yPosition = 20;

  // Título
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  const title = contract.tipo === 'arrendamento' ? 'CONTRATO DE ARRENDAMENTO' : 'CONTRATO DE VENDA';
  doc.text(title, pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 15;

  // Informações do contrato
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  const contractDate = contract.createdAt ? format(new Date(contract.createdAt), "dd 'de' MMMM 'de' yyyy", { locale: ptBR }) : '';
  doc.text(`Data do Contrato: ${contractDate}`, margin, yPosition);
  yPosition += 7;
  doc.text(`Número do Contrato: ${contract.id}`, margin, yPosition);
  yPosition += 10;

  // Imóvel
  doc.setFont('helvetica', 'bold');
  doc.text('IMÓVEL:', margin, yPosition);
  yPosition += 7;
  doc.setFont('helvetica', 'normal');
  doc.text(propertyTitle, margin, yPosition);
  yPosition += 10;

  // Partes do contrato
  doc.setFont('helvetica', 'bold');
  doc.text('PARTES CONTRATANTES:', margin, yPosition);
  yPosition += 7;
  doc.setFont('helvetica', 'normal');
  
  doc.text('Proprietário:', margin, yPosition);
  yPosition += 5;
  doc.text(`Nome: ${proprietario.fullName || 'N/A'}`, margin + 5, yPosition);
  yPosition += 5;
  doc.text(`BI/Passaporte: ${proprietario.bi || 'N/A'}`, margin + 5, yPosition);
  yPosition += 5;
  doc.text(`Contacto: ${proprietario.phone || 'N/A'}`, margin + 5, yPosition);
  yPosition += 10;

  const clienteLabel = contract.tipo === 'arrendamento' ? 'Inquilino' : 'Comprador';
  doc.text(`${clienteLabel}:`, margin, yPosition);
  yPosition += 5;
  doc.text(`Nome: ${cliente.fullName || 'N/A'}`, margin + 5, yPosition);
  yPosition += 5;
  doc.text(`BI/Passaporte: ${cliente.bi || 'N/A'}`, margin + 5, yPosition);
  yPosition += 5;
  doc.text(`Contacto: ${cliente.phone || 'N/A'}`, margin + 5, yPosition);
  yPosition += 10;

  // Termos do contrato
  doc.setFont('helvetica', 'bold');
  doc.text('TERMOS DO CONTRATO:', margin, yPosition);
  yPosition += 7;
  doc.setFont('helvetica', 'normal');

  const startDate = contract.dataInicio ? format(new Date(contract.dataInicio), 'dd/MM/yyyy') : 'N/A';
  const endDate = contract.dataFim ? format(new Date(contract.dataFim), 'dd/MM/yyyy') : 'N/A';
  
  doc.text(`Início: ${startDate}`, margin, yPosition);
  yPosition += 5;
  if (contract.tipo === 'arrendamento') {
    doc.text(`Término: ${endDate}`, margin, yPosition);
    yPosition += 5;
  }
  doc.text(`Valor: ${formatAOA(contract.valor)}`, margin, yPosition);
  yPosition += 10;

  // Conteúdo do contrato
  if (contract.contractContent) {
    doc.setFont('helvetica', 'bold');
    doc.text('CONTEÚDO DO CONTRATO:', margin, yPosition);
    yPosition += 7;
    doc.setFont('helvetica', 'normal');
    
    const lines = doc.splitTextToSize(contract.contractContent, contentWidth);
    lines.forEach((line: string) => {
      if (yPosition > 270) {
        doc.addPage();
        yPosition = 20;
      }
      doc.text(line, margin, yPosition);
      yPosition += 5;
    });
    yPosition += 5;
  }

  // Observações
  if (contract.observacoes) {
    if (yPosition > 250) {
      doc.addPage();
      yPosition = 20;
    }
    doc.setFont('helvetica', 'bold');
    doc.text('OBSERVAÇÕES:', margin, yPosition);
    yPosition += 7;
    doc.setFont('helvetica', 'normal');
    
    const lines = doc.splitTextToSize(contract.observacoes, contentWidth);
    lines.forEach((line: string) => {
      if (yPosition > 270) {
        doc.addPage();
        yPosition = 20;
      }
      doc.text(line, margin, yPosition);
      yPosition += 5;
    });
    yPosition += 5;
  }

  // Assinaturas
  if (yPosition > 220) {
    doc.addPage();
    yPosition = 20;
  }

  yPosition += 10;
  doc.setFont('helvetica', 'bold');
  doc.text('ASSINATURAS:', margin, yPosition);
  yPosition += 15;

  doc.setFont('helvetica', 'normal');
  const signatureY = yPosition;
  
  // Proprietário
  doc.text('_________________________', margin, signatureY);
  doc.text('Proprietário', margin, signatureY + 7);
  if (contract.proprietarioSignature) {
    doc.setFontSize(8);
    const ownerSigDate = contract.proprietarioSignedAt ? format(new Date(contract.proprietarioSignedAt), 'dd/MM/yyyy HH:mm') : '';
    doc.text(`Assinado em: ${ownerSigDate}`, margin, signatureY + 12);
  }
  
  // Cliente
  doc.setFontSize(10);
  doc.text('_________________________', pageWidth - margin - 60, signatureY);
  doc.text(clienteLabel, pageWidth - margin - 60, signatureY + 7);
  if (contract.clienteSignature) {
    doc.setFontSize(8);
    const clientSigDate = contract.clienteSignedAt ? format(new Date(contract.clienteSignedAt), 'dd/MM/yyyy HH:mm') : '';
    doc.text(`Assinado em: ${clientSigDate}`, pageWidth - margin - 60, signatureY + 12);
  }

  // Salvar PDF
  const fileName = `Contrato_${contract.id.substring(0, 8)}_${format(new Date(), 'yyyyMMdd')}.pdf`;
  doc.save(fileName);
}
