'use client';

import RedemptionPaymentChoiceModal from './RedemptionPaymentChoiceModal';

export default function RedemptionApprovedModalWrapper({
  redemption, 
  ledger,
  createAction,
  manualAction,
}) {
  return (
    <RedemptionPaymentChoiceModal
      redemption={redemption} 
      ledger={ledger}
      createAction={createAction}
      manualAction={manualAction}
    />
  );
}
