/**
 * Send a standardized success response
 * @param {object} res - Express response object
 * @param {any} data - Payload to send
 * @param {number} statusCode - HTTP status code (default 200)
 * @param {object} extras - Optional extra fields (e.g. pagination)
 */
export const sendSuccess = (res, data, statusCode = 200, extras = {}) => {
  return res.status(statusCode).json({
    success: true,
    data,
    ...extras,
  });
};

/**
 * Send a standardized error response
 * @param {object} res - Express response object
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code (default 400)
 * @param {array} errors - Optional validation errors array
 */
export const sendError = (res, message, statusCode = 400, errors = null) => {
  const body = { success: false, message };
  if (errors) body.errors = errors;
  return res.status(statusCode).json(body);
};
