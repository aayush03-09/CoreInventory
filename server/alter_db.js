require('dotenv').config();
const db = require('./db');

async function alterTable() {
    try {
        console.log('Altering stock_moves table...');
        await db.query('ALTER TABLE stock_moves ADD COLUMN price DECIMAL(10, 2) DEFAULT 0.00');
        console.log('Successfully added price column!');
    } catch (err) {
        if (err.code === 'ER_DUP_FIELDNAME') {
            console.log('Column already exists.');
        } else {
            console.error(err);
        }
    } finally {
        process.exit();
    }
}

alterTable();
