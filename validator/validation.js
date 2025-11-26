// validator/validation.js
const {z} = require('zod');

// Basic email schema
const emailSchema = z
    .string()
    .min(5, 'Email is too short')
    .email('Email address is invalid');

/**
 * Throws a ZodError if invalid.
 * Use it inside try/catch in your routes.
 */
function validateEmailWithZod(email) {
    const result = emailSchema.safeParse(email);
    if (!result.success) {
        const msg = result.error.errors[0]?.message || 'Invalid email;'
        throw new Error(msg);
    }
    return result.data.trim().toLowerCase();
}

module.exports = {
    emailSchema,
    validateEmailWithZod,
};
