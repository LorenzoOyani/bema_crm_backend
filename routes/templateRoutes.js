const express = require('express');
const router = express.Router();
const templateService = require('../service/templateService')


// POST /api/templates/save
router.post('/save', async (req, res) => {
    try {
        const {templateName, subject, html, text} = req.body;

        if (!templateName || !subject || !html) {
            return res.status(400).json({
                error: 'templateName, subject, and html are required',
            });
        }

        const tmpl = await templateService.createTemplate({
            templateName,
            subject,
            html,
            text: text || null,
        });

        return res.json({
            success: true,
            template: tmpl,
        });
    } catch (err) {
        console.error(`Error in service of ${err.message}`);
        return res.status(500).json({error: 'Internal server error'});
    }
});

router.get('/:name', async (req, res) => {
    try {
        const name = req.params.name;
        const tmpl = await templateService.getTemplate(name);

        if (!tmpl) {
            return res.status(404).json({error: 'Template not found'});
        }

        return res.json({
            success: true,
            template: tmpl,
        });
    } catch (err) {
        console.error(`Error getting template name with message: ${err.message} `);

        return res.status(500).json({error: 'Internal server error'});
    }
});


module.exports = router;