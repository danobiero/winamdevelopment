'use client';

import React, { useState } from 'react';
import { PencilSquareIcon } from '@heroicons/react/24/solid';
import { format, isPast, isToday, parseISO, formatDistance } from 'date-fns';
import DeleteReservation from './DeleteReservation';
import Image from 'next/image';
import Link from 'next/link';
import PaymentButton from '@/app/_components/PaymentButton';
import RefundHistoryModal from '@/app/_components/RefundHistoryModal';
import { FormatCurrency } from '../_lib/utils';

export const formatDistanceFromNow = (dateStr) =>
  formatDistance(parseISO(dateStr), new Date(), {
    addSuffix: true,
  }).replace('about ', '');

function ReservationCard({ booking, onDelete }) {
  const {
    id,
    startDate,
    endDate,
    numNights,
    totalPrice,
    numStudents,
    status,
    lessons,
    cancelled,
    refunds,
  } = booking;

  const isCancelled =
    cancelled === true || cancelled === 'true' || cancelled === 1;

  const refundsSafe = refunds ?? [];
  const hasRefunds = refundsSafe.length > 0;
  const [refundOpen, setRefundOpen] = useState(false);

  const name = lessons?.name || 'Invalid Lesson';
  const image = lessons?.image || '/default-avatar.jpg';

  const today = new Date();
  let bookingStatus = 'upcoming';

  if (isToday(new Date(startDate))) bookingStatus = 'new';
  else if (new Date(startDate) < today && new Date(endDate) >= today)
    bookingStatus = 'ongoing';
  else if (isPast(new Date(endDate))) bookingStatus = 'past';

  const displayStatus = isCancelled ? 'cancelled' : bookingStatus;
  const formattedPrice = FormatCurrency(totalPrice);

  const statusColors = {
    past: 'bg-zinc-700 text-zinc-200',
    new: 'bg-green-600 text-white',
    ongoing: 'bg-blue-600 text-white',
    upcoming: 'bg-orange-500 text-white',
    cancelled: 'bg-red-100 text-red-700 border border-red-200',
  };

  return (
    <>
      <div
        className={`flex flex-col md:flex-row rounded-xl border border-primary-200
        bg-white shadow-sm hover:shadow-md transition-all overflow-hidden
        ${isCancelled ? 'opacity-75 grayscale-[0.4]' : ''}`}
      >
        {/* Image */}
        <div className="relative h-44 sm:h-52 md:h-auto md:w-52 flex-shrink-0">
          <Image
            src={image}
            fill
            alt={`Lesson ${name}`}
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 208px"
          />

          <span
            className={`absolute top-3 left-3 md:hidden px-3 py-1 rounded-full
            text-[10px] font-bold uppercase tracking-wider shadow
            ${statusColors[displayStatus]}`}
          >
            {displayStatus}
          </span>
        </div>

        {/* Main Content */}
        <div className="flex-grow p-5 sm:p-6 flex flex-col justify-between min-w-0">
          <div className="min-w-0">
            {/* Title + Desktop Status */}
            <div className="flex items-start justify-between gap-4">
              <h3
                className={`text-lg md:text-xl font-bold text-blue-950 leading-tight break-words
                ${isCancelled ? 'line-through text-gray-400' : ''}`}
              >
                {numNights
                  ? `${numNights} Class${numNights > 1 ? 'es' : ''}`
                  : 'Lesson'}{' '}
                in {name}
              </h3>

              <span
                className={`hidden md:inline-flex px-3 py-1 rounded-full
                text-[10px] font-bold uppercase tracking-wider shrink-0
                ${statusColors[displayStatus]}`}
              >
                {displayStatus}
              </span>
            </div>

            {/* Price */}
            <div className="mt-3">
              <p className="text-2xl font-black text-logo-100">
                {formattedPrice}
              </p>
            </div>

            {/* Details Panel */}
            <div className="mt-4 rounded-lg bg-primary-50/60 border border-primary-100 p-3 space-y-1">
              <div className="flex flex-wrap items-center gap-3 text-xs text-primary-600">
                <span className="font-semibold">
                  {numStudents} Student{numStudents === 1 ? '' : 's'}
                </span>
                <span className="hidden sm:inline text-primary-300">•</span>
                <span>
                  Starts {format(new Date(startDate), 'MMM dd, yyyy')}
                </span>
              </div>

              <span className="block text-[10px] font-mono uppercase opacity-60">
                Booking #{id.toString().slice(-6)}
              </span>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="mt-6 pt-4 border-t border-primary-100 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
            {!isCancelled && status !== 'paid' && (
              <PaymentButton bookingId={id} amount={totalPrice} />
            )}

            {hasRefunds && (
              <button
                onClick={() => setRefundOpen(true)}
                className="px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wide
                bg-amber-50 text-amber-700 border border-amber-200
                hover:bg-amber-100 transition flex items-center justify-center gap-2"
              >
                Refund History
                <span className="text-[10px] bg-amber-200/60 px-2 py-0.5 rounded-full">
                  {refundsSafe.length}
                </span>
              </button>
            )}

            {isCancelled && !hasRefunds && (
              <span
                className="text-[10px] font-bold uppercase tracking-widest
                text-red-600 bg-red-50 border border-red-200 px-3 py-1 rounded"
              >
                Cancelled
              </span>
            )}
          </div>
        </div>

        {/* Control Sidebar */}
        {!isCancelled &&
          (bookingStatus === 'upcoming' || bookingStatus === 'new') && (
            <div
              className="flex md:flex-col border-t md:border-t-0 md:border-l
              border-primary-100 bg-primary-50/40 md:w-28 shrink-0"
            >
              <Link
                href={`/account/reservations/edit/${id}`}
                className="flex-1 flex flex-col items-center justify-center gap-1
                px-4 py-4 text-[10px] font-bold uppercase text-primary-600
                hover:bg-white md:hover:bg-logo-100 md:hover:text-white transition-all
                border-r md:border-r-0 md:border-b border-primary-100"
              >
                <PencilSquareIcon className="h-5 w-5" />
                <span>Edit</span>
              </Link>

              <div className="flex-1 flex items-center justify-center p-2 hover:bg-red-50 transition-all">
                <DeleteReservation
                  bookingId={id}
                  onDelete={onDelete}
                  buttonLabel={status === 'paid' ? 'Cancel' : 'Delete'}
                  refundAmount={totalPrice}
                  numStudents={numStudents}
                  oldTotal={totalPrice}
                  newTotal={0}
                />
              </div>
            </div>
          )}
      </div>

      {/* Refund Modal */}
      <RefundHistoryModal
        open={refundOpen}
        onClose={() => setRefundOpen(false)}
        refunds={refundsSafe}
      />
    </>
  );
}

export default ReservationCard;
