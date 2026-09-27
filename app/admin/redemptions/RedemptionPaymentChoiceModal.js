'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { FormatCurrency } from '../../_lib/utils';

export default function RedemptionPaymentChoiceModal({
  redemption,
  ledger = [],
  createAction,
  manualAction,
}) {
  const router = useRouter();

  // Guard Clause
  if (!redemption) return null;

  const requestedTotal = Number(redemption.amount ?? 0);
  const alreadyRedeemed = Number(redemption.already_redeemed_so_far ?? 0);
  const remainingGoal = Math.max(0, requestedTotal - alreadyRedeemed);
  const currency = redemption.currency || 'USD';
  const payments = redemption.payments || [];
  const paymentMethod = redemption.payment_method || null;

  const opportunityId = redemption.investments?.opportunity_id;

  // 1. Total Paid: Sum of payments for THIS opportunity and THIS shareholder
  const totalPaid = useMemo(
    () =>
      payments
        .filter(
          (p) =>
            p.opportunity_id === opportunityId &&
            p.shareholder_id === redemption.shareholder_id
        )
        .reduce((sum, p) => sum + Number(p.amount || 0), 0),
    [payments, redemption, opportunityId]
  );

  // 2. Ledger Balance: Final running balance
  const ledgerBalance = useMemo(() => {
    if (ledger.length > 0) {
      return Number(ledger[ledger.length - 1]?.running_balance ?? 0);
    }
    return Number(redemption.investments?.amount_invested ?? requestedTotal);
  }, [ledger, redemption, requestedTotal]);

  // 3. Filter Payments for Stripe vs Offline
  const sortedStripePayments = useMemo(() => {
    if (!payments) return [];
    return [...payments]
      .filter((pay) => {
        const isMatch =
          pay.opportunity_id === opportunityId &&
          pay.shareholder_id === redemption.shareholder_id;
        const hasStripe = Boolean(pay.stripe_payment_intent_id);
        const available =
          Number(pay.amount || 0) - Number(pay.redeemed_amount || 0);
        return isMatch && hasStripe && available > 0;
      })
      .sort((a, b) => {
        const availA = Number(a.amount || 0) - Number(a.redeemed_amount || 0);
        const availB = Number(b.amount || 0) - Number(b.redeemed_amount || 0);
        return availB - availA;
      });
  }, [payments, redemption, opportunityId]);

  const sortedOfflinePayments = useMemo(() => {
    if (!payments) return [];
    return [...payments]
      .filter((pay) => {
        const isMatch =
          pay.opportunity_id === opportunityId &&
          pay.shareholder_id === redemption.shareholder_id;
        const available =
          Number(pay.amount || 0) - Number(pay.redeemed_amount || 0);
        return isMatch && available > 0;
      })
      .sort((a, b) => {
        const availA = Number(a.amount || 0) - Number(a.redeemed_amount || 0);
        const availB = Number(b.amount || 0) - Number(b.redeemed_amount || 0);
        return availB - availA;
      });
  }, [payments, redemption, opportunityId]);

  // Detect default payout rail from shareholder profile or fallback
  const defaultRail = useMemo(() => {
    const rawType = (paymentMethod?.payment_type || '').toLowerCase();
    if (['cashapp', 'zelle', 'wire', 'check', 'legacy'].includes(rawType)) {
      return rawType;
    }
    if (rawType === 'bank') return 'wire';
    return 'cashapp';
  }, [paymentMethod]);

  // Tabs: 'manual' (CashApp, Zelle, Wire, Check, Legacy) vs 'stripe'
  const [activeTab, setActiveTab] = useState(
    sortedStripePayments.length > 0 && !paymentMethod ? 'stripe' : 'manual'
  );

  // Manual Form States
  const [payoutRail, setPayoutRail] = useState(defaultRail);
  const [recipientHandle, setRecipientHandle] = useState(
    paymentMethod?.account_handle ||
      paymentMethod?.account_number ||
      redemption.shareholders?.telephone ||
      redemption.shareholders?.email ||
      ''
  );
  const [recipientName, setRecipientName] = useState(
    paymentMethod?.account_name || redemption.shareholders?.fullName || ''
  );
  const [referenceNumber, setReferenceNumber] = useState('');
  const [manualAmount, setManualAmount] = useState(
    remainingGoal > 0 ? remainingGoal.toString() : '0'
  );
  const [manualNotes, setManualNotes] = useState('');
  const [selectedOfflinePaymentId, setSelectedOfflinePaymentId] = useState('');

  // Stripe Form States
  const [selectedStripeId, setSelectedStripeId] = useState(
    sortedStripePayments[0]?.id || null
  );

  const selectedStripePayment = useMemo(
    () => payments.find((p) => p.id === selectedStripeId),
    [payments, selectedStripeId]
  );
  const stripePaymentCapacity = selectedStripePayment
    ? Number(selectedStripePayment.amount - (selectedStripePayment.redeemed_amount || 0))
    : 0;

  const stripeRefundableNow = Math.max(
    0,
    Math.min(remainingGoal, stripePaymentCapacity, ledgerBalance > 0 ? ledgerBalance : remainingGoal)
  );

  const [successData, setSuccessData] = useState(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState(null);

  // Handle Manual Form Submit
  const handleManualSubmit = (e) => {
    e.preventDefault();
    setError(null);

    const numAmount = Number(manualAmount);
    if (numAmount <= 0) {
      setError('Please specify a valid redemption amount greater than $0.');
      return;
    }
    if (numAmount > remainingGoal) {
      setError(`Amount cannot exceed the remaining requested balance of ${FormatCurrency(remainingGoal, currency)}.`);
      return;
    }

    const formData = new FormData();
    formData.set('redemptionId', redemption.id.toString());
    formData.set('payoutMethod', payoutRail);
    formData.set('recipientHandle', recipientHandle);
    formData.set('recipientName', recipientName);
    formData.set('referenceNumber', referenceNumber);
    formData.set('redemptionAmount', numAmount.toString());
    if (selectedOfflinePaymentId) {
      formData.set('paymentId', selectedOfflinePaymentId);
    }
    formData.set('adminNotes', manualNotes);

    startTransition(async () => {
      try {
        if (!manualAction) {
          setError('Manual redemption action is not configured.');
          return;
        }
        const result = await manualAction(formData);
        if (result?.success) {
          setSuccessData({
            ...result,
            isManual: true,
            payoutRail,
            referenceNumber,
          });
        } else {
          setError(result?.error || 'Manual redemption payout recording failed.');
        }
      } catch (err) {
        setError(err.message || 'A system error occurred.');
      }
    });
  };

  // Handle Stripe Form Submit
  const handleStripeSubmit = (e) => {
    e.preventDefault();
    setError(null);
    if (!selectedStripeId || stripeRefundableNow <= 0) {
      setError('No eligible Stripe payment selected or refund balance is zero.');
      return;
    }

    const formData = new FormData();
    formData.set('redemptionId', redemption.id.toString());
    formData.set('paymentId', selectedStripeId);
    formData.set('redemptionAmount', stripeRefundableNow.toString());

    startTransition(async () => {
      try {
        if (!createAction) {
          setError('Stripe refund action is not configured.');
          return;
        }
        const result = await createAction(formData);
        if (result?.success) {
          setSuccessData({
            ...result,
            isManual: false,
            payoutRail: 'Stripe',
          });
        } else {
          setError(result?.error || 'Stripe redemption refund failed.');
        }
      } catch (err) {
        setError(err.message || 'A system error occurred.');
      }
    });
  };

  const closeAndClear = () => {
    router.refresh();
    router.push('/admin/redemptions');
  };

  // SUCCESS VIEW
  if (successData) {
    return (
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-3xl p-8 text-center shadow-2xl w-full max-w-md animate-in fade-in zoom-in duration-200">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-5 text-2xl font-black shadow-inner">
            ✓
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-1">
            Redemption Processed!
          </h2>
          <p className="text-slate-500 text-xs mb-6">
            The payout has been recorded in the shareholder ledger and opportunity valuation has been adjusted.
          </p>

          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-left space-y-2 mb-6 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">Amount Paid:</span>
              <span className="font-bold text-slate-900">
                {FormatCurrency(successData.redeemedAmount, currency)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">Payout Rail:</span>
              <span className="font-bold uppercase text-blue-600">
                {successData.payoutRail || (successData.isManual ? 'Direct Rail' : 'Stripe')}
              </span>
            </div>
            {successData.referenceNumber && (
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Reference #:</span>
                <span className="font-mono font-bold text-slate-800">
                  {successData.referenceNumber}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">Request Status:</span>
              <span
                className={`font-bold uppercase px-2 py-0.5 rounded text-[10px] ${
                  successData.isFullyDone
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-amber-100 text-amber-700'
                }`}
              >
                {successData.isFullyDone ? 'Completed' : 'Approved (Partial)'}
              </span>
            </div>
          </div>

          <button
            onClick={closeAndClear}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3.5 rounded-xl font-bold uppercase tracking-wider text-xs transition-all shadow-md active:scale-95"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={closeAndClear}
    >
      <div
        className="bg-white rounded-3xl w-full max-w-2xl flex flex-col overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* MODAL HEADER */}
        <div className="px-6 sm:px-8 py-5 border-b flex justify-between items-center bg-slate-50/70">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                Process Redemption Payout
              </h2>
              <span className="text-[10px] font-mono bg-blue-50 text-blue-700 border border-blue-200 font-bold px-2 py-0.5 rounded-full">
                #{String(redemption.id).slice(0, 8)}
              </span>
            </div>
            <p className="text-slate-500 text-xs mt-0.5">
              Pay out shareholder capital via Direct Rail (CashApp, Zelle, Wire, Check) or Stripe
            </p>
          </div>
          <button
            type="button"
            onClick={closeAndClear}
            className="text-slate-400 hover:text-slate-600 text-xl font-bold p-1 rounded-lg hover:bg-slate-100"
          >
            ✕
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="p-6 sm:p-8 space-y-6 overflow-y-auto max-h-[75vh]">
          {/* STATS OVERVIEW */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard
              label="Requested"
              value={FormatCurrency(requestedTotal, currency)}
              color="text-slate-900"
            />
            <StatCard
              label="Already Paid"
              value={FormatCurrency(alreadyRedeemed, currency)}
              color="text-emerald-600"
            />
            <StatCard
              label="Remaining"
              value={FormatCurrency(remainingGoal, currency)}
              color="text-rose-600"
            />
            <StatCard
              label="Ledger Balance"
              value={FormatCurrency(ledgerBalance, currency)}
              color="text-blue-600"
            />
          </div>

          {/* SHAREHOLDER & OPPORTUNITY REFERENCE */}
          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-medium">Shareholder:</span>
              <span className="font-bold text-slate-900 text-sm">
                {redemption.shareholders?.fullName || 'Unknown Shareholder'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-medium">Opportunity:</span>
              <span className="font-bold text-slate-800 truncate max-w-[280px]">
                {redemption.investments?.opportunities?.name || 'Investment Opportunity'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-medium">Contact:</span>
              <span className="text-slate-600 font-mono">
                {redemption.shareholders?.email || redemption.shareholders?.telephone || 'N/A'}
              </span>
            </div>
          </div>

          {/* SHAREHOLDER PAYMENT METHOD ON FILE BANNER */}
          {paymentMethod ? (
            <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Shareholder Registered Payout Destination
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-emerald-200 text-emerald-900">
                  {paymentMethod.payment_type}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-700">
                {paymentMethod.account_handle && (
                  <div>
                    <span className="text-slate-500 text-[10px] uppercase font-bold block">
                      Handle / Tag / Phone:
                    </span>
                    <span className="font-mono font-bold text-emerald-950">
                      {paymentMethod.account_handle}
                    </span>
                  </div>
                )}
                {paymentMethod.account_name && (
                  <div>
                    <span className="text-slate-500 text-[10px] uppercase font-bold block">
                      Account / Beneficiary Name:
                    </span>
                    <span className="font-bold text-emerald-950">
                      {paymentMethod.account_name}
                    </span>
                  </div>
                )}
                {paymentMethod.account_number && (
                  <div>
                    <span className="text-slate-500 text-[10px] uppercase font-bold block">
                      Account Number / Routing:
                    </span>
                    <span className="font-mono text-emerald-950">
                      {paymentMethod.account_number}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 text-xs text-amber-800 flex items-start gap-3">
              <span className="text-base">ℹ️</span>
              <div>
                <p className="font-bold mb-0.5">No Registered Payout Method on File</p>
                <p className="text-amber-700 text-[11px]">
                  Shareholder has not saved their Zelle/CashApp in their profile. You can manually enter the destination rail and transaction reference below.
                </p>
              </div>
            </div>
          )}

          {/* TAB SELECTOR: MANUAL / DIRECT RAIL vs STRIPE */}
          <div>
            <div className="flex border-b border-slate-200 gap-6">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('manual');
                  setError(null);
                }}
                className={`pb-3 text-xs sm:text-sm font-bold uppercase tracking-wider transition-all border-b-2 ${
                  activeTab === 'manual'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                Direct Payout (CashApp, Zelle, Wire, Check)
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('stripe');
                  setError(null);
                }}
                className={`pb-3 text-xs sm:text-sm font-bold uppercase tracking-wider transition-all border-b-2 ${
                  activeTab === 'stripe'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                Stripe Card Refund{' '}
                <span className="text-[10px] font-normal lowercase">
                  ({sortedStripePayments.length} card source{sortedStripePayments.length === 1 ? '' : 's'})
                </span>
              </button>
            </div>
          </div>

          {/* ERROR DISPLAY */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-semibold flex items-center gap-2">
              <span>⚠</span>
              <span>{error}</span>
            </div>
          )}

          {/* TAB CONTENT 1: DIRECT / MANUAL PAYOUT (CASHAPP, ZELLE, WIRE, CHECK, LEGACY) */}
          {activeTab === 'manual' && (
            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">
                  Select Payout Rail *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {[
                    { id: 'cashapp', label: 'CashApp', icon: '🟢' },
                    { id: 'zelle', label: 'Zelle', icon: '🟣' },
                    { id: 'wire', label: 'Bank Wire', icon: '🏦' },
                    { id: 'check', label: 'Paper Check', icon: '📄' },
                    { id: 'legacy', label: 'Legacy / Cash', icon: '💼' },
                  ].map((rail) => (
                    <button
                      key={rail.id}
                      type="button"
                      onClick={() => setPayoutRail(rail.id)}
                      className={`p-2.5 rounded-xl border-2 text-center text-xs font-bold transition-all ${
                        payoutRail === rail.id
                          ? 'border-blue-600 bg-blue-50 text-blue-900 shadow-sm'
                          : 'border-slate-100 hover:border-slate-300 text-slate-600'
                      }`}
                    >
                      <div className="text-base mb-0.5">{rail.icon}</div>
                      <div>{rail.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">
                    Recipient Handle / Phone / Account
                  </label>
                  <input
                    type="text"
                    value={recipientHandle}
                    onChange={(e) => setRecipientHandle(e.target.value)}
                    placeholder={
                      payoutRail === 'cashapp'
                        ? '$cashtag'
                        : payoutRail === 'zelle'
                        ? 'phone or email'
                        : 'account number'
                    }
                    className="w-full border border-slate-200 rounded-xl p-3 text-xs focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">
                    Recipient Full Name
                  </label>
                  <input
                    type="text"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    placeholder="Full legal name"
                    className="w-full border border-slate-200 rounded-xl p-3 text-xs focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">
                    Transaction Confirmation / Reference # *
                  </label>
                  <input
                    type="text"
                    required
                    value={referenceNumber}
                    onChange={(e) => setReferenceNumber(e.target.value)}
                    placeholder="e.g. Zelle Conf #, CashApp ID, Check #, Wire Ref"
                    className="w-full border border-slate-200 rounded-xl p-3 text-xs focus:ring-2 focus:ring-blue-500 outline-none font-mono font-medium"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">
                    Payout Amount ($ USD) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={remainingGoal}
                    required
                    value={manualAmount}
                    onChange={(e) => setManualAmount(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl p-3 text-xs focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-900"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Max remaining: {FormatCurrency(remainingGoal, currency)}
                  </span>
                </div>
              </div>

              {/* OPTIONAL: LINK TO EXISTING PAYMENT RECORD */}
              {sortedOfflinePayments.length > 0 && (
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">
                    Link to Payment Record (Optional)
                  </label>
                  <select
                    value={selectedOfflinePaymentId}
                    onChange={(e) => setSelectedOfflinePaymentId(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="">Direct / Legacy Capital (No specific payment record debit)</option>
                    {sortedOfflinePayments.map((p) => {
                      const avail = Number(p.amount || 0) - Number(p.redeemed_amount || 0);
                      return (
                        <option key={p.id} value={p.id}>
                          Payment #{String(p.id).slice(0, 8)} - {FormatCurrency(p.amount, p.currency)} ({p.payment_method_type || 'offline'}) - Avail: {FormatCurrency(avail, p.currency)}
                        </option>
                      );
                    })}
                  </select>
                </div>
              )}

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">
                  Admin Notes / Memo (Optional)
                </label>
                <textarea
                  rows={2}
                  value={manualNotes}
                  onChange={(e) => setManualNotes(e.target.value)}
                  placeholder="e.g. Sent via CashApp, verified by Admin on call"
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isPending || Number(manualAmount) <= 0}
                  className="w-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white py-4 rounded-xl font-black uppercase tracking-widest text-xs transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
                >
                  {isPending ? (
                    'Recording Payout...'
                  ) : (
                    <>
                      <span>Confirm & Record Payout of</span>
                      <span className="text-emerald-400">
                        {FormatCurrency(Number(manualAmount || 0), currency)}
                      </span>
                      <span className="uppercase text-slate-300">
                        via {payoutRail}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* TAB CONTENT 2: STRIPE AUTOMATED REFUND */}
          {activeTab === 'stripe' && (
            <form onSubmit={handleStripeSubmit} className="space-y-4">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
                  Select Eligible Stripe Payment Source
                </p>

                {sortedStripePayments.length === 0 ? (
                  <div className="text-center p-6 border-2 border-dashed border-slate-200 rounded-2xl text-slate-500 text-xs space-y-2">
                    <p className="font-bold text-slate-700">
                      No Eligible Stripe Charges Found
                    </p>
                    <p className="text-slate-400 max-w-sm mx-auto">
                      This shareholder funded via CashApp, Zelle, Bank Wire, Paper Check, or Legacy shares. Please use the <strong>Direct Payout</strong> tab to record their redemption payout.
                    </p>
                    <button
                      type="button"
                      onClick={() => setActiveTab('manual')}
                      className="mt-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg font-bold text-xs hover:bg-blue-100 transition-colors"
                    >
                      Switch to Direct Payout (CashApp/Zelle/Legacy)
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-56 overflow-y-auto">
                    {sortedStripePayments.map((pay) => {
                      const avail = Number(pay.amount || 0) - Number(pay.redeemed_amount || 0);
                      const isSelected = selectedStripeId === pay.id;
                      return (
                        <button
                          key={pay.id}
                          type="button"
                          onClick={() => setSelectedStripeId(pay.id)}
                          className={`w-full p-4 border-2 rounded-xl text-left transition-all ${
                            isSelected
                              ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-600/20'
                              : 'border-slate-100 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex justify-between items-center font-bold text-xs">
                            <span className="text-slate-900">
                              {FormatCurrency(pay.amount, pay.currency || currency)}
                            </span>
                            <span
                              className="text-[10px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 truncate max-w-[220px]"
                              title={pay.stripe_payment_intent_id || pay.id}
                            >
                              {pay.stripe_payment_intent_id || pay.id}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 mt-1 flex justify-between">
                            <span>Available to Refund: {FormatCurrency(avail, pay.currency || currency)}</span>
                            <span>{new Date(pay.created_at).toLocaleDateString()}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {sortedStripePayments.length > 0 && (
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={!selectedStripeId || stripeRefundableNow <= 0 || isPending}
                    className="w-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white py-4 rounded-xl font-black uppercase tracking-widest text-xs transition-all shadow-md active:scale-95"
                  >
                    {isPending
                      ? 'Executing Stripe Refund...'
                      : `Execute Stripe Refund of ${FormatCurrency(stripeRefundableNow, currency)}`}
                  </button>
                </div>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, color = 'text-slate-900' }) {
  return (
    <div className="bg-slate-50/80 border border-slate-100 rounded-2xl p-3.5 text-center">
      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 truncate">
        {label}
      </div>
      <div className={`text-base sm:text-lg font-black ${color}`}>{value}</div>
    </div>
  );
}
