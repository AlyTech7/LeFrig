import PDFDocument from 'pdfkit';

export type TransportReceiptPdfInput = {
  tripId: string;
  origin: string;
  destination: string;
  scope: string;
  type: string;
  requesterName: string;
  driverName: string;
  priceEstimate: number | null;
  completedAt: Date;
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

function formatDate(d: Date): string {
  return new Intl.DateTimeFormat('es-ES', {
    dateStyle: 'long',
    timeStyle: 'short',
    timeZone: 'UTC',
  }).format(d);
}

function shortCode(tripId: string): string {
  return `TRP-${tripId.replace(/-/g, '').slice(0, 8).toUpperCase()}`;
}

/** PDF A4 del recibo de viaje LeFrig (confirmación bilateral con PIN). */
export function buildTransportReceiptPdf(input: TransportReceiptPdfInput): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margin: 0,
      info: {
        Title: `Recibo viaje LeFrig ${shortCode(input.tripId)}`,
        Author: 'LeFrig',
        Subject: 'Recibo de transporte — confirmación bilateral con PIN',
        Creator: 'LeFrig Transport',
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
    const code = shortCode(input.tripId);

    doc.rect(0, 0, pageW, pageH).fill(COLORS.cream);

    doc.rect(0, 0, pageW, 118).fill(COLORS.ink);
    doc.moveTo(0, 118).lineTo(pageW, 118).lineWidth(3).stroke(COLORS.gold);
    doc.polygon([0, 0], [72, 0], [0, 72]).fill(COLORS.emeraldDeep);

    doc
      .fillColor(COLORS.goldBright)
      .font('Helvetica-Bold')
      .fontSize(11)
      .text('LEFRIG', marginX, 28, { characterSpacing: 4 });

    doc.circle(marginX + contentW - 18, 44, 14).lineWidth(1.5).stroke(COLORS.goldBright);
    doc.circle(marginX + contentW - 18, 44, 5).fill(COLORS.goldBright);

    doc.fillColor(COLORS.white).font('Helvetica-Bold').fontSize(22).text('RECIBO DE VIAJE', marginX, 52);
    doc
      .fillColor('#cfc6b8')
      .font('Helvetica')
      .fontSize(10)
      .text('Confirmación bilateral con PIN  ·  Acuerdo directo entre personas', marginX, 82);

    const pillY = 138;
    doc.roundedRect(marginX, pillY, 210, 28, 14).fill(COLORS.emerald);
    doc
      .fillColor(COLORS.white)
      .font('Helvetica-Bold')
      .fontSize(10)
      .text('VIAJE COMPLETADO', marginX + 14, pillY + 9);

    const codeBoxY = 180;
    doc.roundedRect(marginX, codeBoxY, contentW, 64, 10).fill(COLORS.sand);
    doc.roundedRect(marginX, codeBoxY, contentW, 64, 10).lineWidth(1).stroke(COLORS.line);
    doc.fillColor(COLORS.muted).font('Helvetica').fontSize(9).text('CÓDIGO DE VIAJE', marginX + 18, codeBoxY + 14);
    doc
      .fillColor(COLORS.ink)
      .font('Helvetica-Bold')
      .fontSize(22)
      .text(code, marginX + 18, codeBoxY + 30, { characterSpacing: 1.5 });

    const routeY = 268;
    doc.fillColor(COLORS.muted).font('Helvetica').fontSize(10).text('RUTA', marginX, routeY);
    doc
      .fillColor(COLORS.emeraldDeep)
      .font('Helvetica-Bold')
      .fontSize(22)
      .text(`${input.origin}  →  ${input.destination}`, marginX, routeY + 18, {
        width: contentW,
      });

    doc
      .moveTo(marginX, routeY + 72)
      .lineTo(marginX + contentW, routeY + 72)
      .lineWidth(1)
      .stroke(COLORS.line);

    const partiesY = 360;
    const colW = (contentW - 24) / 2;
    drawPartyCard(doc, { x: marginX, y: partiesY, w: colW, label: 'PASAJERO', name: input.requesterName });
    drawPartyCard(doc, {
      x: marginX + colW + 24,
      y: partiesY,
      w: colW,
      label: 'CONDUCTOR',
      name: input.driverName,
    });

    let detailY = partiesY + 110;
    doc.fillColor(COLORS.ink).font('Helvetica-Bold').fontSize(12).text('Detalle del viaje', marginX, detailY);
    detailY += 22;
    detailY = drawDetailRow(doc, marginX, contentW, detailY, 'Ámbito', input.scope === 'local' ? 'Local' : 'Internacional');
    detailY = drawDetailRow(doc, marginX, contentW, detailY, 'Tipo', input.type);
    detailY = drawDetailRow(
      doc,
      marginX,
      contentW,
      detailY,
      'Precio estimado',
      input.priceEstimate != null ? `${input.priceEstimate.toLocaleString('es-ES')} (acuerdo directo)` : 'Acuerdo directo',
    );
    detailY = drawDetailRow(doc, marginX, contentW, detailY, 'Completado', formatDate(input.completedAt) + ' UTC');
    detailY = drawDetailRow(doc, marginX, contentW, detailY, 'ID', input.tripId);

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
        'Este documento acredita que pasajero y conductor confirmaron la entrega con el mismo PIN de 4 dígitos. Lefrig no gestiona el pago.',
        marginX + 20,
        sealY + 40,
        { width: contentW - 40, lineGap: 2 },
      );

    doc
      .fillColor(COLORS.muted)
      .font('Helvetica')
      .fontSize(8)
      .text(
        'lefrig.com  ·  Superapp saharaui  ·  Conserva una copia de este recibo.',
        marginX,
        pageH - 42,
        { width: contentW, align: 'center' },
      );

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
  doc.fillColor(COLORS.muted).font('Helvetica').fontSize(9).text(label.toUpperCase(), x, y, { width: 140 });
  doc.fillColor(COLORS.ink).font('Helvetica-Bold').fontSize(11).text(value, x + 150, y, { width: w - 150 });
  doc.moveTo(x, y + 22).lineTo(x + w, y + 22).lineWidth(0.5).stroke(COLORS.line);
  return y + 30;
}
