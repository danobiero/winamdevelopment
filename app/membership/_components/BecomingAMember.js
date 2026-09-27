'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

// Extracted Step Components
import ReviewStep from './ReviewStep';
import DecisionStep from './DecisionStep';
import AgreementStep from './AgreementStep';
import CompletionStep from './CompletionStep';

// Existing Components
import FundingStep from './FundingStep';
import MembershipForm from './MembershipForm';
import PaymentStep from './PaymentStep';
import RoadmapView from './RoadmapView';

import {
  acknowledgeDecision,
  signOperatingAgreement,
} from '@/app/_lib/actions';

export const dynamic = 'force-dynamic';

export default function BecomingAMember({ session, membershipRecord, fee }) {
  const router = useRouter();

  const [showForm, setShowForm] = useState(false);
  const [isWorking, setIsWorking] = useState(false);
  const [isCheckingPayment, setIsCheckingPayment] = useState(false);

  // Controls when to reveal the agreement
  const [readyForAgreement, setReadyForAgreement] = useState(false);

  // Safely extract fields from the database record
  const {
    status,
    application_fee_paid,
    operating_agreement_signed,
    current_shareholding_value,
  } = membershipRecord || {};

  // Effect for payment processing (Fixes the webhook race condition)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('session_id') || params.get('success')) {
      setIsCheckingPayment(true);

      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);

      router.refresh();

      const timer = setTimeout(() => {
        setIsCheckingPayment(false);
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, [router]);

  // Handlers
  const handleAcknowledge = async () => {
    try {
      setIsWorking(true);
      await acknowledgeDecision(membershipRecord.id);
    } catch (err) {
      console.error(err);
    } finally {
      setIsWorking(false);
    }
  };

  const handleSignAgreement = async (signatureName) => {
    try {
      setIsWorking(true);
      // This action now changes status to 'active' on the backend
      await signOperatingAgreement(membershipRecord.id, signatureName);
    } catch (err) {
      console.error('Failed to sign agreement:', err);
    } finally {
      setIsWorking(false);
    }
  };

  // -------------------------------------------------------------
  // CONDITIONAL RENDERING LOGIC (Strict 7-Step Logic)
  // -------------------------------------------------------------

  if (isCheckingPayment) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mb-4"></div>
        <p className="text-gray-600 font-medium">Verifying your payment...</p>
      </div>
    );
  }

  if (membershipRecord) {
    // 1. APPLIED STATE
    if (status === 'applied') {
      if (!application_fee_paid) {
        return <PaymentStep session={session} fee={fee} status={status} />;
      }
      return <ReviewStep session={session} />;
    }

    // 2. REVIEWING STATE
    if (status === 'reviewing') {
      return <ReviewStep session={session} />;
    }

    // 3. REJECTED STATE
    if (status === 'rejected') {
      return (
        <DecisionStep
          session={session}
          membershipRecord={membershipRecord}
          onAcknowledge={handleAcknowledge}
          isWorking={isWorking}
        />
      );
    }

    // 4. APPROVED STATE (Signature Stage Only)
    if (status === 'approved') {
      if (!readyForAgreement) {
        return (
          <DecisionStep
            session={session}
            membershipRecord={membershipRecord}
            onAcknowledge={() => setReadyForAgreement(true)}
            isWorking={false}
          />
        );
      }
      return (
        <AgreementStep onSign={handleSignAgreement} isWorking={isWorking} />
      );
    }

    // 5. ACTIVE STATE (Funding Stage Only)
    if (status === 'active') {
      return (
        <FundingStep session={session} membershipRecord={membershipRecord} />
      );
    }

    // 6. COMPLETED STATE (Fully Funded Core Opportunity)
    if (status === 'completed') {
      return <CompletionStep session={session} />;
    }
  }

  // -------------------------------------------------------------
  // INITIAL / NO RECORD VIEWS
  // -------------------------------------------------------------

  if (!membershipRecord && showForm && session?.user) {
    return (
      <div className="max-w-6xl mx-auto px-4 mb-20">
        <button
          onClick={() => setShowForm(false)}
          className="flex items-center gap-2 text-primary-600 font-semibold mb-8 hover:text-primary-800"
        >
          <ArrowLeftIcon className="h-5 w-5" /> Back to Roadmap
        </button>
        <MembershipForm session={session} />
      </div>
    );
  }

  return (
    <RoadmapView
      session={session}
      membershipRecord={membershipRecord}
      onStart={() => setShowForm(true)}
    />
  );
}
