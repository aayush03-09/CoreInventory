const express = require('express');
const db = require('../db');
const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT 
                p.*,
                w.name as warehouse_name,
                l.name as location_name,
                IFNULL(sq.quantity, 0) as initial_stock,
                IFNULL(SUM(CASE WHEN o.operation_type = 'receipt' AND o.status = 'done' THEN sm.quantity ELSE 0 END), 0) as total_receipts,
                IFNULL(SUM(CASE WHEN o.operation_type = 'delivery' AND o.status = 'done' THEN sm.quantity ELSE 0 END), 0) as total_deliveries
            FROM products p
            LEFT JOIN stock_quants sq ON p.id = sq.product_id
            LEFT JOIN locations l ON sq.location_id = l.id
            LEFT JOIN warehouses w ON l.warehouse_id = w.id
            LEFT JOIN stock_moves sm ON p.id = sm.product_id
            LEFT JOIN operations o ON sm.operation_id = o.id
            GROUP BY p.id, sq.quantity, w.name, l.name
            ORDER BY p.name ASC
        `);

        const mapped = rows.map(r => ({
            ...r,
            available_stock: parseFloat(r.initial_stock) + parseFloat(r.total_receipts) - parseFloat(r.total_deliveries)
        }));

        res.json(mapped);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching products' });
    }
});

router.post('/', async (req, res) => {
    const { name, sku, category, unit_of_measure, unit_cost, initial_stock, location_id } = req.body;
    if (!name || !sku) return res.status(400).json({ message: 'Name and SKU are required' });

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        const [result] = await connection.query(
            'INSERT INTO products (name, sku, category, unit_of_measure, unit_cost) VALUES (?, ?, ?, ?, ?)',
            [name, sku, category, unit_of_measure, unit_cost || 0]
        );
        const productId = result.insertId;

        if (initial_stock && initial_stock > 0 && location_id) {
            await connection.query(
                'INSERT INTO stock_quants (product_id, location_id, quantity) VALUES (?, ?, ?)',
                [productId, location_id, initial_stock]
            );
        }

        await connection.commit();
        res.json({ id: productId, name, sku, category });
    } catch (error) {
        await connection.rollback();
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ message: 'Product SKU already exists' });
        }
        res.status(500).json({ message: 'Error adding product' });
    } finally {
        connection.release();
    }
});

module.exports = router;
