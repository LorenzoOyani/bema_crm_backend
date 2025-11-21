const db = require('../api/db')



async function createFlowLog(payload, note = null){
    const res = await db.query(

        `
        INSERT INTO flow_logs (payload, note)
        VALUES ($1, $2)
        RETURNING *;
        `,
        [payload, note]
    );
    return res.rows[0]
}

module.exports = {
    createFlowLog,
};