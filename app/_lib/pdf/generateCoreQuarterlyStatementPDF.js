import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Helper to convert URL to Base64 safely
 */
const getBase64Image = (url) => {
  return new Promise((resolve) => {
    if (!url || typeof window === 'undefined') return resolve(null);
    const img = new Image();
    img.setAttribute('crossOrigin', 'anonymous');
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      } catch (err) {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
};

const formatUSD = (val) => {
  return `$${Number(val || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

/**
 * Common Header Renderer
 */
const renderHeader = async (doc, { settings, title, subtitle, period, opportunity, margin, pageWidth }) => {
  if (settings?.logo_url) {
    try {
      const logoBase64 = await getBase64Image(settings.logo_url);
      if (logoBase64) {
        doc.addImage(logoBase64, 'PNG', pageWidth - margin - 26, 10, 26, 13);
      }
    } catch (e) {}
  }

  // Company Name
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text((settings?.company_name || 'WINAM DEVELOPMENT GROUP').toUpperCase(), margin, 17);

  // Statement Title
  doc.setFontSize(15);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(180, 83, 9); // amber-700
  doc.text(title, margin, 25);

  // Subtitle / Period
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`${opportunity?.name || 'Core Portfolio Equity'} | ${subtitle}`, margin, 31);
  doc.text(
    `Period: ${period?.startDate} to ${period?.endDate} | Currency: ${settings?.default_currency || 'USD'} | Generated: ${new Date().toISOString().split('T')[0]}`,
    margin,
    36
  );

  // Rule
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(margin, 40, pageWidth - margin, 40);

  return 44;
};

/**
 * Common Footer Renderer
 */
const renderFooters = (doc, { settings, margin, pageWidth, pageHeight }) => {
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);

    const footerText =
      settings?.statement_footer ||
      'CONFIDENTIAL - FOR AUTHORIZED WINAM ADMINISTRATORS & AUDITORS ONLY';
    doc.text(footerText, margin, pageHeight - 7.5);
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin - 16, pageHeight - 7.5);
  }
};

/**
 * Generate Core Quarterly Financial Statement PDF
 * @param {Object} statementData - Returned from getCoreQuarterlyFinancials
 * @param {Object} options - { download: boolean, returnBlob: boolean, statementType: 'ALL' | 'INCOME_STATEMENT' | 'BALANCE_SHEET' | 'CASH_FLOW' | 'SHAREHOLDERS_EQUITY' }
 */
export async function generateCoreQuarterlyStatementPDF(
  statementData,
  options = { download: true, returnBlob: false, statementType: 'ALL' }
) {
  if (!statementData) return null;

  const statementType = options.statementType || 'ALL';
  const {
    opportunity,
    settings,
    period,
    metrics,
    balanceSheet,
    incomeStatement,
    cashFlow,
    shareholdersEquity,
  } = statementData;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;

  const isCompanyScope =
    statementData.scope === 'COMPANY' ||
    opportunity?.name?.toLowerCase().includes('whole company') ||
    opportunity?.id === 'COMPANY';

  const scopePrefix = isCompanyScope ? 'Company' : 'Opportunity';
  let filename = `${scopePrefix}_Financial_Statements_${period?.year}_${period?.quarter}.pdf`;

  // =========================================================================
  // 1. INDIVIDUAL: INCOME STATEMENT
  // =========================================================================
  if (statementType === 'INCOME_STATEMENT') {
    filename = `${scopePrefix}_Income_Statement_${period?.year}_${period?.quarter}.pdf`;
    let startY = await renderHeader(doc, {
      settings,
      title: isCompanyScope ? 'CONSOLIDATED STATEMENT OF OPERATIONS' : 'INCOME STATEMENT',
      subtitle: isCompanyScope ? 'Comprehensive Operations & Capital Inflows' : 'Statement of Operations & Comprehensive Income',
      period,
      opportunity,
      margin,
      pageWidth,
    });

    const incomeRows = [
      ['CAPITAL REVENUES & INFLOWS', ''],
      ...(incomeStatement?.revenues || []).map((r) => [`   ${r.label}`, formatUSD(r.amount)]),
      ['Total Revenues / Inflows', formatUSD(incomeStatement?.totalRevenues)],
      ['OPERATING EXPENSES & TRANSACTION COSTS', ''],
      ...(incomeStatement?.expenses || []).map((e) => [`   ${e.label}`, formatUSD(e.amount)]),
      ['Total Operating Expenses', formatUSD(incomeStatement?.totalExpenses)],
      ['NET OPERATING INCOME / SURPLUS', formatUSD(incomeStatement?.netIncome)],
    ];

    autoTable(doc, {
      startY,
      head: [['Operating Classification', 'Amount (USD)']],
      body: incomeRows,
      theme: 'grid',
      headStyles: {
        fillColor: [15, 23, 42],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9,
      },
      styles: { fontSize: 8.5, cellPadding: 3 },
      columnStyles: {
        0: { cellWidth: 125 },
        1: { cellWidth: 'auto', halign: 'right', fontStyle: 'bold' },
      },
      didParseCell: (data) => {
        const text = data.cell.raw;
        if (text === 'CAPITAL REVENUES & INFLOWS' || text === 'OPERATING EXPENSES & TRANSACTION COSTS') {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fillColor = [241, 245, 249];
          data.cell.styles.textColor = [15, 23, 42];
        } else if (text === 'NET OPERATING INCOME / SURPLUS') {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fillColor = [254, 243, 199];
          data.cell.styles.textColor = [180, 83, 9];
        }
      },
      margin: { left: margin, right: margin },
    });
  }

  // =========================================================================
  // 2. INDIVIDUAL: BALANCE SHEET
  // =========================================================================
  else if (statementType === 'BALANCE_SHEET') {
    filename = `${scopePrefix}_Balance_Sheet_${period?.year}_${period?.quarter}.pdf`;
    let startY = await renderHeader(doc, {
      settings,
      title: isCompanyScope ? 'CONSOLIDATED BALANCE SHEET' : 'BALANCE SHEET',
      subtitle: isCompanyScope ? 'Whole Company Assets & Financial Position' : 'Statement of Financial Position',
      period,
      opportunity,
      margin,
      pageWidth,
    });

    const bsRows = [
      ['CURRENT ASSETS', ''],
      ...(balanceSheet?.currentAssets || []).map((a) => [`   ${a.label}`, formatUSD(a.amount)]),
      ['Total Current Assets', formatUSD(balanceSheet?.totalCurrentAssets)],
      ['NON-CURRENT / PORTFOLIO ASSETS', ''],
      ...(balanceSheet?.nonCurrentAssets || []).map((a) => [`   ${a.label}`, formatUSD(a.amount)]),
      ['Total Non-Current Portfolio Assets', formatUSD(balanceSheet?.totalNonCurrentAssets)],
      ['TOTAL ASSETS', formatUSD(balanceSheet?.totalAssets)],
      ['CURRENT LIABILITIES', ''],
      ...(balanceSheet?.currentLiabilities || []).map((l) => [`   ${l.label}`, formatUSD(l.amount)]),
      ['Total Liabilities', formatUSD(balanceSheet?.totalLiabilities)],
      ["SHAREHOLDERS' EQUITY", ''],
      ...(balanceSheet?.equity || []).map((e) => [`   ${e.label}`, formatUSD(e.amount)]),
      ["Total Shareholders' Equity", formatUSD(balanceSheet?.totalShareholderEquity)],
      ["TOTAL LIABILITIES & SHAREHOLDERS' EQUITY", formatUSD(balanceSheet?.totalLiabilitiesAndEquity)],
    ];

    autoTable(doc, {
      startY,
      head: [['Financial Position Classification', 'Balance (USD)']],
      body: bsRows,
      theme: 'grid',
      headStyles: {
        fillColor: [217, 119, 6],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9,
      },
      styles: { fontSize: 8.5, cellPadding: 3 },
      columnStyles: {
        0: { cellWidth: 125 },
        1: { cellWidth: 'auto', halign: 'right', fontStyle: 'bold' },
      },
      didParseCell: (data) => {
        const text = data.cell.raw;
        if (['CURRENT ASSETS', 'NON-CURRENT / PORTFOLIO ASSETS', 'CURRENT LIABILITIES', "SHAREHOLDERS' EQUITY"].includes(text)) {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fillColor = [241, 245, 249];
          data.cell.styles.textColor = [15, 23, 42];
        } else if (text === 'TOTAL ASSETS' || text === "TOTAL LIABILITIES & SHAREHOLDERS' EQUITY") {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fillColor = [254, 243, 199];
          data.cell.styles.textColor = [120, 53, 15];
        }
      },
      margin: { left: margin, right: margin },
    });
  }

  // =========================================================================
  // 3. INDIVIDUAL: STATEMENT OF CASH FLOWS
  // =========================================================================
  else if (statementType === 'CASH_FLOW') {
    filename = `${scopePrefix}_Cash_Flow_Statement_${period?.year}_${period?.quarter}.pdf`;
    let startY = await renderHeader(doc, {
      settings,
      title: isCompanyScope ? 'CONSOLIDATED STATEMENT OF CASH FLOWS' : 'STATEMENT OF CASH FLOWS',
      subtitle: isCompanyScope ? 'Whole Company Cash Flows from Operating, Investing, and Financing' : 'Cash Flows from Operating, Investing, and Financing Activities',
      period,
      opportunity,
      margin,
      pageWidth,
    });

    const cfRows = [
      ['CASH FLOWS FROM OPERATING ACTIVITIES', ''],
      ...(cashFlow?.operatingActivities || []).map((o) => [`   ${o.label}`, formatUSD(o.amount)]),
      ['Net Cash from Operating Activities', formatUSD(cashFlow?.netOperatingCash)],
      ['CASH FLOWS FROM INVESTING ACTIVITIES', ''],
      ...(cashFlow?.investingActivities || []).map((i) => [`   ${i.label}`, formatUSD(i.amount)]),
      ['Net Cash from Investing Activities', formatUSD(cashFlow?.netInvestingCash)],
      ['CASH FLOWS FROM FINANCING ACTIVITIES', ''],
      ...(cashFlow?.financingActivities || []).map((f) => [`   ${f.label}`, formatUSD(f.amount)]),
      ['Net Cash from Financing Activities', formatUSD(cashFlow?.netFinancingCash)],
      ['NET INCREASE / (DECREASE) IN CASH', formatUSD(cashFlow?.netCashChange)],
      ['Cash at Beginning of Period', formatUSD(cashFlow?.beginningCash)],
      ['CASH AT END OF PERIOD', formatUSD(cashFlow?.endingCash)],
    ];

    autoTable(doc, {
      startY,
      head: [['Cash Flow Activity', 'Amount (USD)']],
      body: cfRows,
      theme: 'grid',
      headStyles: {
        fillColor: [5, 150, 105],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9,
      },
      styles: { fontSize: 8.5, cellPadding: 3 },
      columnStyles: {
        0: { cellWidth: 125 },
        1: { cellWidth: 'auto', halign: 'right', fontStyle: 'bold' },
      },
      didParseCell: (data) => {
        const text = data.cell.raw;
        if (['CASH FLOWS FROM OPERATING ACTIVITIES', 'CASH FLOWS FROM INVESTING ACTIVITIES', 'CASH FLOWS FROM FINANCING ACTIVITIES'].includes(text)) {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fillColor = [241, 245, 249];
          data.cell.styles.textColor = [15, 23, 42];
        } else if (text === 'CASH AT END OF PERIOD') {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fillColor = [209, 250, 229];
          data.cell.styles.textColor = [6, 78, 59];
        }
      },
      margin: { left: margin, right: margin },
    });
  }

  // =========================================================================
  // 4. INDIVIDUAL: STATEMENT OF SHAREHOLDERS' EQUITY
  // =========================================================================
  else if (statementType === 'SHAREHOLDERS_EQUITY') {
    filename = `${scopePrefix}_Shareholders_Equity_${period?.year}_${period?.quarter}.pdf`;
    let startY = await renderHeader(doc, {
      settings,
      title: isCompanyScope ? "CONSOLIDATED STATEMENT OF SHAREHOLDERS' EQUITY" : "STATEMENT OF SHAREHOLDERS' EQUITY",
      subtitle: isCompanyScope ? 'Consolidated Equity Schedule & Rollforward' : 'Statement of Changes in Equity & Rollforward',
      period,
      opportunity,
      margin,
      pageWidth,
    });

    const rf = shareholdersEquity?.rollforward;
    const eqRows = [
      ['Beginning Contributed Share Capital', formatUSD(rf?.beginningContributedCapital)],
      ['Add: Capital Contributions Received in Quarter', formatUSD(rf?.periodContributions)],
      ['Less: Capital Redemptions Paid', formatUSD(-rf?.periodRedemptions)],
      ['Ending Contributed Share Capital', formatUSD(rf?.endingContributedCapital)],
      ['Beginning Retained Operating Surplus', formatUSD(rf?.beginningRetainedSurplus)],
      ['Add: Net Operating Income for Period', formatUSD(rf?.periodNetIncome)],
      ['Ending Retained Operating Surplus', formatUSD(rf?.endingRetainedSurplus)],
      ["TOTAL ENDING SHAREHOLDERS' EQUITY", formatUSD(rf?.totalEndingEquity)],
    ];

    autoTable(doc, {
      startY,
      head: [['Equity Component Rollforward', 'Balance (USD)']],
      body: eqRows,
      theme: 'grid',
      headStyles: {
        fillColor: [79, 70, 229],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9,
      },
      styles: { fontSize: 8.5, cellPadding: 3 },
      columnStyles: {
        0: { cellWidth: 125 },
        1: { cellWidth: 'auto', halign: 'right', fontStyle: 'bold' },
      },
      didParseCell: (data) => {
        if (data.cell.raw === "TOTAL ENDING SHAREHOLDERS' EQUITY") {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fillColor = [238, 242, 255];
          data.cell.styles.textColor = [49, 46, 129];
        }
      },
      margin: { left: margin, right: margin },
    });
  }

  // =========================================================================
  // 5. INDIVIDUAL: SHAREHOLDER OWNERSHIP REGISTER & ALLOCATION SCHEDULE
  // =========================================================================
  else if (statementType === 'SHAREHOLDER_REGISTER') {
    filename = `${scopePrefix}_Shareholder_Register_${period?.year}_${period?.quarter}.pdf`;
    let startY = await renderHeader(doc, {
      settings,
      title: isCompanyScope
        ? 'CONSOLIDATED SHAREHOLDER OWNERSHIP REGISTER & ALLOCATIONS'
        : 'SHAREHOLDER OWNERSHIP REGISTER & ALLOCATION SCHEDULE',
      subtitle: isCompanyScope
        ? `Consolidated Shareholder Register Across All Opportunities (${shareholdersEquity?.shareholderSchedule?.length || 0} Investors)`
        : `Active Core Shareholders & Allocations (${shareholdersEquity?.shareholderSchedule?.length || 0} Investors)`,
      period,
      opportunity,
      margin,
      pageWidth,
    });

    const shHeaders = isCompanyScope
      ? [['#', 'Shareholder', 'Participated Holdings', 'Quarter Inflow', 'Contributed Capital', 'Ownership %']]
      : [['#', 'Shareholder', 'Email', 'Quarter Inflow', 'Total Contributed', 'Ownership %']];

    const shRows = (shareholdersEquity?.shareholderSchedule || []).map((sh, i) => [
      i + 1,
      sh.name || 'Anonymous',
      isCompanyScope
        ? (sh.participatedOpportunities || []).map((o) => o.name).join(', ') || 'None'
        : sh.email || 'N/A',
      formatUSD(sh.periodContributions),
      formatUSD(sh.endingBalance),
      `${sh.ownershipPercent}%`,
    ]);

    autoTable(doc, {
      startY,
      head: shHeaders,
      body: shRows,
      theme: 'striped',
      headStyles: {
        fillColor: [15, 23, 42],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8,
      },
      styles: { fontSize: 7.5, cellPadding: 2.5 },
      columnStyles: {
        0: { cellWidth: 8, halign: 'center' },
        1: { cellWidth: 38, fontStyle: 'bold' },
        2: { cellWidth: 50 },
        3: { cellWidth: 26, halign: 'right' },
        4: { cellWidth: 32, halign: 'right', fontStyle: 'bold' },
        5: { cellWidth: 20, halign: 'right' },
      },
      margin: { left: margin, right: margin },
    });
  }

  // =========================================================================
  // 5. ALL / COMPLETE FINANCIAL STATEMENTS PACKAGE
  // =========================================================================
  else {
    filename = `${scopePrefix}_Complete_Financial_Statements_${period?.year}_${period?.quarter}.pdf`;

    // PAGE 1: COVER & EXECUTIVE SUMMARY + INCOME STATEMENT + BALANCE SHEET
    let currentY = await renderHeader(doc, {
      settings,
      title: isCompanyScope ? 'COMPANY-WIDE QUARTERLY FINANCIAL STATEMENTS' : 'CORE QUARTERLY FINANCIAL STATEMENTS',
      subtitle: isCompanyScope ? 'Consolidated 4-Statement Financial Reporting Package' : 'Comprehensive 4-Statement Financial Reporting Package',
      period,
      opportunity,
      margin,
      pageWidth,
    });

    // Executive KPI Box
    const boxHeight = 18;
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(margin, currentY, pageWidth - margin * 2, boxHeight, 2, 2, 'F');
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(margin, currentY, pageWidth - margin * 2, boxHeight, 2, 2, 'S');

    const colWidth = (pageWidth - margin * 2) / 4;
    const kpis = isCompanyScope
      ? [
          { label: 'TOTAL COMPANY ASSETS', value: formatUSD(balanceSheet?.totalAssets) },
          { label: 'CASH & EQUIVALENTS', value: formatUSD(balanceSheet?.totalCurrentAssets) },
          { label: 'PORTFOLIO HOLDINGS', value: formatUSD(balanceSheet?.totalNonCurrentAssets) },
          { label: 'ACTIVE SHAREHOLDERS', value: String(metrics?.activeShareholderCount || 0) },
        ]
      : [
          { label: 'TARGET CAPITAL', value: formatUSD(metrics?.targetCapitalization) },
          { label: 'CUMULATIVE RAISED', value: formatUSD(metrics?.cumulativeCapitalRaised) },
          { label: 'QUARTER INFLOWS', value: formatUSD(metrics?.periodInflows) },
          { label: 'ACTIVE SHAREHOLDERS', value: String(metrics?.activeShareholderCount || 0) },
        ];

    kpis.forEach((kpi, idx) => {
      const x = margin + idx * colWidth + 4;
      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(100, 116, 139);
      doc.text(kpi.label, x, currentY + 6);

      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(kpi.value, x, currentY + 14);
    });

    currentY += boxHeight + 6;

    // 1. Income Statement Table
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(
      isCompanyScope
        ? '1. Consolidated Statement of Operations (Income Statement)'
        : '1. Income Statement (Statement of Operations)',
      margin,
      currentY
    );
    currentY += 3;

    const incomeRows = [
      ['Total Capital Revenues / Inflows', formatUSD(incomeStatement?.totalRevenues)],
      ['Operating Expenses & Processing Costs', formatUSD(incomeStatement?.totalExpenses)],
      ['Net Operating Income / Surplus', formatUSD(incomeStatement?.netIncome)],
    ];

    autoTable(doc, {
      startY: currentY,
      head: [['Operating Classification', 'Amount (USD)']],
      body: incomeRows,
      theme: 'grid',
      headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
      styles: { fontSize: 7.5, cellPadding: 2 },
      columnStyles: {
        0: { cellWidth: 130 },
        1: { cellWidth: 'auto', halign: 'right', fontStyle: 'bold' },
      },
      margin: { left: margin, right: margin },
    });

    currentY = doc.lastAutoTable.finalY + 6;

    // 2. Balance Sheet Table
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(
      isCompanyScope
        ? '2. Consolidated Balance Sheet (Statement of Financial Position)'
        : '2. Balance Sheet (Statement of Financial Position)',
      margin,
      currentY
    );
    currentY += 3;

    const bsRows = isCompanyScope
      ? [
          ['Current Assets: Cash & Equivalents across Funds', formatUSD(balanceSheet?.totalCurrentAssets)],
          ['Non-Current Assets: Portfolio Ventures & Projects', formatUSD(balanceSheet?.totalNonCurrentAssets)],
          ['TOTAL COMPANY ASSETS', formatUSD(balanceSheet?.totalAssets)],
          ['Total Liabilities (Pending Redemptions)', formatUSD(balanceSheet?.totalLiabilities)],
          ["Contributed Share Capital (All Investments)", formatUSD(balanceSheet?.equity?.[0]?.amount)],
          [balanceSheet?.equity?.[1]?.label || "Valuation Surplus & Retained Reserves", formatUSD(balanceSheet?.equity?.[1]?.amount)],
          ["Total Shareholders' Equity", formatUSD(balanceSheet?.totalShareholderEquity)],
          ["TOTAL LIABILITIES & SHAREHOLDERS' EQUITY", formatUSD(balanceSheet?.totalLiabilitiesAndEquity)],
        ]
      : [
          ['Cash & Cash Equivalents (Vault)', formatUSD(balanceSheet?.totalCurrentAssets)],
          ['Non-Current Assets (NAV)', formatUSD(balanceSheet?.totalNonCurrentAssets || 0)],
          ['TOTAL ASSETS', formatUSD(balanceSheet?.totalAssets)],
          ['Total Liabilities (Pending Redemptions)', formatUSD(balanceSheet?.totalLiabilities)],
          ["Contributed Share Capital", formatUSD(balanceSheet?.equity?.[0]?.amount)],
          [balanceSheet?.equity?.[1]?.label || "Valuation Surplus & Retained Reserves", formatUSD(balanceSheet?.equity?.[1]?.amount)],
          ["Total Shareholders' Equity", formatUSD(balanceSheet?.totalShareholderEquity)],
          ["TOTAL LIABILITIES & SHAREHOLDERS' EQUITY", formatUSD(balanceSheet?.totalLiabilitiesAndEquity)],
        ];

    autoTable(doc, {
      startY: currentY,
      head: [['Balance Sheet Position', 'Balance (USD)']],
      body: bsRows,
      theme: 'grid',
      headStyles: { fillColor: [217, 119, 6], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
      styles: { fontSize: 7.5, cellPadding: 2 },
      columnStyles: {
        0: { cellWidth: 130 },
        1: { cellWidth: 'auto', halign: 'right', fontStyle: 'bold' },
      },
      didParseCell: (data) => {
        const text = data.cell.raw;
        if (text === 'TOTAL COMPANY ASSETS' || text === 'TOTAL ASSETS' || text === "TOTAL LIABILITIES & SHAREHOLDERS' EQUITY") {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fillColor = [254, 243, 199];
          data.cell.styles.textColor = [120, 53, 15];
        }
      },
      margin: { left: margin, right: margin },
    });

    // PAGE 2: CASH FLOWS & SHAREHOLDERS EQUITY ROLLFORWARD
    doc.addPage();
    let p2Y = 16;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(
      isCompanyScope
        ? '3. Consolidated Statement of Cash Flows'
        : '3. Statement of Cash Flows',
      margin,
      p2Y
    );
    p2Y += 3;

    const cfRows = [
      ['Net Cash from Operating Activities', formatUSD(cashFlow?.netOperatingCash)],
      ['Net Cash from Investing Activities', formatUSD(cashFlow?.netInvestingCash)],
      ['Net Cash from Financing Activities', formatUSD(cashFlow?.netFinancingCash)],
      ['Net Increase in Cash & Equivalents', formatUSD(cashFlow?.netCashChange)],
      ['Cash at Beginning of Period', formatUSD(cashFlow?.beginningCash)],
      ['Cash at End of Period', formatUSD(cashFlow?.endingCash)],
    ];

    autoTable(doc, {
      startY: p2Y,
      head: [['Cash Activity', 'Amount (USD)']],
      body: cfRows,
      theme: 'grid',
      headStyles: { fillColor: [5, 150, 105], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
      styles: { fontSize: 7.5, cellPadding: 2 },
      columnStyles: {
        0: { cellWidth: 130 },
        1: { cellWidth: 'auto', halign: 'right', fontStyle: 'bold' },
      },
      margin: { left: margin, right: margin },
    });

    p2Y = doc.lastAutoTable.finalY + 8;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(
      isCompanyScope
        ? "4. Consolidated Statement of Shareholders' Equity"
        : "4. Statement of Shareholders' Equity",
      margin,
      p2Y
    );
    p2Y += 3;

    const rf = shareholdersEquity?.rollforward;
    const eqRows = [
      ['Beginning Contributed Share Capital', formatUSD(rf?.beginningContributedCapital)],
      ['Add: Quarter Capital Contributions', formatUSD(rf?.periodContributions)],
      ['Less: Quarter Redemptions Paid', formatUSD(-rf?.periodRedemptions)],
      ['Ending Contributed Share Capital', formatUSD(rf?.endingContributedCapital)],
      ['Ending Retained Surplus', formatUSD(rf?.endingRetainedSurplus)],
      ["Total Ending Shareholders' Equity", formatUSD(rf?.totalEndingEquity)],
    ];

    autoTable(doc, {
      startY: p2Y,
      head: [['Equity Rollforward', 'Balance (USD)']],
      body: eqRows,
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
      styles: { fontSize: 7.5, cellPadding: 2 },
      columnStyles: {
        0: { cellWidth: 130 },
        1: { cellWidth: 'auto', halign: 'right', fontStyle: 'bold' },
      },
      margin: { left: margin, right: margin },
    });

    // PAGE 3: SHAREHOLDER REGISTER / CAP TABLE
    doc.addPage();
    let p3Y = 16;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(
      isCompanyScope
        ? '5. Consolidated Shareholder Ownership Schedule'
        : '5. Shareholder Ownership Schedule',
      margin,
      p3Y
    );

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(
      isCompanyScope
        ? `Consolidated Shareholder Register Across All Opportunities (${shareholdersEquity?.shareholderSchedule?.length || 0} Investors)`
        : `Active Core Shareholders (${shareholdersEquity?.shareholderSchedule?.length || 0} Investors)`,
      margin,
      p3Y + 5
    );
    p3Y += 8;

    const shHeaders = isCompanyScope
      ? [['#', 'Shareholder', 'Participated Holdings', 'Quarter Inflow', 'Contributed Capital', 'Ownership %']]
      : [['#', 'Shareholder', 'Email', 'Quarter Inflow', 'Total Contributed', 'Ownership %']];

    const shRows = (shareholdersEquity?.shareholderSchedule || []).map((sh, i) => [
      i + 1,
      sh.name || 'Anonymous',
      isCompanyScope
        ? (sh.participatedOpportunities || []).map((o) => o.name).join(', ') || 'None'
        : sh.email || 'N/A',
      formatUSD(sh.periodContributions),
      formatUSD(sh.endingBalance),
      `${sh.ownershipPercent}%`,
    ]);

    autoTable(doc, {
      startY: p3Y,
      head: shHeaders,
      body: shRows,
      theme: 'striped',
      headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
      styles: { fontSize: 7.5, cellPadding: 2 },
      columnStyles: {
        0: { cellWidth: 8, halign: 'center' },
        1: { cellWidth: 38, fontStyle: 'bold' },
        2: { cellWidth: 50 },
        3: { cellWidth: 26, halign: 'right' },
        4: { cellWidth: 32, halign: 'right', fontStyle: 'bold' },
        5: { cellWidth: 20, halign: 'right' },
      },
      margin: { left: margin, right: margin },
    });
  }

  // Render footers on all pages
  renderFooters(doc, { settings, margin, pageWidth, pageHeight });

  if (options.download) {
    doc.save(filename);
  }

  if (options.returnBlob) {
    return doc.output('blob');
  }

  return doc;
}
