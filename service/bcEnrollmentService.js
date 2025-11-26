const db = require('../api/db');
const {validateEmailWithZod} = require('../validator/validation')
const {upsertCampaignParticipation} = require('../service/campaignParticipationService');
const {ensureGlobalBCFields} = require("../service/bcFieldService");
const {upsertBCGlobalFields} = require("./bcFieldService");


async function handlePreEnrollment({name, email, campaignId = '25_SOC'}) {
    const validEmail = validateEmailWithZod(email);

    await ensureGlobalBCFields(db);
    const client = await db.connect();

    try {
        await client.query('BEGIN');

        const subscriber = await (async () => {
            const result = await client.query(
                `
                    INSERT INTO subscriber (name, email, status, created_at)
                    VALUES ($1, $2, 'active', NOW())
                    ON CONFLICT (email)
                        DO UPDATE SET name       = EXCLUDED.name,
                                      updated_at = NOW()
                    RETURNING id, name, email, status, created_at, updated_at;
                `,
                [name || null, validEmail]
            );
            return result.rows[0];
        })();

        await upsertBCGlobalFields(
            subscriber.id,
            {
                BC_field_enrollment_status: 'pre_enrollment',
                BC_field_contrib_sum: 0,
                BC_field_ref_verified: 'no',
                BC_field_ref_level: 0,
            },
            client
        );

        /// campaign participation

        await upsertCampaignParticipation(
            subscriber.id,
            campaignId,
            'pre-enrollment',
            client
        );

        await client.query('COMMIT');
        return {subscriberId: subscriber.id, campaignId};

    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
}

/**
 * OPEN_ENROLMENT Flow
 * */

async function handleOpenEnrollment({
                                        subscriberId, campaignId = '25_SOC',
                                    }) {
    await ensureGlobalBCFields(db);

    const dbSub = await db.query(
        `SELECT id
         FROM subscriber
         WHERE id = $1
         LIMIT 1`,
        [subscriberId]
    );

    if (!dbSub.rows[0]) {
        const err = new Error(`subscriber ${subscriberId} not found`)
        err.code = 'SUBSCRIBER_NOT_FOUND';
        throw err;
    }

    const client = await db.connect();

    try {
        await client.query('BEGIN')

        await upsertBCGlobalFields(
            subscriberId,
            {BC_field_enrollment_status: 'open_enrollment'},
            client
        );

        await upsertCampaignParticipation(
            subscriberId,
            campaignId,
            'open_enrollment',
            client
        );

        await client.query('COMMIT');
        return {subscriberId, campaignId};
    } catch (err) {
        await client.query('ROLLBACK');
        err.status = 404;
        err.message = err.message || 'Database compromise'
        throw err;
    } finally {
        client.release();
    }
}


module.exports = {
    handlePreEnrollment,
    handleOpenEnrollment
}