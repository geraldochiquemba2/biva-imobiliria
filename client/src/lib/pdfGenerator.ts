import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import type { Contract } from '@shared/schema';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface PDFGeneratorOptions {
  contractPages: string[][];
  contract: Contract;
  logoUrl: string;
}

// Helper function to split contract content into pages
export function splitContractIntoPages(contractContent: string): string[][] {
  if (!contractContent) return [];
  
  const pageBreaks = contractContent.split('\f');
  const pages: string[][] = [];

  pageBreaks.forEach((pageContent) => {
    const lines = pageContent.split('\n');
    const linesPerPage = 32;

    if (lines.length <= linesPerPage) {
      pages.push(lines);
    } else {
      for (let i = 0; i < lines.length; i += linesPerPage) {
        pages.push(lines.slice(i, i + linesPerPage));
      }
    }
  });

  return pages;
}

export async function generateContractPDFFromPages(options: PDFGeneratorOptions): Promise<void> {
  const { contractPages, contract, logoUrl } = options;
  
  // Create a temporary container for rendering
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.width = '210mm'; // A4 width
  container.style.background = 'white';
  document.body.appendChild(container);

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  try {
    for (let pageIndex = 0; pageIndex < contractPages.length; pageIndex++) {
      const pageLines = contractPages[pageIndex];
      
      // Create page element
      const pageElement = document.createElement('div');
      pageElement.style.cssText = `
        position: relative;
        width: 210mm;
        min-height: 297mm;
        background: white;
        padding: 20mm;
        box-sizing: border-box;
        font-family: Georgia, serif;
        color: #1a1a1a;
      `;

      // Logo
      const logoContainer = document.createElement('div');
      logoContainer.style.cssText = `
        position: absolute;
        top: 2mm;
        left: 16mm;
        z-index: 5;
      `;
      const logo = document.createElement('img');
      logo.src = logoUrl;
      logo.style.cssText = `
        width: 32mm;
        height: 32mm;
        object-fit: contain;
      `;
      logoContainer.appendChild(logo);
      pageElement.appendChild(logoContainer);

      // Decorative header border
      const header = document.createElement('div');
      header.style.cssText = `
        border-top: 4px solid rgba(59, 130, 246, 0.3);
        border-bottom: 2px solid rgba(59, 130, 246, 0.3);
        padding: 3mm 0;
        margin-bottom: 6mm;
        display: flex;
        justify-content: space-between;
        font-size: 10px;
        color: #666;
      `;
      header.innerHTML = `
        <span style="font-weight: 600;">DOCUMENTO OFICIAL</span>
        <span style="font-size: 10px;">Conforme Lei n.º 26/15 de 23 de Outubro</span>
      `;
      pageElement.appendChild(header);

      // Watermark
      const watermark = document.createElement('div');
      watermark.style.cssText = `
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        z-index: 0;
        opacity: 0.05;
        pointer-events: none;
      `;
      const watermarkImg = document.createElement('img');
      watermarkImg.src = logoUrl;
      watermarkImg.style.cssText = `
        width: 96mm;
        height: 96mm;
        object-fit: contain;
      `;
      watermark.appendChild(watermarkImg);
      pageElement.appendChild(watermark);

      // Contract content
      const content = document.createElement('div');
      content.style.cssText = `
        position: relative;
        z-index: 1;
        padding-bottom: 80px;
        font-size: 12px;
        line-height: 1.8;
      `;

      for (let idx = 0; idx < pageLines.length; idx++) {
        const line = pageLines[idx];
        const isClausulaTitle = line.trim().startsWith('Cláusula');
        const isClausulasSection = line.trim() === 'CLÁUSULAS CONTRATUAIS';
        const isEmpty = line.trim() === '';
        const isSignatureLine = line.trim().startsWith('_____');

        const lineElement = document.createElement('div');
        lineElement.style.cssText = `
          text-align: ${(isClausulaTitle || isClausulasSection) ? 'center' : 'justify'};
          font-weight: ${(isClausulaTitle || isClausulasSection) ? 'bold' : 'normal'};
          margin-bottom: ${isEmpty ? '0' : '0.5em'};
          page-break-after: ${(isClausulaTitle || isClausulasSection) ? 'avoid' : 'auto'};
          page-break-inside: avoid;
        `;

        // Check if this is a signature line
        let showProprietarioSignature = false;
        let showClienteSignature = false;

        if (isSignatureLine) {
          const nextLines = pageLines.slice(idx + 1, Math.min(pageLines.length, idx + 4)).join(' ');
          if (nextLines.includes('SENHORIO') || nextLines.includes('Proprietário')) {
            showProprietarioSignature = true;
          } else if (nextLines.includes('INQUILINO') || nextLines.includes('Arrendatário')) {
            showClienteSignature = true;
          }
        }

        if (isSignatureLine && showProprietarioSignature && contract.proprietarioSignature) {
          if (contract.proprietarioSignature.startsWith('data:image/')) {
            const sigContainer = document.createElement('div');
            sigContainer.style.cssText = 'display: flex; flex-direction: column; align-items: flex-start; margin: 8px 0;';
            const sigImg = document.createElement('img');
            sigImg.src = contract.proprietarioSignature;
            sigImg.style.cssText = 'max-width: 265px; max-height: 52px; object-fit: contain; margin-bottom: 4px;';
            sigContainer.appendChild(sigImg);
            const sigDate = document.createElement('div');
            sigDate.style.cssText = 'font-size: 10px; color: #666;';
            sigDate.textContent = `Assinado digitalmente em ${contract.proprietarioSignedAt ? format(new Date(contract.proprietarioSignedAt), "dd/MM/yyyy HH:mm") : ''}`;
            sigContainer.appendChild(sigDate);
            lineElement.appendChild(sigContainer);
          }
        } else if (isSignatureLine && showClienteSignature && contract.clienteSignature) {
          if (contract.clienteSignature.startsWith('data:image/')) {
            const sigContainer = document.createElement('div');
            sigContainer.style.cssText = 'display: flex; flex-direction: column; align-items: flex-start; margin: 8px 0;';
            const sigImg = document.createElement('img');
            sigImg.src = contract.clienteSignature;
            sigImg.style.cssText = 'max-width: 265px; max-height: 52px; object-fit: contain; margin-bottom: 4px;';
            sigContainer.appendChild(sigImg);
            const sigDate = document.createElement('div');
            sigDate.style.cssText = 'font-size: 10px; color: #666;';
            sigDate.textContent = `Assinado digitalmente em ${contract.clienteSignedAt ? format(new Date(contract.clienteSignedAt), "dd/MM/yyyy HH:mm") : ''}`;
            sigContainer.appendChild(sigDate);
            lineElement.appendChild(sigContainer);
          }
        } else {
          lineElement.textContent = line || '\u00A0';
        }

        content.appendChild(lineElement);
      }

      pageElement.appendChild(content);

      // Footer
      const footer = document.createElement('div');
      footer.style.cssText = `
        position: absolute;
        bottom: 20mm;
        left: 20mm;
        right: 20mm;
        padding-top: 4mm;
        border-top: 1px solid #ccc;
        background: white;
        z-index: 10;
        display: flex;
        justify-content: space-between;
        font-size: 10px;
        color: #666;
      `;
      footer.innerHTML = `
        <div>
          <p style="font-weight: 600; margin: 0 0 2px 0;">ID: ${contract.id.substring(0, 8).toUpperCase()}</p>
          <p style="margin: 0;">Data de Emissão: ${format(new Date(contract.createdAt), "dd/MM/yyyy")}</p>
        </div>
        <div style="text-align: right;">
          <p style="font-weight: 600; margin: 0;">Página ${pageIndex + 1} de ${contractPages.length}</p>
        </div>
      `;
      pageElement.appendChild(footer);

      container.appendChild(pageElement);

      // Wait for images to load
      await new Promise(resolve => setTimeout(resolve, 100));

      // Capture the page
      const canvas = await html2canvas(pageElement, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: 794, // 210mm at 96dpi
        height: 1123, // 297mm at 96dpi
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      
      if (pageIndex > 0) {
        pdf.addPage();
      }
      
      pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297);

      // Clean up
      container.removeChild(pageElement);
    }

    // Save the PDF
    const fileName = `Contrato_${contract.id.substring(0, 8)}_${format(new Date(), 'yyyyMMdd')}.pdf`;
    pdf.save(fileName);

  } finally {
    // Remove temporary container
    document.body.removeChild(container);
  }
}
