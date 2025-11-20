const db = require('../api/db')


/**
 * Create an email log entry.
 *
 * @param {Object} params
 * @param {number} params.subscriberId
 * @param {string} [params.campaignId]
 * @param {string} params.templateName
 * @param {string} params.status
 * @param {Object} [params.jsonResponse]
 */
async function logEmail({subscriberId, campaignId, templateName, status, jsonResponse}) {
    const res = await db.query(
        `
            INSERT INTO email_logs (subscriber_id, campaign_id, template_name, status, raw_response)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *;
        `,
        [subscriberId || null, campaignId || null, templateName, status, jsonResponse || null]
    );

    return res.rows[0]
}

module.exports = {
    logEmail,
}