'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { confirmManualPaymentAction, failManualPaymentAction } from './payment-actions';
import {
  CheckCircle2,
  ShieldCheck,
  AlertCircle,
  Loader2,
  ExternalLink,
  XCircle,
  AlertTriangle,
} from 'lucide-react';

/**
 * UTILS
 */
const formatCurrency = (value, currency = 'USD') =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(Number(value || 0));

const formatDate = (dateString) => {
  if (!dateString) return '—';
  return new Date(dateString)
    .toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
    .toUpperCase();
};

/**
 * MAIN COMPONENT
 */
export default function PaymentViewModal({ payment, onClose }) {
  const router = useRouter();

  // State management
  const [currentStatus, setCurrentStatus] = useState(
    payment?.status?.toLowerCase() || 'pending'
  );
  const [adminActionTab, setAdminActionTab] = useState('confirm'); // 'confirm' or 'fail'
  
  // Confirmation state
  const [reference, setReference] = useState(
    payment?.metadata?.reference_number || payment?.metadata?.memo || ''
  );
  const [adminNote, setAdminNote] = useState(
    payment?.metadata?.admin_confirmation_note || ''
  );
  const [isConfirming, setIsConfirming] = useState(false);
  const [confirmError, setConfirmError] = useState(null);
  const [confirmSuccess, setConfirmSuccess] = useState(
    currentStatus === 'succeeded' &&
      Boolean(payment?.metadata?.manual_payment_confirmed)
  );

  // Failure state
  const [failureReason, setFailureReason] = useState(
    payment?.metadata?.failure_reason || ''
  );
  const [isFailing, setIsFailing] = useState(false);
  const [failError, setFailError] = useState(null);

  const [confirmedMeta, setConfirmedMeta] = useState(payment?.metadata || {});
  const [statusMessage, setStatusMessage] = useState(
    currentStatus === 'succeeded'
      ? 'Payment confirmed and investor records updated.'
      : currentStatus === 'failed'
        ? `Payment marked as failed: ${payment?.metadata?.failure_reason || 'Could not be reconciled'}`
        : ''
  );

  if (!payment) return null;

  const handleClose = () => {
    if (onClose) {
      onClose();
      return;
    }
    router.push('/admin/payments', { scroll: false });
  };

  const isSucceeded =
    currentStatus === 'succeeded' ||
    currentStatus === 'paid' ||
    currentStatus === 'completed' ||
    currentStatus === 'success';

  const isFailed =
    currentStatus === 'failed' ||
    currentStatus === 'canceled' ||
    currentStatus === 'cancelled';

  const statusStyles = isSucceeded
    ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
    : isFailed
      ? 'text-rose-700 bg-rose-50 border-rose-200'
      : 'text-amber-700 bg-amber-50 border-amber-200';

  const methodType = (
    payment.payment_method_type ||
    payment.metadata?.payment_method ||
    'manual'
  ).toLowerCase();

  const isManualMethod =
    ['zelle', 'cashapp', 'check', 'zelle_cashapp', 'manual', 'wire'].includes(
      methodType
    ) || !payment.stripe_payment_intent_id;

  const getMethodBadgeLabel = () => {
    if (methodType === 'cashapp') return 'Cash App ($Winam)';
    if (methodType === 'zelle') return 'Zelle Transfer';
    if (methodType === 'check') return 'Paper Check';
    if (methodType === 'zelle_cashapp') return 'Zelle / Cash App';
    if (payment.stripe_payment_intent_id) return 'Stripe / Card';
    return methodType.toUpperCase();
  };

  // 1. Confirm Payment Handler
  const handleConfirm = async (e) => {
    e.preventDefault();
    setIsConfirming(true);
    setConfirmError(null);

    try {
      const res = await confirmManualPaymentAction(payment.id, {
        reference: reference.trim(),
        note: adminNote.trim(),
      });

      if (res?.error) {
        setConfirmError(res.message || 'Failed to confirm payment.');
      } else {
        setCurrentStatus('succeeded');
        setConfirmSuccess(true);
        setStatusMessage(
          res?.message ||
            'Payment confirmed successfully. Status set to Succeeded and investor records credited.'
        );
        setConfirmedMeta((prev) => ({
          ...prev,
          reference_number: reference.trim(),
          admin_confirmation_note: adminNote.trim(),
          confirmed_at: new Date().toISOString(),
          manual_payment_confirmed: true,
        }));
        router.refresh();
      }
    } catch (err) {
      setConfirmError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsConfirming(false);
    }
  };

  // 2. Fail / Decline Payment Handler
  const handleFail = async (e) => {
    e.preventDefault();
    if (!failureReason.trim()) {
      setFailError('Please enter a reason why this payment cannot be reconciled.');
      return;
    }

    setIsFailing(true);
    setFailError(null);

    try {
      const res = await failManualPaymentAction(payment.id, {
        reason: failureReason.trim(),
      });

      if (res?.error) {
        setFailError(res.message || 'Failed to mark payment as failed.');
      } else {
        setCurrentStatus('failed');
        setStatusMessage(
          res?.message ||
            'Payment marked as failed. The shareholder will see this in their payment statements.'
        );
        setConfirmedMeta((prev) => ({
          ...prev,
          failure_reason: failureReason.trim(),
          failed_at: new Date().toISOString(),
        }));
        router.refresh();
      }
    } catch (err) {
      setFailError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsFailing(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4"
      onClick={handleClose}
    >
      <div
        className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 sm:zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Sticky */}
        <div className="bg-slate-50 px-4 sm:px-6 py-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight uppercase">
                Payment <span className="text-blue-600">Details</span>
              </h2>
              <p className="text-xs text-slate-500 font-mono mt-0.5 truncate max-w-[200px] sm:max-w-none">
                ID: {payment.id}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span
                className={`text-xs font-black uppercase tracking-widest border px-3 py-1 rounded-full ${statusStyles}`}
              >
                {currentStatus}
              </span>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-4 sm:p-6 space-y-6 overflow-y-auto flex-1 custom-scrollbar">
          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <InfoCard
              label="Amount"
              value={formatCurrency(payment.amount, payment.currency)}
              valueClass="text-emerald-600"
            />
            <InfoCard label="Currency" value={payment.currency || 'USD'} />
            <InfoCard
              label="Method"
              value={getMethodBadgeLabel()}
              valueClass="text-blue-700"
            />
            <InfoCard label="Created" value={formatDate(payment.created_at)} />
          </div>

          {/* ADMIN ACTION PANEL (When payment is pending / unreconciled) */}
          {!isSucceeded && !isFailed && (
            <div className="rounded-2xl border-2 border-slate-200 bg-slate-50/80 p-4 sm:p-5 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-slate-900 text-white rounded-xl shrink-0">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 tracking-tight uppercase">
                      Admin Action: <span className="text-blue-600">Payment Reconciliation</span>
                    </h3>
                    <p className="text-xs text-slate-500">
                      Method: <strong className="text-slate-800 uppercase">{getMethodBadgeLabel()}</strong>
                    </p>
                  </div>
                </div>

                {/* Tab Switcher: Confirm vs Fail */}
                <div className="flex bg-white p-1 rounded-xl border border-slate-200 w-fit text-xs font-bold shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setAdminActionTab('confirm');
                      setConfirmError(null);
                      setFailError(null);
                    }}
                    className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                      adminActionTab === 'confirm'
                        ? 'bg-emerald-600 text-white shadow-xs font-black'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Confirm</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAdminActionTab('fail');
                      setConfirmError(null);
                      setFailError(null);
                    }}
                    className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                      adminActionTab === 'fail'
                        ? 'bg-rose-600 text-white shadow-xs font-black'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Decline / Fail</span>
                  </button>
                </div>
              </div>

              {/* TAB 1: CONFIRM PAYMENT */}
              {adminActionTab === 'confirm' && (
                <div className="space-y-3 animate-in fade-in duration-200">
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Verify that funds have been received. Confirming will set status to{' '}
                    <strong className="text-emerald-700">succeeded</strong> and automatically credit the investor&apos;s portfolio.
                  </p>

                  {confirmError && (
                    <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{confirmError}</span>
                    </div>
                  )}

                  <form onSubmit={handleConfirm} className="space-y-3 pt-1">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-black uppercase tracking-widest text-slate-600 mb-1">
                          Reference / Check # / Cashtag
                        </label>
                        <input
                          type="text"
                          value={reference}
                          onChange={(e) => setReference(e.target.value)}
                          placeholder="e.g. Check #1042 or Zelle Ref"
                          className="w-full text-xs font-semibold px-3 py-2 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-900 placeholder:text-slate-400"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-black uppercase tracking-widest text-slate-600 mb-1">
                          Admin Verification Note (Optional)
                        </label>
                        <input
                          type="text"
                          value={adminNote}
                          onChange={(e) => setAdminNote(e.target.value)}
                          placeholder="e.g. Verified in Chase bank account"
                          className="w-full text-xs font-semibold px-3 py-2 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-900 placeholder:text-slate-400"
                        />
                      </div>
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={isConfirming}
                        className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider py-3 px-6 rounded-xl transition shadow-sm hover:shadow active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
                      >
                        {isConfirming ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Confirming & Updating Records...</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Confirm Payment & Credit Investor</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* TAB 2: FAIL / DECLINE UNRECONCILED PAYMENT */}
              {adminActionTab === 'fail' && (
                <div className="space-y-3 animate-in fade-in duration-200">
                  <div className="p-3 bg-rose-50/70 border border-rose-200 rounded-xl text-xs text-rose-800 leading-relaxed flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                    <div>
                      <strong className="block font-bold">Cannot reconcile this payment?</strong>
                      Marking this payment as failed will set its status to <strong className="text-rose-700 uppercase">failed</strong>. 
                      The shareholder will see this status and your failure explanation on their <strong>payment statement</strong>.
                    </div>
                  </div>

                  {failError && (
                    <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{failError}</span>
                    </div>
                  )}

                  <form onSubmit={handleFail} className="space-y-3 pt-1">
                    <div>
                      <label className="block text-xs font-black uppercase tracking-widest text-slate-600 mb-1">
                        Reason For Failure / Reconciliation Note <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={failureReason}
                        onChange={(e) => setFailureReason(e.target.value)}
                        placeholder="e.g. Funds not received in bank account, Check bounced, or Cashtag mismatch"
                        className="w-full text-xs font-semibold px-3 py-2.5 bg-white border border-rose-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 text-slate-900 placeholder:text-slate-400"
                      />
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={isFailing}
                        className="w-full sm:w-auto bg-rose-600 hover:bg-rose-700 text-white font-black text-xs uppercase tracking-wider py-3 px-6 rounded-xl transition shadow-sm hover:shadow active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
                      >
                        {isFailing ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Marking Payment as Failed...</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-4 h-4" />
                            <span>Mark as Failed (Cannot Reconcile)</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          )}

          {/* CONFIRMED NOTIFICATION (If payment was confirmed by admin or is already succeeded) */}
          {isSucceeded && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4 sm:p-5 flex items-start gap-3">
              <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl shrink-0 mt-0.5">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div className="space-y-1 text-xs">
                <div className="font-black text-emerald-900 uppercase tracking-tight">
                  Payment Verified & Succeeded
                </div>
                <p className="text-emerald-800 leading-relaxed">
                  {statusMessage ||
                    'This transaction is verified and investor records have been credited.'}
                </p>
                {(confirmedMeta.reference_number ||
                  confirmedMeta.confirmed_at ||
                  confirmedMeta.admin_confirmation_note) && (
                  <div className="mt-2 pt-2 border-t border-emerald-200/60 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-emerald-900">
                    {confirmedMeta.reference_number && (
                      <div>
                        <strong className="uppercase text-xs tracking-wider text-emerald-700 block">
                          Reference / Check:
                        </strong>
                        <span className="font-mono font-bold">
                          {confirmedMeta.reference_number}
                        </span>
                      </div>
                    )}
                    {confirmedMeta.confirmed_at && (
                      <div>
                        <strong className="uppercase text-xs tracking-wider text-emerald-700 block">
                          Confirmed At:
                        </strong>
                        <span>{formatDate(confirmedMeta.confirmed_at)}</span>
                      </div>
                    )}
                    {confirmedMeta.admin_confirmation_note && (
                      <div className="sm:col-span-2">
                        <strong className="uppercase text-xs tracking-wider text-emerald-700 block">
                          Admin Note:
                        </strong>
                        <span>{confirmedMeta.admin_confirmation_note}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* FAILED NOTIFICATION (If payment was failed by admin) */}
          {isFailed && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50/80 p-4 sm:p-5 flex items-start gap-3">
              <div className="p-2 bg-rose-100 text-rose-800 rounded-xl shrink-0 mt-0.5">
                <XCircle className="w-5 h-5" />
              </div>
              <div className="space-y-1 text-xs">
                <div className="font-black text-rose-900 uppercase tracking-tight">
                  Payment Failed / Unreconciled
                </div>
                <p className="text-rose-800 leading-relaxed">
                  This payment was not reconciled and has been marked as failed.
                </p>
                <div className="mt-2 pt-2 border-t border-rose-200/60 space-y-1.5 text-xs text-rose-900">
                  <div>
                    <strong className="uppercase text-xs tracking-wider text-rose-700 block">
                      Failure Reason:
                    </strong>
                    <span className="font-medium bg-white px-2 py-1 rounded border border-rose-200 block mt-0.5">
                      {confirmedMeta.failure_reason || payment.metadata?.failure_reason || 'Could not be reconciled by administrator'}
                    </span>
                  </div>
                  {(confirmedMeta.failed_at || payment.metadata?.failed_at || payment.updated_at) && (
                    <div>
                      <strong className="uppercase text-xs tracking-wider text-rose-700 block">
                        Marked Failed On:
                      </strong>
                      <span>{formatDate(confirmedMeta.failed_at || payment.metadata?.failed_at || payment.updated_at)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Shareholder Info */}
          <Section title="Shareholder">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8 text-sm bg-slate-50/60 p-4 rounded-xl border border-slate-100">
              <DetailRow label="Name" value={payment.shareholders?.fullName} />
              <DetailRow label="Email" value={payment.shareholders?.email} />
              <DetailRow
                label="Telephone"
                value={payment.shareholders?.telephone}
              />
              <DetailRow
                label="Shareholder ID"
                value={payment.shareholder_id ? `#${payment.shareholder_id}` : '—'}
                mono
              />
            </div>
          </Section>

          {/* Opportunity Info */}
          <Section title="Investment Opportunity">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8 text-sm bg-slate-50/60 p-4 rounded-xl border border-slate-100">
              <DetailRow
                label="Opportunity"
                value={payment.opportunities?.name || `Opportunity #${payment.opportunity_id || 'N/A'}`}
              />
              <DetailRow
                label="Type"
                value={payment.opportunities?.type || payment.type}
              />
              <DetailRow
                label="Status"
                value={payment.opportunities?.status || 'Active'}
              />
              <DetailRow
                label="Min. Investment"
                value={
                  payment.opportunities?.minimum_investment
                    ? formatCurrency(payment.opportunities.minimum_investment)
                    : '—'
                }
              />
            </div>
          </Section>

          {/* Manual Payment or Stripe Details */}
          {isManualMethod ? (
            <Section title="Manual Payment Information">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8 text-sm bg-slate-50/60 p-4 rounded-xl border border-slate-100">
                <DetailRow
                  label="Payment Channel"
                  value={getMethodBadgeLabel()}
                />
                <DetailRow label="Transaction Type" value={payment.type} />
                <DetailRow
                  label="Shareholder Memo"
                  value={
                    payment.metadata?.memo ||
                    payment.description ||
                    'No memo provided'
                  }
                />
                <DetailRow
                  label="Designated Payee"
                  value={payment.metadata?.payee || 'Winam Development Group'}
                />
              </div>
            </Section>
          ) : (
            <Section title="Stripe Information">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8 text-sm bg-slate-50/60 p-4 rounded-xl border border-slate-100">
                <DetailRow
                  label="Payment Intent"
                  value={payment.stripe_payment_intent_id}
                  mono
                />
                <DetailRow
                  label="Session ID"
                  value={payment.stripe_session_id}
                  mono
                />
                <DetailRow
                  label="Charge ID"
                  value={payment.stripe_charge_id}
                  mono
                />
                <DetailRow
                  label="Customer ID"
                  value={payment.stripe_customer_id}
                  mono
                />
                <DetailRow label="Method" value={payment.payment_method_type} />
                <DetailRow label="Type" value={payment.type} />
              </div>
            </Section>
          )}

          {/* Description */}
          {payment.description && (
            <Section title="Payment Description">
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 sm:p-4">
                <p className="text-sm text-slate-700 leading-relaxed uppercase">
                  {payment.description}
                </p>
              </div>
            </Section>
          )}

          {/* Metadata Block */}
          {payment.metadata && (
            <Section title="Technical Metadata">
              <div className="bg-slate-950 rounded-xl p-4 overflow-x-auto max-h-48">
                <pre className="text-xs text-slate-200 whitespace-pre font-mono">
                  {JSON.stringify(
                    { ...payment.metadata, ...confirmedMeta },
                    null,
                    2
                  )}
                </pre>
              </div>
            </Section>
          )}

          {/* Receipt Link */}
          {payment.receipt_url && (
            <a
              href={payment.receipt_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center sm:justify-start gap-2 p-3 rounded-xl border border-blue-100 bg-blue-50 text-xs font-bold text-blue-600 hover:text-blue-700 transition uppercase tracking-tight"
            >
              <span>View Official Stripe Receipt</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 shrink-0 flex items-center justify-between gap-3">
          <button
            onClick={handleClose}
            className="w-full bg-white border border-slate-200 py-3 rounded-xl font-black uppercase tracking-widest text-xs text-slate-700 hover:bg-slate-100 active:scale-[0.99] transition shadow-sm cursor-pointer"
          >
            Close Window
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * SUB-COMPONENTS
 */

function Section({ title, children }) {
  return (
    <div className="space-y-2">
      <div className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
        {title}
      </div>
      {children}
    </div>
  );
}

function InfoCard({
  label,
  value,
  valueClass = 'text-slate-900',
  className = '',
}) {
  return (
    <div
      className={`border border-slate-100 rounded-xl p-3 bg-slate-50/50 ${className}`}
    >
      <div className="text-xs uppercase font-black tracking-widest text-slate-400 mb-1">
        {label}
      </div>
      <div
        className={`text-xs sm:text-sm font-black truncate uppercase ${valueClass}`}
      >
        {value || '—'}
      </div>
    </div>
  );
}

function DetailRow({ label, value, mono = false }) {
  const displayValue = typeof value === 'string' ? value.toUpperCase() : value;

  return (
    <div className="flex flex-col gap-0.5 min-w-0">
      <span className="text-xs uppercase font-black tracking-widest text-slate-400">
        {label}
      </span>
      <span
        className={`text-slate-800 break-all sm:break-words uppercase ${
          mono ? 'font-mono text-xs' : 'text-sm font-bold'
        }`}
      >
        {displayValue || '—'}
      </span>
    </div>
  );
}
