export default function PaymentCancelledPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center">
      <h1 className="text-3xl font-bold mb-4 text-red-600">
        Payment Cancelled
      </h1>
      <p className="text-lg">
        You cancelled the payment process. No charges were made.
      </p>
      <a href="/" className="mt-6 text-blue-600 underline">
        Return to Home
      </a>
    </div>
  );
}
