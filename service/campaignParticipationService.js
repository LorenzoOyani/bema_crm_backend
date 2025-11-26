const db = require('../api/db')

async function upsertCampaignParticipation(subscriberId, campaignId, campaignGroup, client = db){
    await client.query(
         `
    INSERT INTO subscriber_campaign_participation (subscriber_id, campaign_id, campaign_group)
    VALUES ($1, $2, $3)
    ON CONFLICT (subscriber_id, campaign_id)
    DO UPDATE SET
      campaign_group = EXCLUDED.campaign_group,
      updated_at = NOW();
    `,
    [subscriberId, campaignId, campaignGroup]
    )
}


async function getCampaignParticipation(subscriberId, campaignId, client = db) {
  const res = await client.query(
    `
    SELECT subscriber_id, campaign_id, campaign_group
    FROM subscriber_campaign_participation
    WHERE subscriber_id = $1
      AND campaign_id = $2
    LIMIT 1;
    `,
    [subscriberId, campaignId]
  );
  return res.rows[0] || null;
}

module.exports = {
  upsertCampaignParticipation,
  getCampaignParticipation,
};