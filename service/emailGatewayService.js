require("dotenv").config();
const axios = require("axios");
const templateService = require('../service/templateService');

const MAILERSEND_API_KEY = process.env.MAILSEND_API_KEY;
const FROM_EMAIL = process.env.MAILSEND_FROM_EMAIL;
const FROM_NAME = process.env.MAILSEND_NAME|| 'Bema Music';


const DEFAULT_SUBJECT =
    process.env.WELCOME_SUBJECT || 'Welcome to Bema CORE, {{name}}!';
const DEFAULT_HTML =
    process.env.WELCOME_HTML ||
    '<p>Hi {{name}},</p><p>Thanks for joining Bema CORE with {{email}}.</p>';
const DEFAULT_TEXT =
    process.env.WELCOME_TEXT ||
    'Hi {{name}}, thanks for joining Bema CORE with {{email}}.';

function applyTokens(template, tokens) {
    if (!template) return '';
    return template.replace(/{{\s*(\w+)\s*}}/g, (_, key) => {
        return tokens[key] != null ? String(tokens[key]) : '';
    });
}

/**
 *
 * send a simple welcome email via MailSend
 *
 * @param {Object} subscriber - {id, name, email}
 * @param {Object} extraToken
 * @returns {Promise<{status: string, providerMessageId: null, jsonResponse: {status: number, data: any, headers: axios.RawAxiosResponseHeaders | (axios.RawAxiosResponseHeaders & AxiosHeaders)}}>}
 * */

async function sendWelcomeEmail(subscriber, extraToken = {}) {
    if (!MAILERSEND_API_KEY) {
        console.warn('MAILERSEND_API_KEY not set; skipping email send.')

        return {
            status: 'skipped, no api key',
            response: {message: 'No API key found, email not sent'}
        }

    }
    const tokens = {
        name: subscriber.name || 'AnonymousSubscriber',
        email: subscriber.email,
        ...extraToken
    };
    const subject = applyTokens(DEFAULT_SUBJECT, tokens);
    const html = applyTokens(DEFAULT_HTML, tokens);
    const text = applyTokens(DEFAULT_TEXT, tokens);

    const payload = {
        from: {
            email: FROM_EMAIL,
            name: FROM_NAME
        },
        to: [
            {
                email: subscriber.email,
                name: subscriber.name || ''
            },
        ],
        subject,
        text,
        html,
    };

    try {
        const response = await axios.post('https://api.mailersend.com/v1/email', payload, {
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${MAILERSEND_API_KEY}`
            },
        });

        const providerMessageId = response.headers['x-message-id'] || null;

        return {
            status: 'sent',
            providerMessageId,
            jsonResponse: {
                status: response.status,
                data: response.data,
                headers: response.headers
            }
        }
    } catch (err) {
        console.log('Error sending MailerSend email:', err.response?.data)
        return {
            status: 'failed',
            jsonResponse: {
                message: err.message,
                status: err.response?.status,
                data: err.response?.data,
            },
        };
    }

}

/**
 * Send an email using a stored template (email_templates table).
 *
 * @param {Object} subscriberCtx - object from getSubscriberGlobalContext()
 * @param {string} templateName - name in email_templates.template_name
 */

async function sendTemplatedEmail(subscriberCtx, templateName) {
    if (!MAILERSEND_API_KEY) {
        console.warn('MAILERSEND_API_KEY not set; skipping');


        return {
            status: 'skipped, no api key',
            response: {
                message: 'No API key found, email not sent'
            },
        };

    }

    const templ = await templateService.getTemplate(templateName);
    if (!templ) {
        throw new Error(`Template not found: ${templateName}`);
    }

    const tokens = {
        name: subscriberCtx.name || 'AnonymousSubscriber',
        email: subscriberCtx.email,

        BC_field_enrollment_status: subscriberCtx.BC_field_enrollment_status,
        BC_field_contrib_sum: subscriberCtx.BC_field_contrib_sum,
        BC_field_ref_verified: subscriberCtx.BC_field_ref_verified,
        BC_field_ref_level: subscriberCtx.BC_field_ref_level,

        campaign_group: subscriberCtx.campaign_group,
        campaign_id: subscriberCtx.campaign_id,
    };

    const subject = applyTokens(templ.subject_template, tokens);
    const html = applyTokens(templ.html_template, tokens);
    const text = templ.text_template ? applyTokens(templ.text_template, tokens) : '';

    const payload = {
        from: {
            email: FROM_EMAIL,
            name: FROM_NAME
        },

        to: [
            {
                email: subscriberCtx.email,
                name: subscriberCtx.name || ''
            },
        ],
        subject,
        text,
        html,
    };

    try {
        const response = await axios.post(
            'https://api.mailersend.com/v1/email',
            payload,
            {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${MAILERSEND_API_KEY}`,
                },
            }
        );

        const providerId = response.headers['x-message-id'] || null;
        return {
            status: 'sent',
            providerId,
            jsonResponse: {
                status: response.status,
                data: response.data,
                headers: response.headers
            },
        };
    }catch (error) {
        console.log('Error sending MailerSend email:', error.response?.data);
        return {
            status: 'failed',
            jsonResponse: {
                message: error.response?.data,
                status: error.response?.status,
                data: error.response?.data,
            }
        }
    }
}

module.exports = {
    sendWelcomeEmail,
    applyTokens,
    sendTemplatedEmail,
}

