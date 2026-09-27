'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { FormatCurrency } from '../_lib/utils';
import { XMarkIcon, ArrowTrendingUpIcon, ArrowTrendingDownIcon } from '@heroicons/react/24/outline';

export default function PerformanceModal({
  investment,
  valuations = [],
  onClose,
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle ESC key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Prevent background body scrolling when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  // -------------------------------------------------------------
  // TRANSFORM DATA FOR CHART
  // -------------------------------------------------------------
  const inceptionPoint = {
    date: investment?.start_date || investment?.created_at,
    value: Number(investment?.amount_invested || 0),
  };

  const chartData = [
    inceptionPoint,
    ...(valuations?.map((v) => ({
      date: v.valuation_date,
      value: Number(v.value),
    })) || []),
  ];

  const inception = chartData[0]?.value || 0;
  const current = chartData[chartData.length - 1]?.value || 0;

  const returnPct =
    inception > 0
      ? (((current - inception) / inception) * 100).toFixed(2)
      : '0.00';

  const isPositive = Number(returnPct) >= 0;
  const assetName =
    investment?.opportunities?.name ||
    investment?.opportunity_name ||
    investment?.name ||
    'Investment Position';

  if (!mounted) return null;

  const modalContent = (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-[9999] bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto animate-in fade-in duration-200"
    >
      <div className="relative bg-white rounded-2xl sm:rounded-3xl w-full max-w-2xl lg:max-w-3xl max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in zoom-in-95 duration-200">
        {/* HEADER */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/80 shrink-0">
          <div className="min-w-0 pr-4">
            <h2 className="text-base sm:text-lg font-black text-slate-900 uppercase tracking-tight truncate">
              Performance Report
            </h2>
            <p className="text-xs text-slate-500 font-medium truncate mt-0.5">
              {assetName}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 sm:p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-full transition-all shrink-0 cursor-pointer"
            aria-label="Close performance modal"
          >
            <XMarkIcon className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        {/* SCROLLABLE BODY */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 custom-scrollbar space-y-5">
          {/* METRICS ROW */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
            <div className="bg-slate-50 p-3 sm:p-3.5 rounded-xl border border-slate-200/60 min-w-0">
              <p className="text-[10px] uppercase font-bold text-slate-400 mb-1 tracking-wider">
                Inception Capital
              </p>
              <p className="text-base sm:text-lg font-black text-slate-900 tracking-tight truncate font-mono">
                {FormatCurrency(inception)}
              </p>
            </div>

            <div className="bg-emerald-50/70 p-3 sm:p-3.5 rounded-xl border border-emerald-200/60 min-w-0">
              <p className="text-[10px] uppercase font-bold text-emerald-700 mb-1 tracking-wider">
                Current Valuation
              </p>
              <p className="text-base sm:text-lg font-black text-emerald-700 tracking-tight truncate font-mono">
                {FormatCurrency(current)}
              </p>
            </div>

            <div
              className={`p-3 sm:p-3.5 rounded-xl border min-w-0 ${
                isPositive
                  ? 'bg-blue-50/70 border-blue-200/60 text-blue-700'
                  : 'bg-rose-50/70 border-rose-200/60 text-rose-700'
              }`}
            >
              <p className="text-[10px] uppercase font-bold mb-1 tracking-wider opacity-80">
                Total Return
              </p>
              <p className="text-base sm:text-lg font-black tracking-tight truncate flex items-center gap-1">
                {isPositive ? (
                  <ArrowTrendingUpIcon className="w-4 h-4 shrink-0 text-emerald-600 inline" />
                ) : (
                  <ArrowTrendingDownIcon className="w-4 h-4 shrink-0 text-rose-600 inline" />
                )}
                <span>{returnPct}%</span>
              </p>
            </div>
          </div>

          {/* CHART SECTION */}
          <div className="h-56 sm:h-64 md:h-72 w-full pt-1">
            {!valuations || valuations.length === 0 ? (
              <div className="h-full flex items-center justify-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">
                  Initializing Performance Data...
                </p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#f1f5f9"
                  />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(str) =>
                      str ? format(parseISO(str), 'MMM d') : ''
                    }
                    fontSize={10}
                    fontWeight="bold"
                    tick={{ fill: '#94a3b8' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    fontSize={10}
                    fontWeight="bold"
                    tick={{ fill: '#94a3b8' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `$${Number(v).toLocaleString()}`}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '12px',
                      border: 'none',
                      backgroundColor: '#0f172a',
                      color: '#ffffff',
                      boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.2)',
                      fontSize: '11px',
                      fontWeight: '600',
                    }}
                    itemStyle={{ color: '#ffffff' }}
                    labelFormatter={(label) =>
                      label ? format(parseISO(label), 'MMMM dd, yyyy') : ''
                    }
                    formatter={(v) => [FormatCurrency(v), 'Value']}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#2563eb"
                    strokeWidth={3}
                    dot={{
                      r: 3.5,
                      fill: '#2563eb',
                      strokeWidth: 2,
                      stroke: '#fff',
                    }}
                    activeDot={{ r: 5, strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* FOOTER */}
        <div className="p-3.5 sm:p-4 border-t border-slate-100 bg-slate-50/60 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5 active:scale-95"
          >
            <span>Close Report</span>
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
