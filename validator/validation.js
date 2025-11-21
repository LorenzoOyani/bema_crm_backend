// validator/validation.js
const { z } = require('zod');

// Basic email schema
const emailSchema = z.string().email();

/**
 * Throws a ZodError if invalid.
 * Use it inside try/catch in your routes.
 */
function validateEmailWithZod(email) {
  return emailSchema.parse(email);
}

module.exports = {
  validateEmailWithZod,
};
