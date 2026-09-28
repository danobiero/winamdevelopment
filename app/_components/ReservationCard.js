'use client';

import React, { useState } from 'react';
import { PencilSquareIcon, ArrowDownTrayIcon, InformationCircleIcon } from '@heroicons/react/24/solid';
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

function ReservationCard({ booking, onDelete, isFullWidth }) {
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

  
  const [showMaterialsList, setShowMaterialsList] = useState(false);
  const [refundOpen, setRefundOpen] = useState(false);
  const isCancelled =
    cancelled === true || cancelled === 'true' || cancelled === 1;
  const refundsSafe = refunds ?? [];
  const hasRefunds = refundsSafe.length > 0;

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

  // Extract the material (taking the first one if multiple exist)
  const material = lessons?.lesson_materials?.[0];
  const materialUrl = material?.file_url;
  const materials = lessons?.lesson_materials || [];
  const hasMultiple = materials.length > 1;
  const hasSingle = materials.length === 1;
  const hasNone = materials.length === 0;

  const handleDownload = () => {
    if (!materialUrl) return;
    // Opens the file in a new tab; browser handles the download/view
    window.open(materialUrl, '_blank');
  };

  return (
    <>
      <div
        className={`flex rounded-xl border border-primary-200 bg-white shadow-sm 
        hover:shadow-md transition-all overflow-hidden h-full
        ${isFullWidth ? 'flex-col md:flex-row' : 'flex-col'} 
        ${isCancelled ? 'opacity-75 grayscale-[0.4]' : ''}`}
      >
        {/* Image Section */}
        <div
          className={`relative flex-shrink-0 
          ${isFullWidth ? 'aspect-video md:aspect-auto md:w-2/5' : 'h-48 w-full'}`}
        >
          <Image
            src={image}
            fill
            alt={`Lesson ${name}`}
            className="object-cover"
            sizes={
              isFullWidth
                ? '(max-width: 768px) 100vw, 40vw'
                : '(max-width: 768px) 100vw, 50vw'
            }
          />

          <span
            className={`absolute top-3 left-3 px-3 py-1 rounded-full
            text-xs font-bold uppercase tracking-wider shadow-md z-10
            ${statusColors[displayStatus]}`}
          >
            {displayStatus}
          </span>
        </div>

        {/* Content Section */}
        <div className="flex-grow flex flex-col min-w-0">
          <div className="p-5 flex-grow flex flex-col min-w-0">
            <div className="min-w-0">
              <h3
                className={`text-lg font-bold text-blue-950 leading-tight break-words
                ${isCancelled ? 'line-through text-gray-400' : ''}`}
              >
                {numNights
                  ? `${numNights} Class${numNights > 1 ? 'es' : ''}`
                  : 'Lesson'}{' '}
                in {name}
              </h3>

              <div className="mt-2">
                <p className="text-2xl font-black text-logo-100">
                  {formattedPrice}
                </p>
              </div>

              <div className="mt-4 rounded-lg bg-primary-50/60 border border-primary-100 p-3 space-y-1">
                <div className="flex flex-wrap items-center gap-2 text-xs text-primary-600">
                  <span className="font-semibold">
                    {numStudents} Student{numStudents === 1 ? '' : 's'}
                  </span>
                  <span className="text-primary-300">•</span>
                  <span>
                    Starts {format(new Date(startDate), 'MMM dd, yyyy')}
                  </span>
                  
                </div>
                <span className="block text-xs font-mono uppercase opacity-60">
                  Booking #{id.toString().slice(-6)}
                </span>
              </div>
            </div>

            {/* Middle Action Buttons (Payment/Refund) */}
            <div className="mt-auto pt-5 flex flex-col gap-2">
              {!isCancelled && status !== 'paid' && (
                <PaymentButton bookingId={id} amount={totalPrice} />
              )}
              {hasRefunds && (
                <button
                  onClick={() => setRefundOpen(true)}
                  className="w-full px-4 py-2 rounded-lg text-xs font-bold uppercase 
                  bg-amber-50 text-amber-700 border border-amber-200
                  hover:bg-amber-100 transition flex items-center justify-center gap-2"
                >
                  Refund History
                  <span className="text-xs bg-amber-200/60 px-2 py-0.5 rounded-full">
                    {refundsSafe.length}
                  </span>
                </button>
              )}
            </div>
          </div>

          {/* Bottom Action Bar (Edit/Delete) */}
          {/* Material Action Section */}
          {!isCancelled &&
            (hasNone ? (
              <div
                className="flex-1 flex ... opacity-50 cursor-help"
                title="No materials yet"
              >
                <InformationCircleIcon className="h-4 w-4" />
                <span>Pending</span>
              </div>
            ) : (
              <button
                onClick={() => {
                  if (hasSingle) handleDownload(materials[0].file_url);
                  if (hasMultiple) {
                    // Option: Toggle a small local state to show a list
                    setShowMaterialsList(!showMaterialsList);
                  }
                }}
                className="flex-1 flex items-center justify-center gap-2
      px-4 py-4 text-xs font-bold uppercase text-primary-600
      hover:bg-white transition-all border-r border-primary-100 relative"
              >
                <ArrowDownTrayIcon className="h-4 w-4" />
                <span>
                  {hasMultiple ? `Materials (${materials.length})` : 'Material'}
                </span>

                {/* MINI DROPDOWN (Shown if hasMultiple and toggled) */}
                {hasMultiple && showMaterialsList && (
                  <div className="absolute bottom-full left-0 w-64 bg-white border border-primary-100 shadow-xl rounded-t-lg z-50 mb-1 overflow-hidden">
                    <div className="bg-primary-50 px-3 py-2 border-b border-primary-100 text-xs text-primary-700">
                      Select Material to Download
                    </div>
                    {materials.map((m, index) => (
                      <button
                        key={index}
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(m.file_url, '_blank');
                        }}
                        className="w-full text-left px-4 py-3 text-xs hover:bg-primary-50 flex items-center gap-2 border-b last:border-0 border-gray-50"
                      >
                        <ArrowDownTrayIcon className="h-3 w-3 text-primary-400" />
                        <span className="truncate">{m.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </button>
            ))}

          {/*Booking status symbol */}
          {!isCancelled &&
            (bookingStatus === 'upcoming' || bookingStatus === 'new') && (
              <div className="flex border-t border-primary-100 bg-primary-50/40 w-full">
                <Link
                  href={`/account/reservations/edit/${id}`}
                  className="flex-1 flex items-center justify-center gap-2
                px-4 py-4 text-xs font-bold uppercase text-primary-600
                hover:bg-white transition-all border-r border-primary-100"
                >
                  <PencilSquareIcon className="h-4 w-4" />
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
      </div>

      <RefundHistoryModal
        open={refundOpen}
        onClose={() => setRefundOpen(false)}
        refunds={refundsSafe}
      />
    </>
  );
}

export default ReservationCard;
