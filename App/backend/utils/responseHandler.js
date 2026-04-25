/**
 * Standardized API Response Formatter
 */

const statusCodes = {
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  VALIDATION_ERROR: 422,
  TOO_MANY_REQUESTS: 429,
  SERVER_ERROR: 500,
};

const successResponse = (res, data = null, message = 'Success', statusCode = 200, meta = {}) => {
  const response = {
    success: true,
    message,
    timestamp: new Date().toISOString(),
    version: 'v1',
  };

  if (data !== null) {
    response.data = data;
  }

  if (Object.keys(meta).length > 0) {
    response.meta = meta;
  }

  return res.status(statusCode).json(response);
};

const errorResponse = (res, error, statusCode = 500, details = null) => {
  const response = {
    success: false,
    error: error.message || error,
    timestamp: new Date().toISOString(),
    version: 'v1',
  };

  if (details) {
    response.details = details;
  }

  if (process.env.NODE_ENV === 'development') {
    response.stack = error.stack;
  }

  return res.status(statusCode).json(response);
};

const paginatedResponse = (res, data, page, limit, total) => {
  return successResponse(res, data, 'Success', 200, {
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1,
    },
  });
};

module.exports = {
  statusCodes,
  successResponse,
  errorResponse,
  paginatedResponse,
};