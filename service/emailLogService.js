const db = require('../api/db')


/**
 * Create an email log entry.
 *
 * @param {Object} params
 * @param {number} params.subscriberId
 * @param {string} [params.campaignId]
 * @param {string} params.templateName
 * @param {string} params.status
 * @param {Object} [params.rawResponse]
 */
async function logEmail({subscriberId, campaignId, templateName, status, rawResponse}) {
    const res = await db.query(
        `
            INSERT INTO email_logs (subscriber_id, campaign_id, template_name, status, raw_response)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *;
        `,
        [subscriberId || null, campaignId || null, templateName, status, rawResponse || null]
    );

    return res.rows[0]
}


async function getEmailLogs({subscriberId, campaignId, limit = 50}) {
    const params = [];
    const where = [];


    let safeLimit = Number(limit) || 50;
    if (safeLimit < 1) safeLimit = 1;
    if (safeLimit > 200) safeLimit = 200;

    if (subscriberId != null) {
        params.push(Number(subscriberId));
        where.push(`subscriber_id=${params.length}`);
    }

    if (campaignId != null) {
        params.push(String(campaignId));
        where.push(`campaign_id=${params.length}`);
    }

    const where_sql = where.length ? `WHERE ${where.join('AND')}` : '';
    const limitIndex = params.length + 1;

    const res = await db.query(
        `SELECT id,
                subscriber_id,
                campaign_id,
                template_name,
                status,
                sent_at
         FROM email_logs ${where_sql}
         ORDER BY sent_at DESC
         LIMIT ${limitIndex}

        `,
        params
    );

    return res.rows;
}

module.exports = {
    logEmail,
    getEmailLogs
}