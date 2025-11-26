const db = require('../api/db')

const subscriberService = require('../service/subscriberService')
const customFieldService = require('../service/customFieldService')
const {validateEmailWithZod} = require('../validator/validation');


async function subscriberExistByEmail({name, email, status = 'active'}) {
    return await subscriberService.createSubscribers({name, email, status})
}


function validate(email) {
    if (typeof email !== 'string') {
        throw new Error('email must be a string!')
    }
    const emailValue = email.trim().toLowerCase();
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!re.test(emailValue)) {
        throw new Error("Email address is invalid!")
    }
    return true
}


/**
 * Set multiple custom fields for a subscriber by email.
 *
 * payload = {
 *   name?: string,
 *   email: string,
 *   status?: string,
 *   fields: {
 *     BC_field_enrollment_status: "pre-open",
 *     BC_field_contrib_sum: 5000
 *   }
 * }
 */

async function setSubscriberFields(payload) {
    const {name, email, status, fields} = payload /// comprise subscriber and its field.

    // validateEmailWithZod(email);
    validate(email)

    if (!fields || typeof fields !== 'object') {
        throw new Error('fields object is required!')
    }

    const subscribers = await subscriberExistByEmail({name, email, status})

    for (const [fieldName, fieldRawValue] of Object.entries(fields)) {
        const field = await customFieldService.updateField(
            {
                fieldName,
                fieldType: 'text',
                defaultValue: null,
            }
        );
        await db.query(
            `
                INSERT INTO subscriber_custom_field_values (subscriber_id, field_id, field_value)
                VALUES ($1, $2, $3)
                ON CONFLICT (subscriber_id, field_id)
                    DO UPDATE SET field_value = EXCLUDED.field_value;
            `,
            [subscribers.id, field.id, fieldRawValue != null ? String(fieldRawValue) : null]
        )

    }
    return subscribers
}


/**
 * FETCH SUBSCRIBER + FIELDS BY EMAIL
 */

async function getSubscriberWithFieldsByEmail(email) {

    // const validEmailString = validateEmailWithZod(email);
    // const  validateEmail = validateEmailWithZod(email)

    if (!email || typeof email !== 'string') {
        throw new Error('email object is required!')
    }
    const dbSubscriber = await db.query(
        'SELECT * FROM subscriber WHERE email = $1',
        [email]
    )

    const subscriber = dbSubscriber.rows[0];
    if (!subscriber) {
        throw new Error('subscriber not found!')
    }

    const resFields = await db.query(
        `
            SELECT cf.field_name, scfv.field_value
            FROM subscriber_custom_field_values scfv
            JOIN custom_fields cf ON scfv.field_id = cf.id
            WHERE scfv.subscriber_id = $1
            ORDER BY cf.field_name;
        `,
        [subscriber.id]
    );

    const fields = {};

    for (const row of resFields.rows) {
        fields[row.field_name] = row.field_value
    }

    return {
        subscriber,
        fields,
    }
}

module.exports = {
    setSubscriberFields,
    getSubscriberWithFieldsByEmail,
}