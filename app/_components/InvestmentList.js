'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  BriefcaseIcon,
  DocumentTextIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  CalendarDaysIcon,
} from '@heroicons/react/24/solid';
import { format, parseISO } from 'date-fns';
import toast from 'react-hot-toast';
import { requestRedemption } from '../_lib/actions';
import { formatClientError } from '@/app/_lib/client-error-handler';
import { FormatCurrency } from '../_lib/utils';
import RedemptionModal from './RedemptionModal';
import PaymentStatementModal from './PaymentStatementModal';
import RedemptionStatusModal from './RedemptionStatusModal';

const STATUS_STYLES = {
  active: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
  pending: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800',
  withdrawal_pending: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
  exited: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700',
  cancelled: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800',
  default: 'bg-white text-slate-900 border-slate-200 dark:bg-slate-900 dark:text-slate-100',
};

function InvestmentList({ investments }) {
  const [selectedInvestment, setSelectedInvestment] = useState(null);
  const [isWorking, setIsWorking] = useState(false);

  const [showStatement, setShowStatement] = useState(false);
  const [showRedemption, setShowRedemption] = useState(false);
  const [showRedemptionStatus, setShowRedemptionStatus] = useState(false);

  async function handleRedemptionSubmit(investmentId, { reason }) {
    try {
      setIsWorking(true);
      await requestRedemption(investmentId, reason);
      toast.success('Redemption request submitted for review');
      setShowRedemption(false);
      setSelectedInvestment(null);
    } catch (error) {
      console.error('Failed to submit:', error);
      toast.error(
        formatClientError(error, 'Unable to submit request. Please try again.')
      );
    } finally {
      setIsWorking(false);
    }
  }

  if (!investments || investments.length === 0) {
    return (
      <div className="text-center bg-white dark:bg-slate-900 p-8 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
        <p className="text-base text-slate-600 dark:text-slate-400 font-medium">
          No active investments found.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col min-h-0">
      {/* 2 ROWS X 2 COLS GRID ON LARGE SCREENS */}
      <ul className="grid grid-cols-1 md:grid-cols-2 gap-2.5 sm:gap-3">
        {investments.map((investment) => {
          const badgeStyle =
            STATUS_STYLES[investment.status] || STATUS_STYLES.default;

          const canRequestWithdraw = ![
            'active',
            'exited',
            'cancelled',
            'withdrawal_pending',
          ].includes(investment.status);

          const isExited = investment.status?.toLowerCase() === 'exited';

          const rawImageUrl = investment.opportunities?.image_url;
          const imageUrl =
            rawImageUrl && rawImageUrl.startsWith('http')
              ? rawImageUrl.trim()
              : rawImageUrl || '/logo.png';

          const deployed = Number(investment.amount_invested) || 0;
          const committed = Number(investment.total_committed) || 0;
          const deploymentRatio =
            committed > 0 ? Math.round((deployed / committed) * 100) : 0;

          return (
            <li
              key={investment.id}
              className={`group flex flex-col justify-between rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs hover:shadow-xs transition-all duration-200 p-2.5 sm:p-3 min-w-0 ${
                isExited
                  ? 'bg-slate-50/70 dark:bg-slate-900/40 border-slate-200 opacity-60 grayscale filter'
                  : 'bg-white dark:bg-slate-900'
              }`}
            >
              {/* 1. TITLE CENTERED TOP WITH STATUS PILL & META */}
              <div className="relative text-center pb-1.5 border-b border-slate-100 dark:border-slate-800/80 min-w-0">
                <div className="flex items-center justify-center gap-2 px-16 sm:px-20 min-w-0">
                  <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white tracking-tight truncate leading-snug">
                    {investment.opportunities?.name}
                  </h3>
                  <span className="text-[9px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded font-bold shrink-0">
                    #{investment.id}
                  </span>
                </div>

                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold tracking-tight truncate mt-0.5">
                  <span className="text-blue-600 dark:text-blue-400 font-bold uppercase">
                    {investment.opportunities?.type || 'Equity'}
                  </span>
                  {investment.start_date && (
                    <>
                      <span> • </span>
                      <span>{format(parseISO(investment.start_date), 'MMM yyyy')}</span>
                    </>
                  )}
                </p>

                {/* STATUS BADGE POSITIONED TOP RIGHT */}
                <div className="absolute right-0 top-0">
                  <span
                    className={`px-2 py-0.5 rounded-md border text-[9px] font-black uppercase tracking-wider shrink-0 ${badgeStyle}`}
                  >
                    {investment.status.replace('_', ' ')}
                  </span>
                </div>
              </div>

              {/* 2. MIDDLE: FULL IMAGE TO THE LEFT, DEPLOYED/COMMITTED/PROGRESS TO THE RIGHT */}
              <div className="flex items-center gap-2.5 sm:gap-3 my-2 min-w-0">
                {/* FULL IMAGE TO THE LEFT */}
                <div className="relative w-32 sm:w-36 md:w-40 h-24 sm:h-26 rounded-xl overflow-hidden shrink-0 bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-800 shadow-xs">
                  <Image
                    src={imageUrl}
                    fill
                    alt={investment.opportunities?.name || 'Opportunity'}
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    sizes="(max-width: 640px) 180px, (max-width: 1024px) 240px, 300px"
                    quality={95}
                  />
                </div>

                {/* DEPLOYED, COMMITTED, PROGRESS TO RIGHT SIDE OF IMAGE */}
                <div className="flex-1 flex flex-col justify-between h-24 sm:h-26 min-w-0 bg-slate-50/80 dark:bg-slate-950/60 p-2 sm:p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/80">
                  {/* DEPLOYED */}
                  <div className="flex items-center justify-between min-w-0 gap-1">
                    <span className="text-[9px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider truncate">
                      Deployed
                    </span>
                    <span className="text-xs sm:text-sm font-black text-emerald-600 dark:text-emerald-400 truncate leading-tight">
                      {FormatCurrency(deployed)}
                    </span>
                  </div>

                  {/* COMMITTED */}
                  <div className="flex items-center justify-between min-w-0 gap-1">
                    <span className="text-[9px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider truncate">
                      Committed
                    </span>
                    <span className="text-xs sm:text-sm font-black text-slate-800 dark:text-slate-200 truncate leading-tight">
                      {FormatCurrency(committed)}
                    </span>
                  </div>

                  {/* DEPLOYMENT PROGRESS */}
                  <div className="min-w-0 pt-0.5">
                    <div className="flex items-center justify-between text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
                      <span>Progress</span>
                      <span className="text-blue-600 dark:text-blue-400 font-black">{deploymentRatio}%</span>
                    </div>
                    <div className="w-full bg-slate-200/80 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-blue-600 dark:bg-blue-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(deploymentRatio, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. BOTTOM: VESTED, STATEMENTS, DOCS, EVENTS (+ WITHDRAW / REDEMPTIONS) */}
              <div className="flex items-center justify-between gap-1 sm:gap-1.5 pt-1.5 border-t border-slate-100 dark:border-slate-800/80 min-w-0">
                {/* VESTED */}
                <div className="flex items-center gap-1 shrink-0">
                  {investment.status === 'active' && (
                    <span className="text-[9px] text-emerald-700 dark:text-emerald-400 font-black uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-md inline-flex items-center gap-1">
                      <CheckCircleIcon className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400" />
                      <span>Vested</span>
                    </span>
                  )}
                </div>

                {/* STATEMENTS, DOCS, EVENTS, WITHDRAW */}
                <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 ml-auto">
                  {/* STATEMENTS */}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedInvestment(investment);
                      setShowStatement(true);
                    }}
                    className="px-2 sm:px-2.5 py-1 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/50 dark:hover:bg-blue-900/60 text-blue-900 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-lg text-[10px] sm:text-[11px] font-bold uppercase tracking-wider transition shadow-2xs cursor-pointer flex items-center gap-1"
                  >
                    <DocumentTextIcon className="h-3 w-3 text-blue-600 dark:text-blue-400 shrink-0" />
                    <span>Statements</span>
                  </button>

                  {/* DOCS */}
                  <Link
                    href="/account/documents"
                    className="px-2 sm:px-2.5 py-1 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg text-[10px] sm:text-[11px] font-bold uppercase tracking-wider transition shadow-2xs flex items-center gap-1"
                  >
                    <BriefcaseIcon className="h-3 w-3 text-slate-400 shrink-0" />
                    <span>Docs</span>
                  </Link>

                  {/* EVENTS */}
                  <Link
                    href="/account/calendar"
                    className="px-2 sm:px-2.5 py-1 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 rounded-lg text-[10px] sm:text-[11px] font-bold uppercase tracking-wider transition shadow-2xs flex items-center gap-1"
                  >
                    <CalendarDaysIcon className="h-3 w-3 text-blue-500 shrink-0" />
                    <span>Events</span>
                  </Link>

                  {/* WITHDRAW */}
                  {canRequestWithdraw && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedInvestment(investment);
                        setShowRedemption(true);
                      }}
                      className="px-2 sm:px-2.5 py-1 bg-blue-950 hover:bg-blue-900 dark:bg-blue-700 dark:hover:bg-blue-600 text-white rounded-lg text-[10px] sm:text-[11px] font-bold uppercase tracking-wider transition shadow-2xs cursor-pointer"
                    >
                      Withdraw
                    </button>
                  )}

                  {/* REDEMPTIONS */}
                  {investment.redemption_requests?.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedInvestment(investment);
                        setShowRedemptionStatus(true);
                      }}
                      className="px-2 py-1 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 rounded-lg text-[10px] sm:text-[11px] font-bold uppercase tracking-wider transition shadow-2xs cursor-pointer flex items-center gap-1"
                    >
                      <ArrowPathIcon className="h-3 w-3 text-rose-600 shrink-0" />
                      <span>Redemptions ({investment.redemption_requests.length})</span>
                    </button>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      {/* PAYMENT STATEMENT MODAL */}
      {showStatement && selectedInvestment && (
        <PaymentStatementModal
          opportunityId={selectedInvestment.opportunity_id}
          opportunityName={selectedInvestment.opportunities?.name}
          onClose={() => {
            setShowStatement(false);
            setSelectedInvestment(null);
          }}
        />
      )}

      {/* REDEMPTION MODAL */}
      {showRedemption && selectedInvestment && (
        <RedemptionModal
          investment={selectedInvestment}
          isWorking={isWorking}
          onClose={() => {
            setShowRedemption(false);
            setSelectedInvestment(null);
          }}
          onSubmit={handleRedemptionSubmit}
        />
      )}

      {/* REDEMPTION STATUS MODAL */}
      {showRedemptionStatus && selectedInvestment && (
        <RedemptionStatusModal
          investment={selectedInvestment}
          onClose={() => {
            setShowRedemptionStatus(false);
            setSelectedInvestment(null);
          }}
        />
      )}
    </div>
  );
}

export default InvestmentList;
