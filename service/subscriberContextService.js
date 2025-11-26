const db = require('../api/db');

const {getCampaignParticipation} = require('../service/campaignParticipationService');

/**
 * targeted Returns for this flow campaign with fields
 *
 * {
 *       name, email,
 *     BC_field_enrollment_status,
 *     BC_field_contrib_sum,
 *     BC_field_ref_verified,
 *     BC_field_ref_level,
 *     campaign_group,
 *     campaign_id
 * }
 * */

async function getSubscriberGlobalContext(subscriberId, campaignId) {
    const resSub = await db.query(
        `
            SELECT id, name, email
            FROM subscriber
            WHERE id = $1
            LIMIT 1;
        `,
        [subscriberId]
    );

    const subscriber = resSub.rows[0];
    if (!subscriber) {
        const err = new Error('No subscriber found.');
        err.code = 'SUBSCRIPTION_FAILED';
        throw err;
    }

    /// GET THE EAV fields

    const resFields = await db.query(
        `
            SELECT cf.field_name, scfv.field_value
            FROM subscriber_custom_field_values scfv
            JOIN custom_fields cf ON scfv.field_id = cf.id
            WHERE scfv.subscriber_id = $1;
        `,
        [subscriberId]
    )

    const fields = {};
    for (const row of resFields.rows) {
        fields[row.field_name] = row.field_value;
    }


    /// campaign participation
    const participation = await getCampaignParticipation(subscriberId, campaignId);

    return {
        name: subscriber.name,
        email: subscriber.email,

        Bc_field_enrollment_status:
            fields.Bc_field_enrollment_status || 'none',
        BC_field_contrib_sum: Number(fields.BC_field_contrib_sum || 0),
        BC_field_ref_verified:
            fields.BC_field_ref_verified || 'no',
        BC_field_ref_level: Number(fields.BC_field_ref_level || 0),

        campaign_group: participation?.campaign_group || 'unknown',
        campaign_id: participation?.campaign_id || campaignId,

    }




}


module.exports = {
    getSubscriberGlobalContext,
}
