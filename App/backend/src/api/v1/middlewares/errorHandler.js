const { errorResponse } = require('../../../utils/responseHandler');
const { logSecurityEvent } = require('../../../utils/auditLogger');

/**
 * Global Error Handler Middleware
 */
const errorHandler = (err, req, res, next) => {
  // Log the error
  console.error('Error:', {
    name: err.name,
    message: err.message,
    statusCode: err.statusCode,
    path: req.path,
    method: req.method,
    ip: req.ip,
  });

  // Log security-related errors
  if (err.statusCode === 401 || err.statusCode === 403) {
    logSecurityEvent({
      user: req.user,
      eventType: err.statusCode === 401 ? 'AUTH_FAILURE' : 'ACCESS_DENIED',
      severity: 'warning',
      details: {
        path: req.path,
        method: req.method,
        error: err.message,
      },
      req,
    }).catch(() => {});
  }

  // Handle specific error types
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';

  return errorResponse(res, { message }, statusCode, err.errors || null);
};

module.exports = errorHandler;