const db = require('../api/db')

async function createTemplate({ templateName, subject, html, text }) {
  const res = await db.query(
    `
      INSERT INTO email_templates (template_name, subject_template, html_template, text_template)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (template_name)
      DO UPDATE SET
         subject_template = EXCLUDED.subject_template,
         html_template = EXCLUDED.html_template,
         text_template = EXCLUDED.text_template,
         updated_at = NOW()
      RETURNING *;
    `,
    [templateName, subject, html, text]
  );

  return res.rows[0];
}

async function getTemplate(templateName) {
  const res = await db.query(
    `SELECT * FROM email_templates WHERE template_name = $1`,
    [templateName]
  );
  return res.rows[0];
}

module.exports = {
  createTemplate,
  getTemplate
};