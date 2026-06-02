const crypto = require('crypto');

const createDemoPaymentIntent = ({ amount, currency, metadata }) => {
  const fakeId = `pi_demo_${crypto.randomBytes(12).toString('hex')}`;
  return {
    id: fakeId,
    client_secret: `${fakeId}_secret_${crypto.randomBytes(8).toString('hex')}`,
    amount,
    currency,
    status: 'requires_payment_method',
    metadata
  };
};

const confirmDemoPayment = (paymentIntentId) => {
  return {
    id: paymentIntentId,
    status: 'succeeded',
    amount_received: 999900,
    metadata: {}
  };
};

const isDemoMode = () => process.env.DEMO_MODE === 'true';

module.exports = {
  createDemoPaymentIntent,
  confirmDemoPayment,
  isDemoMode
};
