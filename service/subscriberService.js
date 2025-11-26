const db = require("../api/db");

async function createSubscribers(data) {
    const { email, name, status = "active" } = data;

    if (!email) {
        throw new Error("Email is required to create a subscriber.");
    }

    const query = `
        INSERT INTO subscriber (name, email, status, created_at)
        VALUES ($1, $2, $3, NOW())
        ON CONFLICT (email)
        DO UPDATE SET
            name = EXCLUDED.name,
            status = EXCLUDED.status,
            updated_at = NOW()
        RETURNING id, name, email, status, created_at, updated_at;
    `;

    const values = [name || null, email, status];

    const result = await db.query(query, values);
    return result.rows[0];
}

async function getAllSubscribers() {
    const query = `
        SELECT id, name, email, status, created_at, updated_at
        FROM subscriber
        ORDER BY created_at DESC;
    `;

    const result = await db.query(query);
    return result.rows;
}

async function getSubscriberById(id) {
    const query = `
        SELECT id, name, email, status, created_at, updated_at
        FROM subscriber
        WHERE id = $1;
    `;

    const result = await db.query(query, [id]);
    return result.rows[0];
}

module.exports = {
    createSubscribers,
    getAllSubscribers,
    getSubscriberById,
};
