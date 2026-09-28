'use client';

export default function PropertyDetailModal({ property, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 md:p-6 z-50">
      <div className="bg-white rounded-xl w-full max-w-2xl p-4 sm:p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">{property.name}</h2>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg text-slate-500 cursor-pointer">✕</button>
        </div>

        {/* 🔹 Score */}
        <div className="text-3xl font-bold text-green-600 mb-4">
          {property.totalScore}
        </div>

        {/* 🔹 Breakdown */}
        <div className="space-y-2">
          {property.breakdown.map((b, i) => (
            <div key={i} className="flex justify-between border-b py-2">
              <span className="font-medium">{b.category}</span>

              <span className="text-gray-600">{b.option}</span>

              <span className="font-bold text-blue-600">+{b.weight}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
