'use client';
import { useEffect, useState } from 'react';

export default function PaymentSuccessPage() {
  const [message, setMessage] = useState('Recording your payment...');

  useEffect(() => {
    const confirmPayment = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const sessionId = urlParams.get('session_id');
      const bookingId = urlParams.get('bookingId');

      if (!sessionId) {
        setMessage('Missing session ID in URL.');
        return;
      }

      try {
        const res = await fetch(`/api/record-payment?session_id=${sessionId}`);
        const data = await res.json();

        if (res.ok) {
          setMessage(
            `✅ Payment recorded successfully for booking #${bookingId}`
          );
        } else {
          setMessage(`⚠️ ${data.error || 'Payment recording failed'}`);
        }
      } catch (err) {
        console.error('Payment success error:', err);
        setMessage('❌ Failed to record payment.');
      }
    };

    confirmPayment();
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center">
      <h1 className="text-2xl font-bold mb-4">Payment Success</h1>
      <p>{message}</p>
      <a href="/account/reservations" className="mt-4 text-blue-600 underline">
        Go to My Bookings
      </a>
    </div>
  );
}
