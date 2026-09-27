import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Helper to convert URL to Base64
 * This prevents the logo from being blank due to sync rendering
 */
const getBase64Image = (url) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.setAttribute('crossOrigin', 'anonymous');
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = (err) => reject(err);
    img.src = url;
  });
};

export async function generatePDF({
  settings,
  title = 'Payment Statement',
  subtitle = '',
  investor,
  columns = [],
  data = [],
  filename = 'statement.pdf',
  showTotal = true,
}) {
  if (!data || data.length === 0) return;

  const doc = new jsPDF();

  // 1. LOGO (Async loading)
  if (settings?.logo_url) {
    try {
      const imgData = await getBase64Image(settings.logo_url);
      doc.addImage(imgData, 'PNG', 160, 10, 30, 15);
    } catch (e) {
      console.warn('Logo failed to load:', e);
    }
  }

  // 2. COMPANY NAME (From Settings Table)
  doc.setFontSize(14);
  doc.setFont(undefined, 'bold');
  doc.text(settings?.company_name || 'WINAM DEVELOPMENT GROUP', 14, 15);

  // 3. TITLE & SUBTITLE
  doc.setFontSize(16);
  doc.text(title, 14, 25);

  if (subtitle) {
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(subtitle, 14, 32);
  }

  // 4. INVESTOR INFO (From Shareholders Table)
  let infoY = 40;
  if (investor) {
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.text('Investor Information', 14, infoY);

    doc.setFont(undefined, 'normal');
    doc.text(`Name: ${investor.fullName || 'N/A'}`, 14, infoY + 6);
    doc.text(`Email: ${investor.email || 'N/A'}`, 14, infoY + 12);

    infoY += 22;
  }

  // 5. TABLE
  const tableData = data.map((row) => columns.map((col) => col.accessor(row)));

  autoTable(doc, {
    startY: infoY,
    head: [columns.map((col) => col.header)],
    body: tableData,
    styles: { fontSize: 9 },
    headStyles: {
      fillColor: [15, 23, 42], // Slate-900
      textColor: 255,
    },
  });

  // 6. TOTAL
  if (showTotal) {
    const total = data.reduce((sum, row) => sum + (Number(row.amount) || 0), 0);
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.text(
      `Total Paid: $${total.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
      14,
      doc.lastAutoTable.finalY + 10
    );
  }

  // 7. FOOTER
  doc.setFontSize(8);
  doc.setTextColor(150);
  if (settings?.statement_footer) {
    doc.text(settings.statement_footer, 14, 285);
  } else {
    doc.text(`Generated on ${new Date().toLocaleDateString()}`, 14, 285);
  }

  doc.save(filename);
}
