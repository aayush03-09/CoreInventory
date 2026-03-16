const express = require('express');
const db = require('../db');
const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT 
                o.*, 
                IFNULL(SUM(sm.quantity), 0) as total_quantity 
            FROM operations o 
            LEFT JOIN stock_moves sm ON o.id = sm.operation_id 
            GROUP BY o.id 
            ORDER BY o.created_at DESC
        `);
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching operations' });
    }
});

router.post('/', async (req, res) => {
    const { operation_type, contact, source_location_id, dest_location_id, scheduled_date, products } = req.body;

    if (!operation_type || !products || products.length === 0) {
        return res.status(400).json({ message: 'Operation type and products are required.' });
    }

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        // Generate Reference WH/<TYPE>/000X
        const [refRows] = await connection.query('SELECT COUNT(*) as count FROM operations');
        const count = refRows[0].count + 1;
        const prefix = operation_type === 'receipt' ? 'IN' : operation_type === 'delivery' ? 'OUT' : 'INT';
        const reference = `WH/${prefix}/${count.toString().padStart(4, '0')}`;

        const [opResult] = await connection.query(
            'INSERT INTO operations (reference, operation_type, contact, source_location_id, dest_location_id, scheduled_date, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [reference, operation_type, contact, source_location_id, dest_location_id, scheduled_date, 'draft']
        );
        const operation_id = opResult.insertId;

        for (let p of products) {
            await connection.query(
                'INSERT INTO stock_moves (operation_id, product_id, quantity, price, status) VALUES (?, ?, ?, ?, ?)',
                [operation_id, p.product_id, p.quantity, p.price || 0, 'draft']
            );
        }

        await connection.commit();
        res.json({ id: operation_id, reference });
    } catch (error) {
        await connection.rollback();
        console.error(error);
        res.status(500).json({ message: 'Error creating operation' });
    } finally {
        connection.release();
    }
});

router.put('/:id/status', async (req, res) => {
    const { status } = req.body;
    if (status !== 'done') {
        return res.status(400).json({ message: 'Can only update status to done for now.' });
    }

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        
        await connection.query('UPDATE operations SET status = ? WHERE id = ?', [status, req.params.id]);
        await connection.query('UPDATE stock_moves SET status = ? WHERE operation_id = ?', [status, req.params.id]);

        await connection.commit();
        res.json({ message: 'Operation marked as done.' });
    } catch (error) {
        await connection.rollback();
        console.error(error);
        res.status(500).json({ message: 'Error updating operation status.' });
    } finally {
        connection.release();
    }
});

module.exports = router;
