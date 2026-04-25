const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const pool = require('../db/pool');

class StripeService {
  /**
   * Create or get Stripe customer
   */
  async getOrCreateCustomer(clinicId, email, name) {
    const { rows } = await pool.query(
      `SELECT stripe_customer_id FROM clinic_subscriptions WHERE clinic_id = $1`,
      [clinicId]
    );
    
    if (rows.length && rows[0].stripe_customer_id) {
      return rows[0].stripe_customer_id;
    }
    
    const customer = await stripe.customers.create({
      email,
      name,
      metadata: { clinicId },
    });
    
    await pool.query(
      `UPDATE clinic_subscriptions SET stripe_customer_id = $1 WHERE clinic_id = $2`,
      [customer.id, clinicId]
    );
    
    return customer.id;
  }

  /**
   * Create checkout session
   */
  async createCheckoutSession(clinicId, planCode, successUrl, cancelUrl) {
    const { rows: planRows } = await pool.query(
      `SELECT * FROM subscription_plans WHERE code = $1`,
      [planCode]
    );
    
    if (!planRows.length) {
      throw new Error('Plan not found');
    }
    
    const plan = planRows[0];
    
    const { rows: clinicRows } = await pool.query(
      `SELECT name, email FROM clinics WHERE id = $1`,
      [clinicId]
    );
    
    const clinic = clinicRows[0];
    const customerId = await this.getOrCreateCustomer(clinicId, clinic.email, clinic.name);
    
    // Create or get Stripe price
    let priceId;
    if (!plan.stripe_price_id) {
      const price = await stripe.prices.create({
        unit_amount: Math.round(plan.price_monthly * 100),
        currency: 'usd',
        recurring: { interval: 'month' },
        product_data: { name: `${plan.name} Plan` },
      });
      priceId = price.id;
      
      await pool.query(
        `UPDATE subscription_plans SET stripe_price_id = $1 WHERE id = $2`,
        [priceId, plan.id]
      );
    } else {
      priceId = plan.stripe_price_id;
    }
    
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      subscription_data: {
        trial_period_days: 14,
        metadata: { clinicId, planCode },
      },
      allow_promotion_codes: true,
      billing_address_collection: 'required',
    });
    
    return { sessionId: session.id, url: session.url };
  }

  /**
   * Create billing portal session
   */
  async createBillingPortalSession(clinicId, returnUrl) {
    const { rows } = await pool.query(
      `SELECT stripe_customer_id FROM clinic_subscriptions WHERE clinic_id = $1`,
      [clinicId]
    );
    
    if (!rows.length || !rows[0].stripe_customer_id) {
      throw new Error('No Stripe customer found');
    }
    
    const session = await stripe.billingPortal.sessions.create({
      customer: rows[0].stripe_customer_id,
      return_url: returnUrl,
    });
    
    return session.url;
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(clinicId, cancelImmediately = false) {
    const { rows } = await pool.query(
      `SELECT stripe_subscription_id FROM clinic_subscriptions WHERE clinic_id = $1`,
      [clinicId]
    );
    
    if (!rows.length || !rows[0].stripe_subscription_id) {
      throw new Error('No active subscription found');
    }
    
    if (cancelImmediately) {
      await stripe.subscriptions.cancel(rows[0].stripe_subscription_id);
    } else {
      await stripe.subscriptions.update(rows[0].stripe_subscription_id, {
        cancel_at_period_end: true,
      });
    }
    
    await pool.query(
      `UPDATE clinic_subscriptions 
       SET cancel_at_period_end = $1, 
           cancelled_at = CASE WHEN $1 THEN NOW() ELSE NULL END,
           updated_at = NOW()
       WHERE clinic_id = $2`,
      [cancelImmediately, clinicId]
    );
    
    return true;
  }

  /**
   * Get subscription status
   */
  async getSubscriptionStatus(clinicId) {
    const { rows } = await pool.query(
      `SELECT cs.*, sp.name as plan_name, sp.features, sp.limits
       FROM clinic_subscriptions cs
       JOIN subscription_plans sp ON cs.plan_id = sp.id
       WHERE cs.clinic_id = $1`,
      [clinicId]
    );
    
    if (!rows.length) {
      return { hasSubscription: false };
    }
    
    const subscription = rows[0];
    
    return {
      hasSubscription: true,
      plan: subscription.plan_name,
      status: subscription.status,
      trialEnd: subscription.trial_end_date,
      currentPeriodEnd: subscription.current_period_end,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      features: subscription.features,
      limits: subscription.limits,
    };
  }

  /**
   * Get upcoming invoice
   */
  async getUpcomingInvoice(clinicId) {
    const { rows } = await pool.query(
      `SELECT stripe_customer_id FROM clinic_subscriptions WHERE clinic_id = $1`,
      [clinicId]
    );
    
    if (!rows.length || !rows[0].stripe_customer_id) {
      return null;
    }
    
    try {
      const invoice = await stripe.invoices.retrieveUpcoming({
        customer: rows[0].stripe_customer_id,
      });
      return invoice;
    } catch (err) {
      return null;
    }
  }

  /**
   * Get payment methods
   */
  async getPaymentMethods(clinicId) {
    const { rows } = await pool.query(
      `SELECT stripe_customer_id FROM clinic_subscriptions WHERE clinic_id = $1`,
      [clinicId]
    );
    
    if (!rows.length || !rows[0].stripe_customer_id) {
      return [];
    }
    
    const methods = await stripe.paymentMethods.list({
      customer: rows[0].stripe_customer_id,
      type: 'card',
    });
    
    return methods.data;
  }
}

module.exports = new StripeService();