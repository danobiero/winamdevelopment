'use client';

import { useState, useEffect } from 'react';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

// Extracted Step Components
import ReviewStep from './ReviewStep';
import DecisionStep from './DecisionStep';
import AgreementStep from './AgreementStep';
import CompletionStep from './CompletionStep';

// Existing Components
import FundingStep from '@/app/_components/FundingStep';
import MembershipForm from '@/app/_components/MembershipForm';
import PaymentStep from '@/app/_components/PaymentStep';
import RoadmapView from './RoadmapView'; // You can move the main list logic here too

import {
  acknowledgeDecision,
  signOperatingAgreement,
} from '@/app/_lib/actions';

export default function BecomingAMember({ session, membershipRecord, fee }) {
  const [showForm, setShowForm] = useState(false);
  const [isWorking, setIsWorking] = useState(false);

  const status = membershipRecord?.status;

  // Effect for payment processing
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('session_id') && params.get('success') === 'true') {
      fetch(`/api/record-payment/?session_id=${params.get('session_id')}`);
    }
  }, []);

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

  const handleSignAgreement = async () => {
    try {
      setIsWorking(true);
      await signOperatingAgreement(membershipRecord.id);
    } catch (err) {
      console.error(err);
    } finally {
      setIsWorking(false);
    }
  };

  // Conditional Rendering Logic
  if (status === 'applied')
    return <PaymentStep session={session} fee={fee} status={status} />;
  if (status === 'pending_review') return <ReviewStep session={session} />;
  if (status === 'not_approved')
    return (
      <DecisionStep
        session={session}
        membershipRecord={membershipRecord}
        onAcknowledge={handleAcknowledge}
        isWorking={isWorking}
      />
    );
  if (status === 'approved')
    return <AgreementStep onSign={handleSignAgreement} isWorking={isWorking} />;
  if (status === 'active')
    return (
      <FundingStep session={session} membershipRecord={membershipRecord} />
    );
  if (status === 'completed') return <CompletionStep session={session} />;

  // Initial Form View
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

  // Default Roadmap View
  return (
    <RoadmapView
      session={session}
      membershipRecord={membershipRecord}
      onStart={() => setShowForm(true)}
    />
  );
}
