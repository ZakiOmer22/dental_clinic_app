const axios = require('axios');
const pool = require('../db/pool');

class EDahabService {
  constructor() {
    // eDahab API endpoints (update with actual production URLs)
    this.baseUrl = process.env.EDAHAB_API_URL || 'https://api.edahab.net/v1';
    this.paymentEndpoint = `${this.baseUrl}/payments`;
    this.verifyEndpoint = `${this.baseUrl}/payments/verify`;
  }

  /**
   * Get clinic's eDahab credentials
   */
  async getCredentials(clinicId) {
    const { rows } = await pool.query(
      `SELECT credentials FROM payment_gateways 
       WHERE clinic_id = $1 AND gateway = 'edahab' AND is_active = true`,
      [clinicId]
    );
    
    if (!rows.length) {
      throw new Error('eDahab not configured for this clinic');
    }
    
    return rows[0].credentials;
  }

  /**
   * Create payment request
   */
  async createPayment(clinicId, amount, phoneNumber, description, orderId) {
    const creds = await this.getCredentials(clinicId);
    const { merchantId, apiKey } = creds;

    const payload = {
      merchantId,
      amount,
      currency: 'USD',
      phoneNumber,
      description,
      orderId: orderId || `INV-${Date.now()}`,
      returnUrl: `${process.env.FRONTEND_URL}/payment/callback`,
      webhookUrl: `${process.env.API_URL}/api/v1/webhooks/edahab`,
    };

    try {
      const response = await axios.post(this.paymentEndpoint, payload, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      // Store transaction
      await this.storeTransaction(clinicId, response.data);

      return response.data;
    } catch (err) {
      console.error('eDahab payment error:', err.response?.data || err.message);
      throw new Error(err.response?.data?.message || 'Payment initiation failed');
    }
  }

  /**
   * Verify payment status
   */
  async verifyPayment(clinicId, transactionId) {
    const creds = await this.getCredentials(clinicId);
    const { apiKey } = creds;

    try {
      const response = await axios.get(`${this.verifyEndpoint}/${transactionId}`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
      });

      // Update transaction status
      await this.updateTransaction(transactionId, response.data);

      return response.data;
    } catch (err) {
      console.error('eDahab verify error:', err.response?.data || err.message);
      throw new Error(err.response?.data?.message || 'Verification failed');
    }
  }

  /**
   * Store transaction in database
   */
  async storeTransaction(clinicId, data) {
    await pool.query(
      `INSERT INTO payment_transactions 
       (clinic_id, gateway, transaction_id, amount, currency, phone_number, status, raw_data)
       VALUES ($1, 'edahab', $2, $3, $4, $5, $6, $7)`,
      [clinicId, data.transactionId, data.amount, data.currency, data.phoneNumber, data.status, JSON.stringify(data)]
    );
  }

  /**
   * Update transaction status
   */
  async updateTransaction(transactionId, data) {
    await pool.query(
      `UPDATE payment_transactions 
       SET status = $1, raw_data = raw_data || $2, updated_at = NOW()
       WHERE transaction_id = $3`,
      [data.status, JSON.stringify(data), transactionId]
    );
  }

  /**
   * Process subscription payment via eDahab
   */
  async processSubscriptionPayment(clinicId, planId, phoneNumber) {
    const { rows: planRows } = await pool.query(
      `SELECT * FROM subscription_plans WHERE id = $1`,
      [planId]
    );
    
    const plan = planRows[0];
    
    return this.createPayment(
      clinicId,
      plan.price_monthly,
      phoneNumber,
      `Subscription: ${plan.name} Plan - Monthly`,
      `SUB-${clinicId}-${Date.now()}`
    );
  }
}

// Create payment_transactions table if not exists
const createTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS payment_transactions (
      id SERIAL PRIMARY KEY,
      clinic_id INT NOT NULL REFERENCES clinics(id),
      gateway VARCHAR(20) NOT NULL,
      transaction_id VARCHAR(100) UNIQUE,
      amount DECIMAL(10,2),
      currency VARCHAR(3) DEFAULT 'USD',
      phone_number VARCHAR(20),
      status VARCHAR(20) DEFAULT 'pending',
      raw_data JSONB,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `);
};

createTable().catch(console.error);

module.exports = new EDahabService();