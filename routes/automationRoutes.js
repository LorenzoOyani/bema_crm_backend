const express = require("express");
const router = express.Router();
const subscriberFieldService = require('../service/subscriberFieldService')
const templateService = require('../service/templateService')
const emailGateway = require('../service/emailGatewayService')
const emailLogService = require('../service/emailLogService')
const {applyTokens} = require("../service/emailGatewayService");


router.post('/run', async (req, res) => {
    try{
        const { email , templateName } = req.body;

        const subData = await subscriberFieldService.getSubscriberWithFieldsByEmail(email);
        if (!subData) {
            return res.status(400).json({error: 'Subscriber not found'})
        }

        const template = await templateService.getTemplate(templateName)
        if(!template) {
            return res.status(400).json({error: 'Template not found'})
        }

        const tokens = {
            ...subData.fields,
            name: subData.subscriber.name,
            email: subData.subscriber.email,
        };

        const subject = applyTokens(template.subject_template, tokens)
        const html = applyTokens(template.html_template, tokens)
        const text = applyTokens(template.text_template, tokens)



        const sendResult = await emailGateway.sendWelcomeEmail(
            subData.subscriber,
            tokens,
            { subject, html, text },

        );

        await emailLogService.logEmail({
            subscriberId: subData.subscriber.id,
            campaignId: templateName,
            templateName,
            status: sendResult.status,
            jsonResponse: sendResult.jsonResponse,

        })

        res.json({success: true})
    }catch(err){
        console.error('Automation error', err);
        res.status(500).json({error: 'Internal server error'})
    }
})



module.exports = router;