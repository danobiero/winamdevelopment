'use client';

export default function PropertyCard({ property, onClick }) {
  return (
    <div
      onClick={onClick}
      className="bg-white border rounded-xl p-4 shadow hover:shadow-lg cursor-pointer transition"
    >
      <h3 className="text-lg font-bold text-blue-950">{property.name}</h3>

      <p className="text-sm text-gray-500 mt-1">Total Score</p>

      <div className="text-2xl font-bold text-green-600">
        {property.totalScore}
      </div>

      {/* 🔹 Simple Score Bar */}
      <div className="mt-3 h-2 bg-gray-200 rounded">
        <div
          className="h-2 bg-green-500 rounded"
          style={{
            width: `${Math.min(property.totalScore, 100)}%`,
          }}
        />
      </div>
    </div>
  );
}
