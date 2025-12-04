const express = require('express');
const router = express.Router();
const { getEmailLogs } = require('../service/emailLogService')


router.get('/', async (req, res) => {
    try {
        const {subscriberId, campaignId, limit} = req.query;
        const logs = getEmailLogs({
            subscriberId: subscriberId ? Number(subscriberId) : undefined,
            campaignId: campaignId ? campaignId : undefined,
            limit: limit ? Number(limit) : 50,
        });


        res.json({
            success: true,
            count: logs.length,
            logs,
        });
    }catch(err) {
        console.error('Error retrieving email log', err);
        return res.status(500).json({
            success: false,
            error: 'Internal Server Error',
        })
    }
})

module.exports = router;