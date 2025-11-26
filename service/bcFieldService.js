const db = require('../api/db')

const customFieldService = require('../service/customFieldService')

const BC_GLOBAL_FIELDS = [
    {fieldName: 'BC_field_enrollment_status', fieldType: 'text', defaultValue: 'none'},
    {fieldName: 'BC_field_contrib_sum', fieldType: 'int', defaultValue: '0'},
    {fieldName: 'BC_field_ref_verified', fieldType: 'text', defaultValue: 'no'},
    {fieldName: 'BC_field_ref_level', fieldType: 'int', defaultValue: '0'},
];


/**
 * Idempotently ensures all BC global fields exist.
 * */

async function ensureGlobalBCFields(client = db) {
    for (const field of BC_GLOBAL_FIELDS) {
        await customFieldService.updateField({
            fieldName: field.fieldName,
            fieldType: field.fieldType,
            defaultValue: field.defaultValue,
        });
    }
}

async function upsertBCGlobalFields(subscriberId, values, client = db) {
    const fieldNames = Object.keys(values);

    const res = await client.query(
        `
            SELECT id, field_name
            FROM custom_fields
            WHERE field_name = ANY ($1::text[])
        `,
        [fieldNames]
    );

    const idByName = {};
    for (const row of res.rows) {
        idByName[row.field_name] = row.id;
    }

    for (const [field_name, rawValue] of Object.entries(values)) {
        const fieldId = idByName[field_name];
        if (!fieldId) {
            throw new Error(`Missing custom_fields definition for ${fieldNames}`);
        }
        await client.query(
            `
                INSERT INTO subscriber_custom_field_values (subscriber_id, field_id, field_value)
                VALUES ($1, $2, $3)
                ON CONFLICT (subscriber_id, field_id)
                    DO UPDATE SET field_value = EXCLUDED.field_value;
            `,
            [subscriberId, fieldId, rawValue != null ? String(rawValue) : null]
        );
    }
}



module.exports = {
    ensureGlobalBCFields,
    upsertBCGlobalFields,
    BC_GLOBAL_FIELDS,
}
