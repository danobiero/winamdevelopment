'use client';

import { useState } from 'react';

export default function ReportTable({ data }) {
  const [selected, setSelected] = useState(null);

  const sorted = [...data].sort((a, b) => b.totalScore - a.totalScore);

  

  return (
    <div className="max-w-[1600px] mx-auto p-8 bg-gray-50 min-h-screen">
      <header className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">
            Land Score Report
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Comparative performance analysis across {data.length} properties.
          </p>
        </div>
        <button className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-gray-50 transition-colors shadow-sm">
          Export PDF
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* 🔹 COLUMN 1: PROPERTY RANKING (8/12) */}
        <section className="lg:col-span-7 bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50 text-[11px] font-black uppercase tracking-widest text-gray-400 border-b border-gray-100">
                <th className="px-6 py-4">Rank</th>
                <th className="px-6 py-4">Property Identity</th>
                <th className="px-6 py-4 text-center">Score Metric</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sorted.map((p, i) => (
                <tr
                  key={p.id}
                  className={`cursor-pointer transition-all ${
                    selected?.id === p.id
                      ? 'bg-blue-50/50 ring-1 ring-inset ring-blue-500'
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => setSelected(p)}
                >
                  <td className="px-6 py-5">
                    <span
                      className={`text-sm font-mono font-bold ${i < 3 ? 'text-blue-600' : 'text-gray-400'}`}
                    >
                      #{String(i + 1).padStart(2, '0')}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <div className="text-sm font-bold text-gray-800">
                      {p.name}
                    </div>
                    <div className="text-[10px] text-gray-400 uppercase tracking-tighter">
                      Verified Assessment
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center justify-center gap-3">
                      <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-green-500"
                          style={{ width: `${p.totalScore}%` }}
                        />
                      </div>
                      <span className="text-sm font-black text-green-700">
                        {p.totalScore}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* 🔹 COLUMN 2: ANALYSIS BREAKDOWN (4/12) */}
        <aside className="lg:col-span-5 sticky top-8">
          {selected ? (
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="p-8 bg-gray-900 text-white">
                <div className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-2">
                  Deep Dive Analysis
                </div>
                <h2 className="text-2xl font-black leading-tight">
                  {selected.name}
                </h2>
                <div className="mt-4 flex items-center gap-4">
                  <div className="text-4xl font-black text-green-400">
                    {selected.totalScore}
                  </div>
                  <div className="text-[10px] text-gray-400 leading-tight uppercase">
                    Aggregate
                    <br />
                    Weighted Score
                  </div>
                </div>
              </div>

              <div className="p-8 space-y-6">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                  Weight Distribution
                </h3>
                <div className="space-y-4">
                  {selected.breakdown.map((b, i) => (
                    <div key={i} className="group">
                      <div className="flex justify-between items-end mb-1">
                        <span className="text-[11px] font-bold text-gray-400 uppercase">
                          {b.category}
                        </span>
                        <span className="text-xs font-mono font-bold text-blue-600">
                          +{b.weight}
                        </span>
                      </div>
                      <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-100 group-hover:border-blue-200 transition-colors">
                        <span className="text-sm font-semibold text-gray-700">
                          {b.option}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => setSelected(null)}
                  className="w-full py-3 text-xs font-bold text-gray-400 hover:text-gray-600 transition-colors"
                >
                  Clear Selection
                </button>
              </div>
            </div>
          ) : (
            <div className="h-[400px] border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center text-center p-8">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-gray-400">
                🔍
              </div>
              <h3 className="text-sm font-bold text-gray-800">
                No Property Selected
              </h3>
              <p className="text-xs text-gray-400 mt-1">
                Select a property from the list to view the detailed factor
                breakdown.
              </p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
