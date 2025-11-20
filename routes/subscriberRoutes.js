const express = require('express');

const router = express.Router();

const subscriberService = require('../service/subscriberService')
const emailGateway = require('../service/emailGatewayService')
const emailService = require('../service/emailLogService')


router.post('/updateSubscribers', async (req, res) => {
    try {
        const {name, email, status} = req.body;

        if (!email) {
            return res.status(400).send({error: "Email is required"});

        }

        /// update subscriber table in database
        const subscriber = await subscriberService.createSubscribers({name, email, status});

        const emailResult = await emailGateway.sendWelcomeEmail(subscriber);

        /// log the email send result object

        await emailService.logEmail({
            subscriberId: subscriber.id,
            campaignId: 'infra_0',
            templateName: 'welcome_subscriber',
            status: emailResult.status,
            jsonResponse: emailResult.jsonResponse,
        });

        res.json({
            subscriber,
            email: {
                status: emailResult.status,
            },
        });



    }catch (err){
        console.error("Error updating a subscriber", err);
        res.status(500).json({error: 'Internal server error'})
    }
});

// GET all subscribers
router.get('/', async (req, res) => {
    try {
        const subscribers = await subscriberService.getAllSubscribers();
        res.json({
            success: true,
            count: subscribers.length,
            data: subscribers
        });
    } catch (err) {
        console.error("Error fetching subscribers:", err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET single subscriber by ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const subscriber = await subscriberService.getSubscriberById(id);

        if (!subscriber) {
            return res.status(404).json({ error: 'Subscriber not found' });
        }

        res.json({
            success: true,
            data: subscriber
        });
    } catch (err) {
        console.error("Error fetching subscriber:", err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
