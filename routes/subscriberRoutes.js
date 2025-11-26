const express = require('express');

const router = express.Router();

const subscriberService = require('../service/subscriberService')
const emailGateway = require('../service/emailGatewayService')
const emailService = require('../service/emailLogService')
const subscriberFieldService = require('../service/subscriberFieldService')
const {validateEmailWithZod} = require('../validator/validation')


router.get('/ping', (req, res) => {
  res.json({ success: true });
});

router.post('/updateSubscribers', async (req, res) => {
    try {
        const {name, email, status} = req.body;

        if (!email) {
            return res.status(400).send({error: "Email is required"});

        }


        try {
            validateEmailWithZod(email);
        } catch (err) {
            console.error('Email validation failed (updateSubscribers):', err.message);
            return res.status(400).json({error: 'Invalid email format'});
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


    } catch (err) {
        console.error("Error updating a subscriber", err);
        res.status(500).json({error: 'Internal server error'})
    }
});


router.post('/updateFields', async (req, res) => {
    try {
        const {name, email, status, fields} = req.body;


        if (!email) {
            return res.status(400).json({error: 'Email is required'});
        }

        try {
            validateEmailWithZod(email);
        } catch (err) {
            console.error('Email validation failed (updateFields):', err.message);
            return res.status(400).json({error: 'Invalid email format'});
        }

        if (!fields || typeof fields !== 'object') {
            return res.status(400).json({error: 'fields object is required'});
        }
        await subscriberFieldService.setSubscriberFields({
            name,
            email,
            status,
            fields
        });

        const result = await subscriberFieldService.getSubscriberWithFieldsByEmail(email)

        return res.json({
            success: true,
            ...result

        })

    } catch (err) {
        console.error("Error updating a subscriber", err);
        return res.status(500).json({error: "Internal server error"})
    }
})


/**
 *
 * Get the subscriber with fields
 * **/

router.post('/withFields', async (req, res) => {
    try {
        const {email} = req.body;

        if (!email) {
            return res.status(400).json({error: 'Email is required'});
        }

        try {
            validateEmailWithZod(email);
        } catch (err) {
            console.error('Email validation failed (withFields):', err.message);
            return res.status(400).json({error: 'Invalid email format'});
        }

        const result = await subscriberFieldService.getSubscriberWithFieldsByEmail(email);

        if (!result) {
            return res.status(400).json({error: "Error 404!!, Subscriber not found"})
        }

        return res.json({
            success: true,
            ...result,
        });
    } catch (err) {
        console.error("Error updating a subscriber", err);
        return res.status(500).json({error: "Internal server error"})
    }


})

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
        res.status(500).json({error: 'Internal server error'});
    }
});

// GET single subscriber by ID
router.get('/:id', async (req, res) => {
    try {
        const {id} = req.params;
        const subscriber = await subscriberService.getSubscriberById(id);

        if (!subscriber) {
            return res.status(404).json({error: 'Subscriber not found'});
        }

        res.json({
            success: true,
            data: subscriber
        });
    } catch (err) {
        console.error("Error fetching subscriber:", err);
        res.status(500).json({error: 'Internal server error'});
    }
});




module.exports = router;
