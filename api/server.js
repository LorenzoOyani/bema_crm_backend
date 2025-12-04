require('dotenv').config();
const express = require("express");
const db = require("./db");

const subscriberRoutes = require("../routes/subscriberRoutes");
const templateRoutes = require('../routes/templateRoutes');
const automationRoutes = require('../routes/automationRoutes');
const emailLogRoutes = require('../routes/emailLogRoutes');
const flowLogsService = require("../service/flowlogService");

const app = express();

app.use(express.json());
app.use(express.urlencoded({extended: true}));

const PORT = process.env.PORT || 3000;

console.log("Booting Bema CRM backend...");


app.use('/api/email_logs', emailLogRoutes);

app.use('/api/subscribers', subscriberRoutes);

app.use('/api/templates', templateRoutes);

app.use('/api/automations', automationRoutes);


app.get('/', async (req, res) => {
    try {
        await db.testConnection();
        res.json({status: 'ok', service: 'Bema CRM backend', db: 'connected'});
    } catch (err) {
        console.error('Health check DB error:', err);
        res.status(500).json({status: 'error', message: 'DB connection failed'});
    }
});


/**
 * @typedef {Object} FlowLog
 * @property {number} id
 * @property {Object} payload
 * @property {string|null} note
 */

/**
 * @returns {Promise<FlowLog>}
 */

app.post('/api/test/flow_logs', async (req, res) => {
    try {
        const payload = req.body;
        const n8nFlowLogs = await flowLogsService.createFlowLog(payload, 'infra_phase_1_flow_to_flow');


        console.log("flow log created with id: ", n8nFlowLogs.id);


        return res.json({
            success: true,
            id: n8nFlowLogs.id,
            storedPayload: n8nFlowLogs.payload,
        });
    } catch (err) {
        console.error('Error creating flow log', err);
        return res.status(500).json({error: err.message});
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
