const express = require('express');
const router = express.Router();
const templateService = require('../service/templateService')
const {applyTokens} = require("../service/emailGatewayService");

router.get('/ping', (req, res) => {
  res.json({ success: true });
});

/**
 * Preview a template with tokens applied
 * GET /api/templates/preview/:name?name=Daniel&BC_field_enrollment_status=pre_enrollment
 * */

/// use this route for test-purposes review,
// in production it will be replaced with dynamic names from db.

router.get('/preview/:name', async (req, res) => {
    try{
        const templateName = req.params.name;
        const tmpl = await templateService.getTemplate(templateName);

        if(!tmpl) {
            return res.status(404).json({error: 'Template not found'});
        }

        const tokens = {...req.query}

        const subject = applyTokens(tmpl.subject_template, tokens);
        const html = applyTokens(tmpl.html_template, tokens);
        const text = applyTokens(tmpl.text_template, tokens);


        return res.json({
            success: true,
            template_name: templateName,
            tokens,
            preview: {
                subject,
                html,
                text,
            },
            original: tmpl, /// for raw version where applicable.
        })
    }catch (err){
        console.error("Error: ",err);
        return res.status(500).json({error: 'Internal server error'});
    }
})


// router.get('/:name', async (req, res) => {
//     try {
//         const name = req.params.name;
//         const tmpl = await templateService.getTemplate(name);
//
//         if (!tmpl) {
//             return res.status(404).json({error: 'Template not found'});
//         }
//
//         return res.json({
//             success: true,
//             template: tmpl,
//         });
//     } catch (err) {
//         console.error(`Error getting template name with message: ${err.message} `);
//
//         return res.status(500).json({error: 'Internal server error'});
//     }
// });

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






module.exports = router;