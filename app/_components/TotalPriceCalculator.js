'use client';
import { useState, useEffect } from 'react';

export default function TotalPriceCalculator({
  regularPrice,
  discount,
  selectedStudents,
  defaultTotal,
}) {
  const [numStudents, setNumStudents] = useState(selectedStudents || 0);
  const [total, setTotal] = useState(defaultTotal || 0);

  const formatPrice = (value) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(value);

  // ✅ Recalculate total whenever selectedStudents, regularPrice, or discount changes
  useEffect(() => {
    if (!regularPrice || selectedStudents === 0) return;

    // 🔥 Treat discount as a flat dollar amount per student
    const perStudent = regularPrice - (discount || 0);
    const newTotal = perStudent * selectedStudents;

    setNumStudents(selectedStudents);
    setTotal(newTotal);
  }, [selectedStudents, regularPrice, discount]);

  return (
    <div className="space-y-3">
      <div className="bg-orange-200 px-4 py-2 rounded-md text-primary-800 font-semibold">
        Total Price: {formatPrice(total)}
      </div>

      {/* Hidden numeric value for form submission */}
      <input type="hidden" name="totalPrice" value={total.toFixed(2)} />
    </div>
  );
}
