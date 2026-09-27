'use client';

import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { generatePDF } from '../_lib/pdf/generatePDF';
import { FormatCurrency } from '../_lib/utils';

function PDFDownloadButton({
  data,
  opportunityName,
  investor,
  settings,
  label = 'Download PDF',
}) {
  const handleDownload = async () => {
    await generatePDF({
      settings,
      investor,
      title: 'Payment Statement',
      subtitle: `Opportunity: ${opportunityName || 'Investment'}`,
      filename: `${opportunityName?.replace(/\s+/g, '_') || 'statement'}.pdf`,
      columns: [
        {
          header: 'Date',
          accessor: (row) =>
            new Date(row.transaction_date).toLocaleDateString(),
        },
        {
          header: 'Description',
          accessor: (row) =>
            row.line_item_name +
            (row.status === 'failed'
              ? ` [UNRECONCILED: ${row.failure_reason || 'Could not be verified'}]`
              : ''),
        },
        {
          header: 'Status',
          accessor: (row) =>
            row.status === 'failed'
              ? 'FAILED'
              : row.status === 'pending'
                ? 'PENDING'
                : 'CREDITED',
        },
        {
          header: 'Amount',
          accessor: (row) =>
            row.status === 'failed'
              ? `(${FormatCurrency(Number(row.amount))})`
              : FormatCurrency(Number(row.amount)),
        },
      ],
      data,
    });
  };

  return (
    <button
      onClick={handleDownload}
      disabled={!investor || !settings}
      className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-blue-600 transition disabled:opacity-50 cursor-pointer"
    >
      <ArrowDownTrayIcon className="h-4 w-4" />
      {label}
    </button>
  );
}

export default PDFDownloadButton;
