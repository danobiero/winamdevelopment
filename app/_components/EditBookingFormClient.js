'use client';

import { useState, useEffect } from 'react';
import SubmitButton from '@/app/_components/SubmitButton';
import TotalPriceCalculator from './TotalPriceCalculator';
import { updateBooking } from '@/app/_lib/actions';
import RefundRequestForm from './RefundRequestForm';
import AdditionalPaymentForm from './AdditionalPaymentForm';
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
        await updateBooking({
          bookingId,
          numStudents,
          totalPrice: newTotal,
          observations: obsText,
        });
        setModalType('success');
        setModalMessage('Booking updated successfully.');
      } else if (newTotal > totalPrice) {
        const difference = newTotal - totalPrice;
        setPaymentAmount(difference);
        if (status === 'paid') {
          setShowPaymentForm(true);
        } else {
          await updateBooking({
            bookingId,
            numStudents: selectedStudents,
            totalPrice: newTotal,
            observations: obsText,
          });
          setModalType('success');
          setModalMessage('Booking updated successfully (unpaid).');
        }
      } else {
        const refundValue = totalPrice - newTotal;
        setRefundAmount(refundValue);
        if (status === 'paid') {
          setShowRefundForm(true);
        } else {
          await updateBooking({
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
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
      <h2 className="font-bold text-xl sm:text-2xl text-blue-950 mb-6 text-center sm:text-left">
        Edit Lesson Reservation #{bookingId}
      </h2>

      <form
        onSubmit={handleSubmit}
        className="bg-primary-500 py-8 px-6 sm:px-10 lg:px-16 flex flex-col gap-6 rounded-2xl shadow-xl text-white"
      >
        {/* Students selector */}
        <div className="space-y-3">
          <label className="font-bold text-sm uppercase tracking-wider opacity-90">
            Adjust number of students
          </label>
          <select
            value={selectedStudents}
            onChange={(e) => setSelectedStudents(Number(e.target.value))}
            className="px-4 py-4 bg-white text-primary-800 w-full rounded-xl text-lg font-semibold focus:ring-4 focus:ring-primary-300 outline-none transition-all appearance-none"
            required
          >
            {Array.from({ length: allowedMax }, (_, i) => i + 1).map((x) => (
              <option key={x} value={x}>
                {x} {x === 1 ? 'student' : 'students'}
              </option>
            ))}
          </select>
          <p className="text-xs font-medium text-primary-100 italic">
            Max available: {allowedMax} student{allowedMax > 1 ? 's' : ''}
          </p>
        </div>

        {/* Observations */}
        <div className="space-y-3">
          <label className="font-bold text-sm uppercase tracking-wider opacity-90">
            Anything we should know?
          </label>
          <textarea
            name="observations"
            id="observations"
            value={obsText}
            onChange={(e) => setObsText(e.target.value)}
            rows={4}
            className="px-4 py-4 bg-white text-primary-800 w-full rounded-xl text-base focus:ring-4 focus:ring-primary-300 outline-none transition-all resize-none"
            placeholder="Notes for the coach..."
          />
        </div>

        {/* Total / CTA - Mobile Responsive Flex */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-6 mt-4 pt-6 border-t border-white/10">
          <div className="w-full sm:w-auto text-center sm:text-left">
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
              className="w-full sm:w-auto px-8 py-4 bg-white text-primary-600 font-black rounded-xl hover:bg-primary-50 transition-colors"
            >
              Update Reservation
            </SubmitButton>
          </div>
        </div>
      </form>

      {/* Modals are usually inherently responsive, but ensure they handle overflow */}
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
