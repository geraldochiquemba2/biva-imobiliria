
import jsPDF from 'jspdf';
import type { Contract } from '@shared/schema';
import { formatCurrency } from './currency';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function generateContractPDF(contract: Contract, propertyTitle: string) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const margin = 20;
  const contentWidth = pageWidth - 2 * margin;
  let yPosition = 20;

  // Título
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('CONTRATO DE ARRENDAMENTO', pageWidth / 2, yPosition, { align: 'center' });
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
  doc.text(`Nome: ${contract.ownerName || 'N/A'}`, margin + 5, yPosition);
  yPosition += 5;
  doc.text(`BI/Passaporte: ${contract.ownerBi || 'N/A'}`, margin + 5, yPosition);
  yPosition += 5;
  doc.text(`Contacto: ${contract.ownerContact || 'N/A'}`, margin + 5, yPosition);
  yPosition += 10;

  doc.text('Inquilino:', margin, yPosition);
  yPosition += 5;
  doc.text(`Nome: ${contract.tenantName || 'N/A'}`, margin + 5, yPosition);
  yPosition += 5;
  doc.text(`BI/Passaporte: ${contract.tenantBi || 'N/A'}`, margin + 5, yPosition);
  yPosition += 5;
  doc.text(`Contacto: ${contract.tenantContact || 'N/A'}`, margin + 5, yPosition);
  yPosition += 10;

  // Termos do contrato
  doc.setFont('helvetica', 'bold');
  doc.text('TERMOS DO CONTRATO:', margin, yPosition);
  yPosition += 7;
  doc.setFont('helvetica', 'normal');

  const startDate = contract.startDate ? format(new Date(contract.startDate), 'dd/MM/yyyy') : 'N/A';
  const endDate = contract.endDate ? format(new Date(contract.endDate), 'dd/MM/yyyy') : 'N/A';
  
  doc.text(`Início: ${startDate}`, margin, yPosition);
  yPosition += 5;
  doc.text(`Término: ${endDate}`, margin, yPosition);
  yPosition += 5;
  doc.text(`Valor Mensal: ${formatCurrency(contract.monthlyRent)}`, margin, yPosition);
  yPosition += 5;
  doc.text(`Depósito de Segurança: ${formatCurrency(contract.securityDeposit)}`, margin, yPosition);
  yPosition += 10;

  // Termos adicionais
  if (contract.terms) {
    doc.setFont('helvetica', 'bold');
    doc.text('TERMOS ADICIONAIS:', margin, yPosition);
    yPosition += 7;
    doc.setFont('helvetica', 'normal');
    
    const lines = doc.splitTextToSize(contract.terms, contentWidth);
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
  if (contract.ownerSignature) {
    doc.setFontSize(8);
    const ownerSigDate = contract.ownerSignedAt ? format(new Date(contract.ownerSignedAt), 'dd/MM/yyyy HH:mm') : '';
    doc.text(`Assinado em: ${ownerSigDate}`, margin, signatureY + 12);
  }
  
  // Inquilino
  doc.setFontSize(10);
  doc.text('_________________________', pageWidth - margin - 60, signatureY);
  doc.text('Inquilino', pageWidth - margin - 60, signatureY + 7);
  if (contract.tenantSignature) {
    doc.setFontSize(8);
    const tenantSigDate = contract.tenantSignedAt ? format(new Date(contract.tenantSignedAt), 'dd/MM/yyyy HH:mm') : '';
    doc.text(`Assinado em: ${tenantSigDate}`, pageWidth - margin - 60, signatureY + 12);
  }

  // Salvar PDF
  const fileName = `Contrato_${contract.id.substring(0, 8)}_${format(new Date(), 'yyyyMMdd')}.pdf`;
  doc.save(fileName);
}
