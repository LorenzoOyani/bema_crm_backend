const db = require('../api/db')


/**
 * Find a custom field by name.
 */
async function getFieldByName(fieldName) {
  const res = await db.query(
    'SELECT * FROM custom_fields WHERE field_name = $1',
    [fieldName]
  );
  return res.rows[0] || null;
}


/**
 * Create or update a custom field by name.
 */
async function updateField({ fieldName, fieldType = 'text', defaultValue = null }) {
  const res = await db.query(
    `
      INSERT INTO custom_fields (field_name, field_type, default_value)
      VALUES ($1, $2, $3)
      ON CONFLICT (field_name)
      DO UPDATE SET
        field_type = EXCLUDED.field_type,
        default_value = EXCLUDED.default_value
      RETURNING *;
    `,
    [fieldName, fieldType, defaultValue]
  );
  return res.rows[0];
}

module.exports = {
  getFieldByName,
  updateField,
};