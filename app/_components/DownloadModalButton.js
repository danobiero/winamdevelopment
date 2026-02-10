'use client';

import { useState, useTransition, useEffect } from 'react';
import {
  checkBookingByPhone,
  getLessonFilePath,
  getDownloadUrl,
} from '@/app/_lib/actions';
import PaymentButton from '@/app/_components/PaymentButton';

export default function DownloadModalButton({ lessonId }) {
  const [isOpen, setIsOpen] = useState(false);
  const [phone, setPhone] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [result, setResult] = useState(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (
      result?.status === 'paid' ||
      result?.status === 'unpaid' ||
      result?.status === 'no_material'
    ) {
      const timer = setTimeout(() => setResult(null), 6000);
      return () => clearTimeout(timer);
    }
  }, [result]);

  const openModal = () => {
    setIsOpen(true);
    setFeedback(null);
    setResult(null);
  };

  const closeModal = () => {
    setIsOpen(false);
    setFeedback(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!/^\+?\d{7,15}$/.test(phone)) {
      setFeedback({
        type: 'error',
        message: 'Invalid phone number. Use digits only, e.g. 15551234567',
      });
      return;
    }

    startTransition(async () => {
      try {
        const res = await checkBookingByPhone(phone);

        if (
          res.status === 'phone_not_found' ||
          res.status === 'phone_mismatch'
        ) {
          setFeedback({ type: 'error', message: res.message });
          return;
        }

        // =====================================================
        //                ✔ PAYMENT VERIFIED
        // =====================================================
        if (res.status === 'paid') {
          // Do NOT close modal yet
          setFeedback({
            type: 'info',
            message: 'Payment verified. Checking for study materials…',
          });

          try {
            // 1️⃣ Check if materials exist
            const fileInfo = await getLessonFilePath(lessonId);

            // =============================================
            //   📄 MATERIAL NOT AVAILABLE → FRIENDLY MESSAGE
            // =============================================
            if (fileInfo.status !== 'ok') {
              setResult({
                status: 'no_material',
                message: 'Lesson material is not yet available.',
              });

              setFeedback({
                type: 'info',
                message:
                  '📄 Your payment is verified, but this lesson’s material is not yet available.',
              });

              // Keep modal open
              return;
            }

            // =============================================
            //       ✔ MATERIAL EXISTS → START DOWNLOAD
            // =============================================

            // Close modal only after confirming materials exist
            closeModal();

            setResult({
              message: '✅ Payment verified. Download starting…',
              status: 'paid',
            });

            const downloadUrl = await getDownloadUrl(fileInfo.storagePath);

            const popup = window.open(
              downloadUrl,
              '_blank',
              'noopener,noreferrer'
            );

            // ===================================================
            // 🔄 FALLBACK (POPUP BLOCKED) → BLOB DOWNLOAD
            // ===================================================
            if (!popup) {
              const response = await fetch(downloadUrl);

              if (!response.ok) {
                throw new Error('File failed to download.');
              }

              const blob = await response.blob();
              const blobUrl = window.URL.createObjectURL(blob);

              const link = document.createElement('a');
              link.style.display = 'none';
              link.href = blobUrl;
              link.download = fileInfo.storagePath.split('/').pop();

              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              window.URL.revokeObjectURL(blobUrl);
            }
          } catch (err) {
            console.error(err);
            setFeedback({
              type: 'error',
              message: 'Download failed. Please try again.',
            });
          }

          return;
        }

        // =====================================================
        //                       🚫 UNPAID
        // =====================================================
        if (res.status === 'unpaid') {
          setFeedback({
            type: 'info',
            message: 'Lesson found but unpaid. Please complete payment.',
          });

          setResult({
            status: 'unpaid',
            booking: res.booking,
          });

          return;
        }

        // =====================================================
        //                 ❓ LESSON NOT FOUND
        // =====================================================
        if (res.status === 'not_found') {
          setFeedback({
            type: 'error',
            message: res.message || 'No lessons found for this student.',
          });

          setResult({
            status: 'not_found',
            message: res.message,
          });

          return;
        }

        // =====================================================
        //                 ❌ GENERAL ERROR
        // =====================================================
        if (res.status === 'error') {
          setFeedback({
            type: 'error',
            message: res.message || 'Something went wrong.',
          });
          setResult({
            status: 'error',
            message: res.message,
          });
          return;
        }
      } catch (err) {
        console.error(err);
        setFeedback({
          type: 'error',
          message: 'Something went wrong. Please try again.',
        });
        setResult({
          status: 'error',
          message: 'Something went wrong.',
        });
      }
    });
  };

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={openModal}
        className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg text-lg shadow-lg"
      >
        Download
      </button>

      {/* ==============================
                MODAL
      =============================== */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-80 text-center">
            <h3 className="text-xl font-semibold mb-4">
              Enter Your Phone Number
            </h3>

            {/* Feedback bubble */}
            {feedback && (
              <div
                className={`mb-3 p-2 rounded-md text-sm flex items-center gap-2 ${
                  feedback.type === 'error'
                    ? 'bg-red-100 text-red-700'
                    : feedback.type === 'info'
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-green-100 text-green-700'
                }`}
              >
                <span>
                  {feedback.type === 'error'
                    ? '❌'
                    : feedback.type === 'info'
                      ? '⚠️'
                      : '✅'}
                </span>
                {feedback.message}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="tel"
                placeholder="15551234567 No Dash and Spaces"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600"
                required
              />

              <div className="flex justify-between mt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isPending}
                  className="px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-70"
                >
                  {isPending ? 'Checking...' : 'Submit'}
                </button>
              </div>
            </form>

            {/* =============================
                 UNPAID → Payment Button
            ===============================*/}
            {result?.status === 'unpaid' && result?.booking?.id && (
              <div className="mt-4">
                <p className="text-sm text-yellow-700 mb-2">
                  Booking found but unpaid. Please complete your payment:
                </p>
                <PaymentButton bookingId={result.booking.id} />
              </div>
            )}

            {/* =============================
                FRIENDLY "NO MATERIAL" MESSAGE
            ===============================*/}
            {result?.status === 'no_material' && (
              <div className="mt-4 text-sm text-blue-700 bg-blue-50 p-3 rounded-md leading-relaxed">
                <strong>Material Coming Soon!</strong>
                <br />
                Your lesson is confirmed, but this lesson’s study material is
                not yet available. Please check back soon.
              </div>
            )}

            {/* =============================
                   LESSON NOT FOUND
            ===============================*/}
            {result?.status === 'not_found' && (
              <div className="mt-4 text-sm text-gray-600 italic">
                No lessons found for this student.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Success banner */}
      {result?.status === 'paid' && (
        <div className="mt-4 p-3 rounded-lg bg-green-100 text-green-700">
          {result.message}
        </div>
      )}
    </>
  );
}
