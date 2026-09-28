'use client';

import { useState } from 'react';
import PropertyCard from './PropertyCard';
import PropertyDetailModal from './PropertyDetailModal';

export default function PropertyDashboard({ properties }) {
  const [selected, setSelected] = useState(null);

  const sorted = [...properties].sort((a, b) => b.totalScore - a.totalScore);
  const topThree = sorted.slice(0, 3);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* 🔹 MAIN GRID CONTAINER */}
      <div className="max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* 🔹 LEFT COLUMN: TOP PERFORMERS (4/12 width) */}
        <aside className="lg:col-span-4 space-y-6">
          <div className="sticky top-6">
            <div className="mb-6">
              <h2 className="text-xs uppercase tracking-widest text-blue-600 font-bold">
                Analysis Highlights
              </h2>
              <p className="text-xl font-extrabold text-gray-900">
                Top 3 Candidates
              </p>
            </div>

            <div className="space-y-4">
              {topThree.map((p, i) => (
                <div
                  key={p.id}
                  className="relative transition-transform hover:scale-[1.02] cursor-pointer"
                  onClick={() => setSelected(p)}
                >
                  <div className="absolute -top-2 -right-2 bg-blue-600 text-white w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shadow-lg z-10">
                    #{i + 1}
                  </div>
                  <PropertyCard property={p} />
                </div>
              ))}
            </div>

            {/* Quick Stats Summary Box */}
            <div className="mt-8 p-6 bg-blue-900 rounded-2xl text-white shadow-xl">
              <h4 className="text-blue-200 text-xs uppercase font-bold mb-2">
                Portfolio Overview
              </h4>
              <div className="text-3xl font-light">
                {properties.length}{' '}
                <span className="text-sm uppercase opacity-60">
                  Total Units
                </span>
              </div>
              <div className="mt-4 pt-4 border-t border-blue-800 flex justify-between text-sm">
                <span>Avg Score:</span>
                <span className="font-mono">
                  {(
                    properties.reduce((acc, curr) => acc + curr.totalScore, 0) /
                    properties.length
                  ).toFixed(1)}
                </span>
              </div>
            </div>
          </div>
        </aside>

        {/* 🔹 RIGHT COLUMN: FULL DATA TABLE (8/12 width) */}
        <main className="lg:col-span-8">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-white">
              <h3 className="font-bold text-gray-800">
                Complete Property Ranking
              </h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Filter by name..."
                  className="text-sm border rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50/50 text-xs uppercase tracking-wider text-gray-400 font-bold">
                    <th className="px-6 py-4">Rank</th>
                    <th className="px-6 py-4">Property</th>
                    <th className="px-6 py-4 text-center">Score</th>
                    <th className="px-6 py-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {sorted.map((p, i) => (
                    <tr
                      key={p.id}
                      className="group hover:bg-blue-50/40 transition-colors cursor-pointer"
                      onClick={() => setSelected(p)}
                    >
                      <td className="px-6 py-4">
                        <span
                          className={`text-sm font-semibold ${i < 3 ? 'text-blue-600' : 'text-gray-400'}`}
                        >
                          {i + 1}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-bold text-gray-900">
                          {p.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          ID: {p.id.slice(0, 8)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col items-center">
                          <span className="text-sm font-mono font-bold">
                            {p.totalScore}
                          </span>
                          <div className="w-16 h-1 bg-gray-100 rounded-full mt-1 overflow-hidden">
                            <div
                              className={`h-full ${p.totalScore > 80 ? 'bg-green-500' : 'bg-blue-500'}`}
                              style={{ width: `${p.totalScore}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          Reviewed
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {/* 🔥 MODAL */}
      {selected && (
        <PropertyDetailModal
          property={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
