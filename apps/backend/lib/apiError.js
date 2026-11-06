const crypto = require('crypto');

/**
 * Standardized error response helper.
 *
 * Server side: logs the full error with a unique ID for support/debugging.
 * Client side: returns a generic message + errorId so the user can share it.
 *
 * Usage in a catch block:
 *   return sendError(res, err, 500);
 */
function sendError(res, err, status = 500) {
  const errorId = crypto.randomUUID();
  console.error(`[ERROR ${errorId}]`, err);
  res.status(status).json({
    success: false,
    message: 'Something went wrong. Please try again.',
    errorId,
  });
}

module.exports = { sendError };
