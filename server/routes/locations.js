const express = require('express');
const db = require('../db');
const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT 
                l.id,
                l.name as location_name,
                w.name as warehouse_name
            FROM locations l
            JOIN warehouses w ON l.warehouse_id = w.id
            ORDER BY w.name ASC, l.name ASC
        `);
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching locations' });
    }
});

module.exports = router;
