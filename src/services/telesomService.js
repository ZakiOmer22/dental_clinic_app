const crypto = require('crypto');
const axios = require('axios');
const pool = require('../db/pool');

class TelesomService {
  constructor() {
    this.baseUrl = 'https://sms.mytelesom.com/index.php';
    this.smsEndpoint = `${this.baseUrl}/smsapi/v1/messages`;
    this.otpEndpoint = `${this.baseUrl}/smsotpapi/v1/messages`;
  }

  /**
   * Generate HMAC-SHA256 signature for Telesom
   * Formula: Base64(HMAC-SHA256(SenderID + Timestamp + Username + Password))
   */
  generateSignature(senderId, username, password) {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const data = senderId + today + username + password;
    const hmac = crypto.createHmac('sha256', password);
    hmac.update(data);
    return hmac.digest('base64');
  }

  /**
   * Get clinic's Telesom credentials
   */
  async getCredentials(clinicId) {
    const { rows } = await pool.query(
      `SELECT credentials FROM payment_gateways 
       WHERE clinic_id = $1 AND gateway = 'telesom' AND is_active = true`,
      [clinicId]
    );
    
    if (!rows.length) {
      throw new Error('Telesom not configured for this clinic');
    }
    
    return rows[0].credentials;
  }

  /**
   * Send SMS (Single or Bulk)
   */
  async sendSMS(clinicId, recipients, message, type = 'text', clientRef = null) {
    const creds = await this.getCredentials(clinicId);
    const { senderId, username, password } = creds;
    
    const signature = this.generateSignature(senderId, username, password);
    const timestamp = new Date().toISOString().split('T')[0];
    
    const payload = {
      to: Array.isArray(recipients) ? recipients : [recipients],
      message,
      type, // 'text' or 'unicode'
      client_ref: clientRef || `TLS-${Date.now()}`,
    };

    try {
      const response = await axios.post(this.smsEndpoint, payload, {
        headers: {
          'Content-Type': 'application/json',
          'SenderID': senderId,
          'X-Auth-Key': signature,
          'X-Timestamp': timestamp,
        },
      });

      // Log usage
      await this.logUsage(clinicId, recipients.length, response.data);

      return response.data;
    } catch (err) {
      console.error('Telesom SMS error:', err.response?.data || err.message);
      throw new Error(err.response?.data?.error || 'SMS sending failed');
    }
  }

  /**
   * Send OTP
   */
  async sendOTP(clinicId, recipient, otpCode, otpType = '6_digit', ttlSeconds = 600) {
    const creds = await this.getCredentials(clinicId);
    const { senderId, username, password } = creds;
    
    const signature = this.generateSignature(senderId, username, password);
    const timestamp = new Date().toISOString().split('T')[0];
    
    const payload = {
      to: [recipient],
      otp_type: otpType, // '4_digit', '6_digit', 'alphanumeric'
      template_code: otpCode,
      ttl_seconds: ttlSeconds,
    };

    try {
      const response = await axios.post(this.otpEndpoint, payload, {
        headers: {
          'Content-Type': 'application/json',
          'SenderID': senderId,
          'X-Auth-Key': signature,
          'X-Timestamp': timestamp,
        },
      });

      return response.data;
    } catch (err) {
      console.error('Telesom OTP error:', err.response?.data || err.message);
      throw new Error(err.response?.data?.error || 'OTP sending failed');
    }
  }

  /**
   * Send appointment reminder
   */
  async sendAppointmentReminder(clinicId, patientPhone, patientName, appointmentDate, appointmentTime) {
    const message = `Dear ${patientName}, reminder of your dental appointment on ${appointmentDate} at ${appointmentTime}. Reply YES to confirm or call us to reschedule.`;
    
    return this.sendSMS(clinicId, patientPhone, message, 'text');
  }

  /**
   * Send payment confirmation
   */
  async sendPaymentConfirmation(clinicId, patientPhone, amount, invoiceNumber) {
    const message = `Payment of $${amount} received for invoice #${invoiceNumber}. Thank you for choosing our dental clinic!`;
    
    return this.sendSMS(clinicId, patientPhone, message, 'text');
  }

  /**
   * Log SMS usage
   */
  async logUsage(clinicId, recipientCount, response) {
    await pool.query(
      `INSERT INTO clinic_usage (clinic_id, date, sms_sent_count)
       VALUES ($1, CURRENT_DATE, $2)
       ON CONFLICT (clinic_id, date) DO UPDATE SET
         sms_sent_count = clinic_usage.sms_sent_count + $2`,
      [clinicId, recipientCount]
    );
  }

  /**
   * Check balance
   */
  async checkBalance(clinicId) {
    // Note: Telesom doesn't provide a balance API directly
    // You would need to track credits manually or use their portal
    const { rows } = await pool.query(
      `SELECT SUM(sms_sent_count) as total_sent 
       FROM clinic_usage 
       WHERE clinic_id = $1 AND date >= DATE_TRUNC('month', CURRENT_DATE)`,
      [clinicId]
    );
    
    return {
      sentThisMonth: parseInt(rows[0]?.total_sent || 0),
      message: 'Contact Telesom support for exact balance',
      supportPhone: '+252633022420',
      supportEmail: 'support@telesom.com',
    };
  }
}

module.exports = new TelesomService();