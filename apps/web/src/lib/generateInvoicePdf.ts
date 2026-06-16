'use client';

import { COMPANY } from './companyProfile';

export interface InvoiceData {
  order_id: number;
  date_created: string;
  status_label: string;
  payment_method_title: string;
  total: string;
  currency: string;
  billing: {
    name: string;
    email: string;
    phone: string;
    address_1: string;
    address_2: string;
    city: string;
    postcode: string;
    country: string;
  };
  shipping: {
    name: string;
    address_1: string;
    address_2: string;
    city: string;
    postcode: string;
    country: string;
  };
  line_items: Array<{
    name: string;
    quantity: number;
    total: string;
    unit_price: string;
  }>;
}

async function loadLogoBase64(): Promise<string | null> {
  try {
    const res = await fetch('/logo.png');
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

const BRAND_COLOR = [220, 38, 38] as [number, number, number]; // red-600
const LIGHT_GRAY = [248, 248, 248] as [number, number, number];
const BORDER_GRAY = [220, 220, 220] as [number, number, number];
const TEXT_DARK = [30, 30, 30] as [number, number, number];
const TEXT_MUTED = [100, 100, 100] as [number, number, number];

export async function generateInvoicePdf(data: InvoiceData): Promise<void> {
  const { jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');

  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 16;
  const contentW = pageW - margin * 2;

  // ── Logo
  const logoData = await loadLogoBase64();
  let headerTextX = margin;
  if (logoData) {
    doc.addImage(logoData, 'PNG', margin, 12, 36, 14);
    headerTextX = margin + 42;
  }

  // ── Company block (right-aligned)
  doc.setFontSize(7.5);
  doc.setTextColor(...TEXT_MUTED);
  const companyLines = [
    `${COMPANY.brandName.toUpperCase()} [AN HG ENTERPRISE]`,
    `${COMPANY.office.line1}, ${COMPANY.office.line2}`,
    `${COMPANY.office.area}, ${COMPANY.office.country}`,
    `Helpline: ${COMPANY.phones.hotline} | WhatsApp: ${COMPANY.phones.sales}`,
    `support@e-mart.com.bd · https://e-mart.com.bd`,
  ];
  const rightX = pageW - margin;
  let compY = 12;
  doc.setFont('helvetica', 'bold');
  companyLines.forEach((line, i) => {
    if (i === 0) {
      doc.setFontSize(8.5);
      doc.setTextColor(...TEXT_DARK);
    } else {
      doc.setFontSize(7.5);
      doc.setTextColor(...TEXT_MUTED);
      doc.setFont('helvetica', 'normal');
    }
    doc.text(line, rightX, compY, { align: 'right' });
    compY += i === 0 ? 4.5 : 3.8;
  });

  // ── Divider
  const dividerY = 30;
  doc.setDrawColor(...BORDER_GRAY);
  doc.setLineWidth(0.3);
  doc.line(margin, dividerY, pageW - margin, dividerY);

  // ── INVOICE heading
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...BRAND_COLOR);
  doc.text('INVOICE', margin, 40);

  // ── Order meta (right side)
  const date = new Date(data.date_created).toLocaleDateString('en-GB', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...TEXT_DARK);
  const metaRows = [
    ['Order #', String(data.order_id)],
    ['Date', date],
    ['Status', data.status_label],
    ['Payment', data.payment_method_title],
  ];
  let metaY = 34;
  metaRows.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...TEXT_MUTED);
    doc.text(label + ':', rightX - 40, metaY, { align: 'left' });
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...TEXT_DARK);
    doc.text(value, rightX, metaY, { align: 'right' });
    metaY += 5;
  });

  // ── Bill To / Ship To
  const colW = (contentW - 8) / 2;
  const addrY = 55;

  // Bill To box
  doc.setFillColor(...LIGHT_GRAY);
  doc.setDrawColor(...BORDER_GRAY);
  doc.roundedRect(margin, addrY, colW, 36, 2, 2, 'FD');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...BRAND_COLOR);
  doc.text('BILL TO', margin + 4, addrY + 6);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...TEXT_DARK);
  const billLines = [
    data.billing.name,
    data.billing.email,
    data.billing.phone,
    [data.billing.address_1, data.billing.address_2].filter(Boolean).join(', '),
    [data.billing.city, data.billing.postcode].filter(Boolean).join(' '),
    data.billing.country,
  ].filter(Boolean);
  let billY = addrY + 11;
  billLines.forEach((line) => {
    doc.text(line, margin + 4, billY);
    billY += 4.2;
  });

  // Ship To box
  const shipX = margin + colW + 8;
  doc.setFillColor(...LIGHT_GRAY);
  doc.setDrawColor(...BORDER_GRAY);
  doc.roundedRect(shipX, addrY, colW, 36, 2, 2, 'FD');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...BRAND_COLOR);
  doc.text('SHIP TO', shipX + 4, addrY + 6);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...TEXT_DARK);
  const shipLines = [
    data.shipping.name,
    [data.shipping.address_1, data.shipping.address_2].filter(Boolean).join(', '),
    [data.shipping.city, data.shipping.postcode].filter(Boolean).join(' '),
    data.shipping.country,
  ].filter(Boolean);
  let shipY = addrY + 11;
  shipLines.forEach((line) => {
    doc.text(line, shipX + 4, shipY);
    shipY += 4.2;
  });

  // ── Items table
  const tableY = addrY + 42;
  const currency = data.currency === 'BDT' ? '৳' : data.currency;

  autoTable(doc, {
    startY: tableY,
    margin: { left: margin, right: margin },
    head: [['#', 'Product', 'Qty', 'Unit Price', 'Total']],
    body: data.line_items.map((item, i) => [
      String(i + 1),
      item.name,
      String(item.quantity),
      `${currency}${parseFloat(item.unit_price).toLocaleString('en-BD')}`,
      `${currency}${parseFloat(item.total).toLocaleString('en-BD')}`,
    ]),
    headStyles: {
      fillColor: BRAND_COLOR,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
    },
    bodyStyles: { fontSize: 8.5, textColor: TEXT_DARK },
    alternateRowStyles: { fillColor: LIGHT_GRAY },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 18, halign: 'center' },
      3: { cellWidth: 30, halign: 'right' },
      4: { cellWidth: 30, halign: 'right' },
    },
    styles: { overflow: 'linebreak', cellPadding: 3 },
    theme: 'grid',
  });

  // ── Grand total
  const finalY = (doc as any).lastAutoTable.finalY + 6;
  const totalBoxW = 70;
  const totalBoxX = pageW - margin - totalBoxW;
  doc.setFillColor(...BRAND_COLOR);
  doc.roundedRect(totalBoxX, finalY, totalBoxW, 12, 2, 2, 'F');
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('GRAND TOTAL', totalBoxX + 4, finalY + 7.5);
  doc.text(`${currency}${parseFloat(data.total).toLocaleString('en-BD')}`, pageW - margin - 4, finalY + 7.5, { align: 'right' });

  // ── Footer
  const footerY = doc.internal.pageSize.getHeight() - 14;
  doc.setDrawColor(...BORDER_GRAY);
  doc.setLineWidth(0.2);
  doc.line(margin, footerY - 3, pageW - margin, footerY - 3);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...TEXT_MUTED);
  doc.text(`${COMPANY.brandName} · ${COMPANY.supportEmail} · ${COMPANY.phones.primary}`, pageW / 2, footerY + 1, { align: 'center' });
  doc.text('Thank you for shopping with us!', pageW / 2, footerY + 5, { align: 'center' });

  doc.save(`emart-invoice-${data.order_id}.pdf`);
}
