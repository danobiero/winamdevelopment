'use client';

import RefundPaymentChoiceModal from './RefundPaymentChoiceModal';
//import { createStripeRefundAction } from './refund-actions';

export default function RefundApprovedModalWrapper({ refund, ledger,createAction }) {
  return (
    <RefundPaymentChoiceModal
      refund={refund}
      ledger={ledger}
      createAction={createAction}
    />
  );
}
