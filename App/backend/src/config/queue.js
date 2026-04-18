const Bull = require('bull');
const { isRedisAvailable } = require('./redis');

// Queue configurations
const queues = {
  email: null,
  report: null,
  notification: null,
  export: null,
};

/**
 * Initialize queues
 */
const initQueues = () => {
  if (!isRedisAvailable()) {
    console.warn('⚠️ Redis not available, background jobs disabled');
    return;
  }

  const redisConfig = {
    redis: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT) || 6379,
      password: process.env.REDIS_PASSWORD || undefined,
    },
  };

  queues.email = new Bull('email', redisConfig);
  queues.report = new Bull('report', redisConfig);
  queues.notification = new Bull('notification', redisConfig);
  queues.export = new Bull('export', redisConfig);

  // Email queue processor
  queues.email.process(async (job) => {
    const { to, subject, html, attachments } = job.data;
    const { getTransporter } = require('../services/emailService');
    
    const transporter = await getTransporter();
    await transporter.sendMail({
      from: '"Dental Clinic Portal" <noreply@dentalclinic.com>',
      to,
      subject,
      html,
      attachments,
    });
    
    return { sent: true, to };
  });

  // Report generation processor
  queues.report.process(async (job) => {
    const { type, clinicId, params, userId } = job.data;
    
    // Generate report based on type
    const report = await generateReport(type, clinicId, params);
    
    return { report, generatedAt: new Date() };
  });

  // Notification processor
  queues.notification.process(async (job) => {
    const { userId, clinicId, type, title, message, data } = job.data;
    
    await saveNotification(userId, clinicId, type, title, message, data);
    
    return { notified: true };
  });

  // Export processor
  queues.export.process(async (job) => {
    const { type, clinicId, format, filters, userId } = job.data;
    
    const exportData = await generateExport(type, clinicId, format, filters);
    
    return { exportData, generatedAt: new Date() };
  });

  console.log('✅ Background queues initialized');
};

/**
 * Add email job
 */
const queueEmail = async (emailData, options = {}) => {
  if (!queues.email) return null;
  
  return await queues.email.add(emailData, {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
    ...options,
  });
};

/**
 * Add report job
 */
const queueReport = async (reportData, options = {}) => {
  if (!queues.report) return null;
  
  return await queues.report.add(reportData, {
    attempts: 2,
    timeout: 60000, // 1 minute
    ...options,
  });
};

/**
 * Add notification job
 */
const queueNotification = async (notificationData, options = {}) => {
  if (!queues.notification) return null;
  
  return await queues.notification.add(notificationData, {
    attempts: 2,
    ...options,
  });
};

/**
 * Add export job
 */
const queueExport = async (exportData, options = {}) => {
  if (!queues.export) return null;
  
  return await queues.export.add(exportData, {
    attempts: 2,
    timeout: 120000, // 2 minutes
    ...options,
  });
};

/**
 * Get queue stats
 */
const getQueueStats = async () => {
  const stats = {};
  
  for (const [name, queue] of Object.entries(queues)) {
    if (queue) {
      stats[name] = {
        waiting: await queue.getWaitingCount(),
        active: await queue.getActiveCount(),
        completed: await queue.getCompletedCount(),
        failed: await queue.getFailedCount(),
        delayed: await queue.getDelayedCount(),
      };
    }
  }
  
  return stats;
};

// Helper functions
async function generateReport(type, clinicId, params) {
  // Implementation depends on report type
  return { type, clinicId, params, data: [] };
}

async function saveNotification(userId, clinicId, type, title, message, data) {
  const pool = require('../db/pool');
  await pool.query(
    `INSERT INTO notifications (user_id, clinic_id, type, title, message, data, is_read)
     VALUES ($1, $2, $3, $4, $5, $6, false)`,
    [userId, clinicId, type, title, message, JSON.stringify(data)]
  );
}

async function generateExport(type, clinicId, format, filters) {
  // Implementation depends on export type
  return { type, clinicId, format, filters, data: [] };
}

module.exports = {
  initQueues,
  queueEmail,
  queueReport,
  queueNotification,
  queueExport,
  getQueueStats,
};