'use client';

import { useState, useEffect } from 'react';
import SubmitButton from '@/app/_components/SubmitButton';
import TotalPriceCalculator from '../../../_components/TotalPriceCalculator';
import RefundRequestFormAdmin from '../../../_components/RefundRequestFormAdmin';
import AdditionalPaymentFormAdmin from '../../../_components/AditionalPaymentFormAdmin';
import MessageModal from '../../../_components/MessageModal';
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

  // 🔹 Update total when student count changes
  useEffect(() => {
    const perStudent = regularPrice - (discount || 0);
    setNewTotal(perStudent * selectedStudents);
  }, [selectedStudents, regularPrice, discount]);

  // 🔹 Keep selected students within allowed range
  useEffect(() => {
    if (selectedStudents > allowedMax) setSelectedStudents(allowedMax);
  }, [allowedMax, selectedStudents]);

  // 🔹 Submit form handler
  async function handleSubmit(e) {
    e.preventDefault();
    setIsProcessing(true);

    try {
      // 1️⃣ No change in students → simple update
      if (selectedStudents === numStudents) {
        await adminUpdateBooking({
          bookingId,
          numStudents,
          totalPrice: newTotal,
          observations: obsText,
        });

        setModalType('success');
        setModalMessage('Booking updated successfully.');
      }

      // 2️⃣ Students increased → additional payment
      else if (newTotal > totalPrice) {
        const diff = newTotal - totalPrice;
        setPaymentAmount(diff);

        if (status === 'paid') {
          setShowPaymentForm(true); // 💳 Show modal
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
      }

      // 3️⃣ Students decreased → refund flow
      else {
        const refundValue = totalPrice - newTotal;
        setRefundAmount(refundValue);

        if (status === 'paid') {
          setShowRefundForm(true); // 💰 Show refund modal
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
    <div>
      <h2 className="text-2xl font-semibold text-blue-950 mb-6">
        Edit Booking #{bookingId}
      </h2>

      <form
        onSubmit={handleSubmit}
        className="bg-primary-500 py-6 sm:py-10 px-4 sm:px-8 md:px-16 flex flex-col gap-5 rounded-lg text-white"
      >
        {/* Students selector */}
        <div>
          <label className="font-medium">Number of students</label>
          <select
            value={selectedStudents}
            onChange={(e) => setSelectedStudents(Number(e.target.value))}
            className="px-4 py-3 bg-primary-200 text-primary-800 w-full rounded-md"
          >
            {Array.from({ length: allowedMax }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                {n} {n === 1 ? 'student' : 'students'}
              </option>
            ))}
          </select>

          <p className="text-xs text-primary-200 mt-1">
            Max available seats: {allowedMax}
          </p>
        </div>

        {/* Observations */}
        <div>
          <label className="font-medium">Notes</label>
          <textarea
            value={obsText}
            onChange={(e) => setObsText(e.target.value)}
            className="px-4 py-3 bg-primary-200 text-primary-800 w-full rounded-md"
          />
        </div>

        {/* Total / Submit */}
        <div className="flex justify-between items-center">
          <TotalPriceCalculator
            regularPrice={regularPrice}
            discount={discount}
            selectedStudents={selectedStudents}
            defaultTotal={totalPrice}
          />

          <SubmitButton
            pendingLabel="Updating..."
            disabled={isProcessing || showRefundForm || showPaymentForm}
          >
            Update Booking
          </SubmitButton>
        </div>
      </form>

      {/* Refund Modal */}
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

      {/* Additional Payment Modal */}
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
