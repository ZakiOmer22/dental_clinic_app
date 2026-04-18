const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const pool = require('../../../db/pool');
const { logAction, logSecurityEvent } = require('../../../../utils/auditLogger');

const webhookHandler = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  
  let event;
  
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  
  const { type, data } = event;
  
  console.log(`📨 Stripe webhook: ${type}`);
  
  try {
    switch (type) {
      case 'customer.subscription.created':
        await handleSubscriptionCreated(data.object);
        break;
        
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(data.object);
        break;
        
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(data.object);
        break;
        
      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(data.object);
        break;
        
      case 'invoice.payment_failed':
        await handlePaymentFailed(data.object);
        break;
        
      case 'customer.subscription.trial_will_end':
        await handleTrialEnding(data.object);
        break;
        
      default:
        console.log(`Unhandled event type: ${type}`);
    }
    
    res.json({ received: true });
  } catch (err) {
    console.error('Webhook processing error:', err);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
};

async function handleSubscriptionCreated(subscription) {
  const clinicId = subscription.metadata?.clinicId;
  if (!clinicId) return;
  
  await pool.query(
    `UPDATE clinic_subscriptions 
     SET stripe_subscription_id = $1,
         status = $2,
         current_period_start = to_timestamp($3),
         current_period_end = to_timestamp($4),
         updated_at = NOW()
     WHERE clinic_id = $5`,
    [
      subscription.id,
      subscription.status,
      subscription.current_period_start,
      subscription.current_period_end,
      clinicId,
    ]
  );
  
  await logSecurityEvent({
    user: null,
    eventType: 'SUBSCRIPTION_CREATED',
    severity: 'info',
    details: { clinicId, subscriptionId: subscription.id },
    req: { ip: 'stripe-webhook' },
  }).catch(() => {});
}

async function handleSubscriptionUpdated(subscription) {
  const clinicId = subscription.metadata?.clinicId;
  if (!clinicId) return;
  
  await pool.query(
    `UPDATE clinic_subscriptions 
     SET status = $1,
         current_period_start = to_timestamp($2),
         current_period_end = to_timestamp($3),
         cancel_at_period_end = $4,
         cancelled_at = CASE WHEN $5 THEN NOW() ELSE NULL END,
         updated_at = NOW()
     WHERE clinic_id = $6`,
    [
      subscription.status,
      subscription.current_period_start,
      subscription.current_period_end,
      subscription.cancel_at_period_end,
      subscription.cancel_at_period_end && !subscription.cancel_at,
      clinicId,
    ]
  );
}

async function handleSubscriptionDeleted(subscription) {
  const clinicId = subscription.metadata?.clinicId;
  if (!clinicId) return;
  
  await pool.query(
    `UPDATE clinic_subscriptions 
     SET status = 'cancelled',
         cancelled_at = NOW(),
         updated_at = NOW()
     WHERE clinic_id = $1`,
    [clinicId]
  );
}

async function handlePaymentSucceeded(invoice) {
  const subscriptionId = invoice.subscription;
  if (!subscriptionId) return;
  
  const { rows } = await pool.query(
    `SELECT clinic_id FROM clinic_subscriptions WHERE stripe_subscription_id = $1`,
    [subscriptionId]
  );
  
  if (!rows.length) return;
  
  const clinicId = rows[0].clinic_id;
  
  await pool.query(
    `INSERT INTO subscription_invoices 
     (clinic_id, stripe_invoice_id, stripe_invoice_number, stripe_invoice_url, 
      stripe_invoice_pdf, amount_due, amount_paid, currency, status, 
      billing_reason, period_start, period_end, paid_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, to_timestamp($11), to_timestamp($12), to_timestamp($13))
     ON CONFLICT (stripe_invoice_id) DO UPDATE SET
       status = EXCLUDED.status,
       amount_paid = EXCLUDED.amount_paid,
       paid_at = EXCLUDED.paid_at`,
    [
      clinicId,
      invoice.id,
      invoice.number,
      invoice.hosted_invoice_url,
      invoice.invoice_pdf,
      invoice.amount_due / 100,
      invoice.amount_paid / 100,
      invoice.currency,
      invoice.status,
      invoice.billing_reason,
      invoice.period_start,
      invoice.period_end,
      invoice.status === 'paid' ? Math.floor(Date.now() / 1000) : null,
    ]
  );
}

async function handlePaymentFailed(invoice) {
  const subscriptionId = invoice.subscription;
  if (!subscriptionId) return;
  
  const { rows } = await pool.query(
    `SELECT clinic_id FROM clinic_subscriptions WHERE stripe_subscription_id = $1`,
    [subscriptionId]
  );
  
  if (!rows.length) return;
  
  await pool.query(
    `UPDATE clinic_subscriptions SET status = 'past_due', updated_at = NOW() WHERE clinic_id = $1`,
    [rows[0].clinic_id]
  );
  
  await logSecurityEvent({
    user: null,
    eventType: 'PAYMENT_FAILED',
    severity: 'warning',
    details: { clinicId: rows[0].clinic_id, invoiceId: invoice.id },
    req: { ip: 'stripe-webhook' },
  }).catch(() => {});
}

async function handleTrialEnding(subscription) {
  const clinicId = subscription.metadata?.clinicId;
  if (!clinicId) return;
  
  // Send trial ending notification
  console.log(`Trial ending soon for clinic ${clinicId}`);
  
  await logSecurityEvent({
    user: null,
    eventType: 'TRIAL_ENDING',
    severity: 'info',
    details: { clinicId, trialEnd: subscription.trial_end },
    req: { ip: 'stripe-webhook' },
  }).catch(() => {});
}

module.exports = { webhookHandler };