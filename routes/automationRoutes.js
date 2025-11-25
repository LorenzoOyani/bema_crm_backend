const express = require("express");
const router = express.Router();

const subscriberFieldService = require('../service/subscriberFieldService');
const templateService = require('../service/templateService');
const emailLogService = require('../service/emailLogService');
const {
  applyTokens,
  sendWelcomeEmail,
  sendTemplatedEmail,
} = require('../service/emailGatewayService');
const {
  handlePreEnrollment,
  handleOpenEnrollment,
} = require('../service/bcEnrollmentService');
const { createFlowLog } = require("../service/flowlogService");
const { getSubscriberGlobalContext } = require("../service/subscriberContextService");

/**
 * Simple ping route for health checks:
 * GET /api/automations/ping
 */
router.get('/ping', (req, res) => {
  res.json({ success: true, scope: 'automations' });
});

/**
 * Flow B helper: get merged context
 * GET /api/automations/context?subscriberId=1&campaignId=25_SOC
 */
router.get('/context', async (req, res) => {
  try {
    const { subscriberId, campaignId } = req.query;

    if (!subscriberId || !campaignId) {
      return res.status(400).json({
        success: false,
        error: 'subscriberId and campaignId are required',
      });
    }

    const ctx = await getSubscriberGlobalContext(
      Number(subscriberId),
      String(campaignId)
    );

    return res.json({
      success: true,
      context: ctx,
    });
  } catch (error) {
    console.error('Error in /context:', error);
    return res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * STEP 1 – Simulate BemaHub PRE_ENROLL event
 * POST /api/automations/pre-enroll
 * body: { name, email, campaign_id? }
 */
router.post('/pre-enroll', async (req, res) => {
  try {
    const { name, email, campaign_id } = req.body;

    const result = await handlePreEnrollment({
      name,
      email,
      campaignId: campaign_id || '25_SOC',
    });

    await createFlowLog(req.body, 'pre-enroll');

    return res.json({
      success: true,
      ...result,
    });
  } catch (err) {
    console.error('Error in /pre-enroll:', err);
    return res.status(400).json({
      success: false,
      error: err.message,
    });
  }
});

/**
 * STEP 4 – Open Enrollment event
 * POST /api/automations/open-enrollment
 * body: { subscriber_id, campaign_id? }
 */
router.post('/open-enrollment', async (req, res) => {
  try {
    const { subscriber_id, campaign_id } = req.body;

    const result = await handleOpenEnrollment({
      subscriberId: subscriber_id,
      campaignId: campaign_id || '25_SOC',
    });

    await createFlowLog(req.body, 'open-enrollment received');

    return res.json({
      success: true,
      ...result,
    });
  } catch (err) {
    console.error('Error in /open-enrollment:', err);
    return res.status(400).json({
      success: false,
      error: err.message,
    });
  }
});

/**
 * Utility test route:
 * POST /api/automations/run
 * body: { email, templateName }
 * Uses subscriber + fields to send a simple MailerSend email.
 */
router.post('/run', async (req, res) => {
  try {
    const { email, templateName } = req.body;

    const subData = await subscriberFieldService.getSubscriberWithFieldsByEmail(email);
    if (!subData) {
      return res.status(400).json({ error: 'Subscriber not found' });
    }

    const template = await templateService.getTemplate(templateName);
    if (!template) {
      return res.status(400).json({ error: 'Template not found' });
    }

    const tokens = {
      name: subData.subscriber.name,
      email: subData.subscriber.email,
      ...subData.fields,
    };

    // Apply tokens (mostly for debug; return values are not captured here)
    applyTokens(template.subject_template, tokens);
    applyTokens(template.html_template, tokens);
    applyTokens(template.text_template, tokens);

    const sendResult = await sendWelcomeEmail(
      subData.subscriber,
      tokens,
    );

    await emailLogService.logEmail({
      subscriberId: subData.subscriber.id,
      campaignId: templateName,
      templateName,
      status: sendResult.status,
      jsonResponse: sendResult.jsonResponse,
    });

    return res.json({ success: true });
  } catch (err) {
    console.error('Automation /run error', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Flow B + MailerSend – send correct email based on campaign_group
 * POST /api/automations/send-email
 * body: { subscriber_id, campaign_id, template_pre_enroll?, template_open_enroll? }
 */
router.post('/send-email', async (req, res) => {
  try {
    const {
      subscriber_id,
      campaign_id,
      template_pre_enroll = 'SOC_2025_PRE_ENROLL',
      template_open_enroll = 'SOC_2025_OPEN_ENROLL',
    } = req.body;

    const ctx = await getSubscriberGlobalContext(
      subscriber_id,
      campaign_id || '25_SOC'
    );

    // choose template based on campaign_group
    const templateName =
      ctx.campaign_group === 'pre_enrollment'
        ? template_pre_enroll
        : template_open_enroll;

    const emailResult = await sendTemplatedEmail(ctx, templateName);

    // log email
    await emailLogService.logEmail({
      subscriberId: subscriber_id,
      campaignId: ctx.campaign_id,
      templateName,
      status: emailResult.status,
      jsonResponse: emailResult.jsonResponse,
    });

    return res.json({
      success: true,
      campaign_group: ctx.campaign_group,
      email_status: emailResult.status,
    });
  } catch (err) {
    console.error('Error in /send-email:', err);
    return res.status(400).json({
      success: false,
      error: err.message,
    });
  }
});

module.exports = router;
