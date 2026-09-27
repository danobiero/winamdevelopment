'use client';

import SubmitButton from '@/app/_components/SubmitButton';
import { useState } from 'react';
import AdditionalPaymentFormAdmin from '../_components/AdditionalPaymentFormAdmin';
import MessageModal from '../../../_components/MessageModal';
import RedemptionRequestFormAdmin from '../_components/RedemptionRequestFormAdmin';
import { adminUpdateInvestment } from '../actions';

// Reusable currency formatter instance
const currencyFormatter = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export default function EditInvestmentFormClient({
  investment,
  opportunity,
  context,
  adminId,
}) {
  const { id: investmentId, amount_invested, status, notes } = investment;

  const opportunityName = opportunity?.name || 'N/A';
  const totalValue = opportunity?.total_value
    ? Number(opportunity.total_value)
    : 0;

  const [amount, setAmount] = useState(amount_invested ?? 0);
  // Track the raw string display value for the masked input field
  const [displayAmount, setDisplayAmount] = useState(
    currencyFormatter.format(amount_invested ?? 0)
  );
  const [obsText, setObsText] = useState(notes || '');

  const [redemptionAmount, setRedemptionAmount] = useState(0);
  const [paymentAmount, setPaymentAmount] = useState(0);

  const [showRedemptionForm, setShowRedemptionForm] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);

  const [isProcessing, setIsProcessing] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [modalType, setModalType] = useState('info');

  // Strip formatting to allow pure numeric inputs
  const handleInputChange = (e) => {
    const rawValue = e.target.value.replace(/[^0-9.]/g, '');
    setDisplayAmount(e.target.value); // Keep user input fluid while typing
    setAmount(Number(rawValue) || 0); // Update the real database numerical state
  };

  // When the admin clicks inside the input, show just the raw number for easy editing
  const handleInputFocus = () => {
    setDisplayAmount(amount === 0 ? '' : amount.toString());
  };

  // When the admin clicks away, transform it back into X,XXX,XXX.XX format
  const handleInputBlur = () => {
    setDisplayAmount(currencyFormatter.format(amount));
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setIsProcessing(true);

    try {
      if (amount === amount_invested) {
        await adminUpdateInvestment({
          investmentId,
          amount_invested,
          status,
          notes: obsText,
        });
        setModalType('success');
        setModalMessage('Shareholder investment record updated successfully.');
      } else if (amount > amount_invested) {
        const diff = amount - amount_invested;
        setPaymentAmount(diff);

        if (status === 'active' || status === 'paid') {
          setShowPaymentForm(true);
        } else {
          await adminUpdateInvestment({
            investmentId,
            amount_invested: amount,
            status,
            notes: obsText,
          });
          setModalType('success');
          setModalMessage(
            'Investment updated successfully (unpaid — pending capital call allocation).'
          );
        }
      } else {
        const redemptionValue = amount_invested - amount;
        setRedemptionAmount(redemptionValue);

        if (status === 'active' || status === 'paid') {
          setShowRedemptionForm(true);
        } else {
          await adminUpdateInvestment({
            investmentId,
            amount_invested: amount,
            status,
            notes: obsText,
          });
          setModalType('success');
          setModalMessage('Shareholder allocation updated successfully.');
        }
      }
    } catch (err) {
      console.error(err);
      setModalType('error');
      setModalMessage('Error processing investment modifications.');
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <div className="w-full">
      <h2 className="text-xl sm:text-2xl font-semibold text-blue-950 mb-4 sm:mb-6">
        Edit Shareholder Investment #{investmentId}
      </h2>

      <form
        onSubmit={handleSubmit}
        className="bg-primary-500 py-6 sm:py-10 px-4 sm:px-8 md:px-16 flex flex-col gap-6 rounded-lg text-white"
      >
        {/* Asset Context Banner */}
        <div className="bg-primary-600/30 p-4 rounded-lg flex flex-col sm:flex-row justify-between gap-2 text-sm">
          <div>
            <span className="opacity-70 block text-xs uppercase font-medium">
            Opportunity
            </span>
            <span className="font-semibold text-base">{opportunityName}</span>
          </div>
          <div className="sm:text-right">
            <span className="opacity-70 block text-xs uppercase font-medium">
              Total Project Value
            </span>
            <span className="font-semibold text-base">
              ${currencyFormatter.format(totalValue)}
            </span>
          </div>
        </div>

        {/* Formatted Amount Allocation Input */}
        <div className="flex flex-col gap-2">
          <label className="font-medium text-sm sm:text-base">
            Total Shareholder Capital Invested ($)
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary-800 font-semibold">
              $
            </span>
            <input
              type="text"
              value={displayAmount}
              onChange={handleInputChange}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
              className="pl-8 pr-4 py-3 bg-primary-200 text-primary-800 w-full rounded-md outline-none focus:ring-2 focus:ring-primary-300 font-bold"
              placeholder="0.00"
            />
          </div>
        </div>

        {/* Compliance Notes / Audits */}
        <div className="flex flex-col gap-2">
          <label className="font-medium text-sm sm:text-base">
            Shareholder Notes / Internal Logs
          </label>
          <textarea
            value={obsText}
            rows={3}
            onChange={(e) => setObsText(e.target.value)}
            className="px-4 py-3 bg-primary-200 text-primary-800 w-full rounded-md outline-none focus:ring-2 focus:ring-primary-300 text-sm"
            placeholder="Enter tracking details, board approvals, or internal notes..."
          />
        </div>

        {/* Pricing Delta Summary Footer */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 pt-4 border-t border-primary-400">
          <div className="w-full sm:w-auto bg-primary-600/30 p-3 rounded-lg sm:bg-transparent sm:p-0 text-sm">
            <p className="opacity-80">
              Previous Capital:{' '}
              <span className="font-semibold">
                ${currencyFormatter.format(amount_invested || 0)}
              </span>
            </p>
            <p className="font-medium">
              Adjusted Capital:{' '}
              <span className="font-bold text-base text-amber-200">
                ${currencyFormatter.format(amount || 0)}
              </span>
            </p>
          </div>

          <div className="w-full sm:w-auto">
            <SubmitButton
              pendingLabel="Saving Structure..."
              disabled={isProcessing || showRedemptionForm || showPaymentForm}
              className="w-full sm:w-auto"
            >
              Update Investment Allocation
            </SubmitButton>
          </div>
        </div>
      </form>

      {/* Triggered Modal on Capital Decreases */}
      {showRedemptionForm && (
        <RedemptionRequestFormAdmin
          investmentId={investmentId}
          redemptionAmount={redemptionAmount}
          oldTotal={amount_invested}
          newTotal={amount}
          notes={obsText}
          onClose={(wasSubmitted) => {
            setShowRedemptionForm(false);
            if (wasSubmitted) {
              setModalType('success');
              setModalMessage('Shareholder redemption request registered.');
            }
          }}
        />
      )}

      {/* Triggered Modal on Capital Increases */}
      {showPaymentForm && (
        <AdditionalPaymentFormAdmin
          investmentId={investmentId}
          paymentAmount={paymentAmount}
          oldTotal={amount_invested}
          newTotal={amount}
          notes={obsText}
          onClose={(wasSubmitted) => {
            setShowPaymentForm(false);
            if (wasSubmitted) {
              setModalType('success');
              setModalMessage('Additional capital investment link initiated.');
            }
          }}
        />
      )}

      {modalMessage && (
        <MessageModal
          message={modalMessage}
          type={modalType}
          onClose={() => setModalMessage('')}
        />
      )}
    </div>
  );
}
