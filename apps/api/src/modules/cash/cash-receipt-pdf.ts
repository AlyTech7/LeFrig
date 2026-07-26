import PDFDocument from 'pdfkit';

export type CashReceiptPdfInput = {
  receiptId: string;
  operationCode: string;
  amount: number;
  currency: string;
  issuedAt: Date;
  listingTitle: string | null;
  buyerName: string;
  sellerName: string;
};

const COLORS = {
  ink: '#14110e',
  muted: '#5c5348',
  line: '#d9d0c3',
  sand: '#f7f2ea',
  cream: '#fffbf5',
  gold: '#b8892d',
  goldBright: '#d4a853',
  emerald: '#0a7a66',
  emeraldDeep: '#065f4e',
  white: '#ffffff',
};

function formatMoney(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${amount.toLocaleString('es-ES')} ${currency}`;
  }
}

function formatDate(d: Date): string {
  return new Intl.DateTimeFormat('es-ES', {
    dateStyle: 'long',
    timeStyle: 'short',
    timeZone: 'UTC',
  }).format(d);
}

/** Genera un PDF A4 premium del recibo de efectivo seguro LeFrig. */
export function buildCashReceiptPdf(input: CashReceiptPdfInput): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margin: 0,
      info: {
        Title: `Recibo LeFrig ${input.operationCode}`,
        Author: 'LeFrig',
        Subject: 'Recibo de efectivo seguro — confirmación bilateral con PIN',
        Creator: 'LeFrig Cash',
      },
    });

    const chunks: Buffer[] = [];
    doc.on('data', (c: Buffer) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const pageW = doc.page.width;
    const pageH = doc.page.height;
    const marginX = 48;
    const contentW = pageW - marginX * 2;

    // Background
    doc.rect(0, 0, pageW, pageH).fill(COLORS.cream);

    // Top brand band
    doc.rect(0, 0, pageW, 118).fill(COLORS.ink);
    doc
      .moveTo(0, 118)
      .lineTo(pageW, 118)
      .lineWidth(3)
      .stroke(COLORS.gold);

    // Accent corner mark
    doc
      .polygon([0, 0], [72, 0], [0, 72])
      .fill(COLORS.emeraldDeep);

    doc
      .fillColor(COLORS.goldBright)
      .font('Helvetica-Bold')
      .fontSize(11)
      .text('LEFRIG', marginX, 28, { characterSpacing: 4 });

    // Geometric brand mark (avoids Unicode glyphs missing in Helvetica)
    doc.circle(marginX + contentW - 18, 44, 14).lineWidth(1.5).stroke(COLORS.goldBright);
    doc.circle(marginX + contentW - 18, 44, 5).fill(COLORS.goldBright);

    doc
      .fillColor(COLORS.white)
      .font('Helvetica-Bold')
      .fontSize(22)
      .text('RECIBO DE EFECTIVO SEGURO', marginX, 52);

    doc
      .fillColor('#cfc6b8')
      .font('Helvetica')
      .fontSize(10)
      .text('Confirmación bilateral con PIN  ·  Documento oficial de la operación', marginX, 82);

    // Status pill
    const pillY = 138;
    doc.roundedRect(marginX, pillY, 210, 28, 14).fill(COLORS.emerald);
    doc
      .fillColor(COLORS.white)
      .font('Helvetica-Bold')
      .fontSize(10)
      .text('VERIFICADO POR AMBAS PARTES', marginX + 14, pillY + 9);

    // Operation code box
    const codeBoxY = 180;
    doc.roundedRect(marginX, codeBoxY, contentW, 64, 10).fill(COLORS.sand);
    doc
      .roundedRect(marginX, codeBoxY, contentW, 64, 10)
      .lineWidth(1)
      .stroke(COLORS.line);

    doc
      .fillColor(COLORS.muted)
      .font('Helvetica')
      .fontSize(9)
      .text('CÓDIGO DE OPERACIÓN', marginX + 18, codeBoxY + 14);

    doc
      .fillColor(COLORS.ink)
      .font('Helvetica-Bold')
      .fontSize(22)
      .text(input.operationCode, marginX + 18, codeBoxY + 30, { characterSpacing: 1.5 });

    // Amount hero
    const amountY = 268;
    doc
      .fillColor(COLORS.muted)
      .font('Helvetica')
      .fontSize(10)
      .text('IMPORTE CONFIRMADO', marginX, amountY);

    doc
      .fillColor(COLORS.emeraldDeep)
      .font('Helvetica-Bold')
      .fontSize(36)
      .text(formatMoney(input.amount, input.currency), marginX, amountY + 18);

    doc
      .moveTo(marginX, amountY + 72)
      .lineTo(marginX + contentW, amountY + 72)
      .lineWidth(1)
      .stroke(COLORS.line);

    // Parties
    const partiesY = 360;
    const colW = (contentW - 24) / 2;

    drawPartyCard(doc, {
      x: marginX,
      y: partiesY,
      w: colW,
      label: 'COMPRADOR',
      name: input.buyerName,
    });
    drawPartyCard(doc, {
      x: marginX + colW + 24,
      y: partiesY,
      w: colW,
      label: 'VENDEDOR',
      name: input.sellerName,
    });

    // Details
    let detailY = partiesY + 110;
    doc
      .fillColor(COLORS.ink)
      .font('Helvetica-Bold')
      .fontSize(12)
      .text('Detalle de la operación', marginX, detailY);

    detailY += 22;
    detailY = drawDetailRow(doc, marginX, contentW, detailY, 'Artículo', input.listingTitle ?? 'Operación de efectivo');
    detailY = drawDetailRow(doc, marginX, contentW, detailY, 'Fecha de emisión', formatDate(input.issuedAt) + ' UTC');
    detailY = drawDetailRow(doc, marginX, contentW, detailY, 'Método', 'Efectivo presencial · PIN bilateral');
    detailY = drawDetailRow(doc, marginX, contentW, detailY, 'ID de recibo', input.receiptId);

    // Seal / authenticity block
    const sealY = Math.max(detailY + 28, 620);
    doc.roundedRect(marginX, sealY, contentW, 88, 12).fill(COLORS.ink);
    doc
      .fillColor(COLORS.goldBright)
      .font('Helvetica-Bold')
      .fontSize(11)
      .text('SELLO DIGITAL LEFRIG', marginX + 20, sealY + 18);

    doc
      .fillColor(COLORS.white)
      .font('Helvetica')
      .fontSize(10)
      .text(
        'Este documento acredita que comprador y vendedor confirmaron la entrega con el mismo PIN de 4 dígitos. El anuncio queda marcado como vendido en la plataforma.',
        marginX + 20,
        sealY + 40,
        { width: contentW - 40, lineGap: 2 },
      );

    // Footer
    doc
      .fillColor(COLORS.muted)
      .font('Helvetica')
      .fontSize(8)
      .text(
        'lefrig.com  ·  Superapp saharaui  ·  Este recibo no sustituye obligaciones fiscales locales. Conserva una copia.',
        marginX,
        pageH - 42,
        { width: contentW, align: 'center' },
      );

    // Side gold rule
    doc.rect(0, 118, 4, pageH - 118).fill(COLORS.gold);

    doc.end();
  });
}

function drawPartyCard(
  doc: PDFKit.PDFDocument,
  opts: { x: number; y: number; w: number; label: string; name: string },
) {
  doc.roundedRect(opts.x, opts.y, opts.w, 88, 10).fill(COLORS.sand);
  doc.roundedRect(opts.x, opts.y, opts.w, 88, 10).lineWidth(1).stroke(COLORS.line);
  doc
    .fillColor(COLORS.gold)
    .font('Helvetica-Bold')
    .fontSize(9)
    .text(opts.label, opts.x + 16, opts.y + 18);
  doc
    .fillColor(COLORS.ink)
    .font('Helvetica-Bold')
    .fontSize(13)
    .text(opts.name || '—', opts.x + 16, opts.y + 40, { width: opts.w - 32 });
}

function drawDetailRow(
  doc: PDFKit.PDFDocument,
  x: number,
  w: number,
  y: number,
  label: string,
  value: string,
): number {
  doc
    .fillColor(COLORS.muted)
    .font('Helvetica')
    .fontSize(9)
    .text(label.toUpperCase(), x, y, { width: 140 });
  doc
    .fillColor(COLORS.ink)
    .font('Helvetica-Bold')
    .fontSize(11)
    .text(value, x + 150, y, { width: w - 150 });
  doc
    .moveTo(x, y + 22)
    .lineTo(x + w, y + 22)
    .lineWidth(0.5)
    .stroke(COLORS.line);
  return y + 30;
}
