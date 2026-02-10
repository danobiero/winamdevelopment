'use client';

import SubmitButton from '@/app/_components/SubmitButton';
import { useEffect, useState } from 'react';
import AdditionalPaymentFormAdmin from '../../../_components/AditionalPaymentFormAdmin';
import MessageModal from '../../../_components/MessageModal';
import RefundRequestFormAdmin from '../../../_components/RefundRequestFormAdmin';
import TotalPriceCalculator from '../../../_components/TotalPriceCalculator';
import { adminUpdateBooking } from '../actions';

export default function EditBookingFormClient({
  booking,
  lesson,
  maxSelectableStudents,
  adminId,
}) {
  const {
    id: bookingId,
    numStudents,
    observations,
    totalPrice,
    status,
  } = booking;

  const { regularPrice, discount } = lesson;

  const [obsText, setObsText] = useState(observations || '');
  const [selectedStudents, setSelectedStudents] = useState(numStudents ?? 1);
  const [newTotal, setNewTotal] = useState(totalPrice);
  const [refundAmount, setRefundAmount] = useState(0);
  const [paymentAmount, setPaymentAmount] = useState(0);

  const [showRefundForm, setShowRefundForm] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);

  const [isProcessing, setIsProcessing] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [modalType, setModalType] = useState('info');

  const allowedMax = Math.max(numStudents ?? 1, maxSelectableStudents ?? 1);

  useEffect(() => {
    const perStudent = regularPrice - (discount || 0);
    setNewTotal(perStudent * selectedStudents);
  }, [selectedStudents, regularPrice, discount]);

  useEffect(() => {
    if (selectedStudents > allowedMax) setSelectedStudents(allowedMax);
  }, [allowedMax, selectedStudents]);

  async function handleSubmit(e) {
    e.preventDefault();
    setIsProcessing(true);

    try {
      if (selectedStudents === numStudents) {
        await adminUpdateBooking({
          bookingId,
          numStudents,
          totalPrice: newTotal,
          observations: obsText,
        });
        setModalType('success');
        setModalMessage('Booking updated successfully.');
      } else if (newTotal > totalPrice) {
        const diff = newTotal - totalPrice;
        setPaymentAmount(diff);

        if (status === 'paid') {
          setShowPaymentForm(true);
        } else {
          await adminUpdateBooking({
            bookingId,
            numStudents: selectedStudents,
            totalPrice: newTotal,
            observations: obsText,
          });
          setModalType('success');
          setModalMessage(
            'Booking updated successfully (unpaid — no payment required).'
          );
        }
      } else {
        const refundValue = totalPrice - newTotal;
        setRefundAmount(refundValue);

        if (status === 'paid') {
          setShowRefundForm(true);
        } else {
          await adminUpdateBooking({
            bookingId,
            numStudents: selectedStudents,
            totalPrice: newTotal,
            observations: obsText,
          });
          setModalType('success');
          setModalMessage('Booking updated successfully.');
        }
      }
    } catch (err) {
      console.error(err);
      setModalType('error');
      setModalMessage('Error updating booking.');
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <div className="w-full">
      <h2 className="text-xl sm:text-2xl font-semibold text-blue-950 mb-4 sm:mb-6">
        Edit Booking #{bookingId}
      </h2>

      <form
        onSubmit={handleSubmit}
        className="bg-primary-500 py-6 sm:py-10 px-4 sm:px-8 md:px-16 flex flex-col gap-6 rounded-lg text-white"
      >
        {/* Students selector */}
        <div className="flex flex-col gap-2">
          <label className="font-medium text-sm sm:text-base">
            Number of students
          </label>
          <select
            value={selectedStudents}
            onChange={(e) => setSelectedStudents(Number(e.target.value))}
            className="px-4 py-3 bg-primary-200 text-primary-800 w-full rounded-md outline-none focus:ring-2 focus:ring-primary-300"
          >
            {Array.from({ length: allowedMax }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                {n} {n === 1 ? 'student' : 'students'}
              </option>
            ))}
          </select>
          <p className="text-xs text-primary-100 opacity-80 mt-1">
            Max available seats: {allowedMax}
          </p>
        </div>

        {/* Observations */}
        <div className="flex flex-col gap-2">
          <label className="font-medium text-sm sm:text-base">Notes</label>
          <textarea
            value={obsText}
            rows={3}
            onChange={(e) => setObsText(e.target.value)}
            className="px-4 py-3 bg-primary-200 text-primary-800 w-full rounded-md outline-none focus:ring-2 focus:ring-primary-300"
            placeholder="Add internal notes here..."
          />
        </div>

        {/* Total / Submit Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 pt-4 border-t border-primary-400">
          <div className="w-full sm:w-auto bg-primary-600/30 p-3 rounded-lg sm:bg-transparent sm:p-0">
            <TotalPriceCalculator
              regularPrice={regularPrice}
              discount={discount}
              selectedStudents={selectedStudents}
              defaultTotal={totalPrice}
            />
          </div>

          <div className="w-full sm:w-auto">
            <SubmitButton
              pendingLabel="Updating..."
              disabled={isProcessing || showRefundForm || showPaymentForm}
              className="w-full sm:w-auto"
            >
              Update Booking
            </SubmitButton>
          </div>
        </div>
      </form>

      {/* Modals remain the same */}
      {showRefundForm && (
        <RefundRequestFormAdmin
          bookingId={bookingId}
          refundAmount={refundAmount}
          numStudents={selectedStudents}
          oldTotal={totalPrice}
          newTotal={newTotal}
          onClose={(wasSubmitted) => {
            setShowRefundForm(false);
            if (wasSubmitted) {
              setModalType('success');
              setModalMessage('Refund request submitted.');
            }
          }}
        />
      )}

      {showPaymentForm && (
        <AdditionalPaymentFormAdmin
          bookingId={bookingId}
          paymentAmount={paymentAmount}
          oldStudents={numStudents}
          newStudents={selectedStudents}
          oldTotal={totalPrice}
          newTotal={newTotal}
          onClose={(wasSubmitted) => {
            setShowPaymentForm(false);
            if (wasSubmitted) {
              setModalType('success');
              setModalMessage('Additional payment initiated.');
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
