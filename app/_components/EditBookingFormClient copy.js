'use client';

import { useState, useEffect } from 'react';
import SubmitButton from '@/app/_components/SubmitButton';
import TotalPriceCalculator from './TotalPriceCalculator';
import { updateBooking } from '@/app/_lib/actions';
import RefundRequestForm from './RefundRequestForm';
import AdditionalPaymentForm from './AdditionalPaymentForm'; // ✅ new import
import MessageModal from './MessageModal';

export default function EditBookingFormClient({
  booking,
  lesson,
  maxSelectableStudents,
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
  const [modalType, setModalType] = useState('info'); // success, error, info

  // 🔹 Actual max user is allowed to select
  const allowedMax = Math.max(numStudents ?? 1, maxSelectableStudents ?? 1);

  // 🔹 Correct discount math (flat $ discount per student)
  useEffect(() => {
    const perStudent = regularPrice - (discount || 0);
    setNewTotal(perStudent * selectedStudents);
  }, [selectedStudents, regularPrice, discount]);

  // 🔹 Clamp selected students if above allowed max
  useEffect(() => {
    if (selectedStudents > allowedMax) setSelectedStudents(allowedMax);
  }, [allowedMax, selectedStudents]);

  // 🔹 Submit handler
  async function handleSubmit(e) {
    e.preventDefault();
    setIsProcessing(true);

    try {
      // No change in students → just update notes
      if (selectedStudents === numStudents) {
        await updateBooking({
          bookingId,
          numStudents,
          totalPrice: newTotal,
          observations: obsText,
        });
        setModalType('success');
        setModalMessage('Booking updated successfully.');
      }

      // Students increased → potential additional payment
      else if (newTotal > totalPrice) {
        const difference = newTotal - totalPrice;
        setPaymentAmount(difference);

        if (status === 'paid') {
          // 🔥 For paid bookings, open AdditionalPaymentForm modal
          setShowPaymentForm(true);
        } else {
          // 🧾 For unpaid bookings, just update directly
          await updateBooking({
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

      // Students decreased → potential refund
      else {
        const refundValue = totalPrice - newTotal;
        setRefundAmount(refundValue);

        if (status === 'paid') {
          // 💰 For paid bookings, show RefundRequestForm modal
          setShowRefundForm(true);
        } else {
          // 🧾 For unpaid bookings, just update directly
          await updateBooking({
            bookingId,
            numStudents: selectedStudents,
            totalPrice: newTotal,
            observations: obsText,
          });
          setModalType('success');
          setModalMessage('Booking updated successfully (no refund required).');
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
      <h2 className="font-semibold text-2xl text-blue-950 mb-7">
        Edit Lesson Reservation #{bookingId}
      </h2>

      <form
        onSubmit={handleSubmit}
        className="bg-primary-500 py-6 sm:py-10 px-4 sm:px-8 md:px-16 flex flex-col gap-5 rounded-b-lg text-white"
      >
        {/* Students selector */}
        <div className="space-y-2">
          <label className="font-medium">Adjust number of students</label>
          <select
            value={selectedStudents}
            onChange={(e) => setSelectedStudents(Number(e.target.value))}
            className="px-4 py-3 bg-primary-200 text-primary-800 w-full rounded-md"
            required
          >
            {Array.from({ length: allowedMax }, (_, i) => i + 1).map((x) => (
              <option key={x} value={x}>
                {x} {x === 1 ? 'student' : 'students'}
              </option>
            ))}
          </select>
          <p className="text-xs text-primary-200">
            Max allowed right now: {allowedMax} student
            {allowedMax > 1 ? 's' : ''}
          </p>
        </div>

        {/* Observations */}
        <div className="space-y-2">
          <label className="font-medium">Anything we should know?</label>
          <textarea
            name="observations"
            id="observations"
            value={obsText}
            onChange={(e) => setObsText(e.target.value)}
            className="px-4 py-3 bg-primary-200 text-primary-800 w-full rounded-md"
          />
        </div>

        {/* Total / CTA */}
        <div className="flex justify-between items-center mt-4">
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
            Update Reservation
          </SubmitButton>
        </div>
      </form>

      {/* 🔹 Refund modal */}
      {showRefundForm && (
        <RefundRequestForm
          bookingId={bookingId}
          refundAmount={refundAmount}
          numStudents={selectedStudents}
          oldTotal={totalPrice}
          newTotal={newTotal}
          onClose={(wasSubmitted) => {
            setShowRefundForm(false);
            if (wasSubmitted) {
              setModalType('success');
              setModalMessage('Refund request submitted successfully.');
            }
          }}
        />
      )}

      {/* 🔹 Additional Payment modal */}
      {showPaymentForm && (
        <AdditionalPaymentForm
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
              setModalMessage('Additional payment initiated successfully.');
            }
          }}
        />
      )}

      {/* 🔹 Message modal */}
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
