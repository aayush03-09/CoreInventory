const express = require('express');
const db = require('../db');
const router = express.Router();

router.get('/kpis', async (req, res) => {
    try {
        const [productsResult] = await db.query('SELECT COUNT(*) as total FROM products');
        const totalProducts = productsResult[0].total;

        // Low stock: Calculate dynamically (Initial Stock vs Sold)
        // Instead of strict quants, logic requested: Compare initial stock vs receipts created.
        // If receipts > initial stock = Out of Stock (1 product out of stock). 
        // If close = Low Stock.
        // We can do this by summing all product's initial stock vs matching receipt quantities.
        let lowStockCount = 0;
        let outOfStockCount = 0;

        const [productStats] = await db.query(`
            SELECT 
                p.id, 
                p.name,
                IFNULL(p.unit_cost, 0) as purchased_amount,
                IFNULL(sq.quantity, 0) as initial_stock,
                IFNULL(SUM(CASE WHEN o.operation_type = 'receipt' AND o.status = 'done' THEN sm.quantity ELSE 0 END), 0) as total_receipts,
                IFNULL(SUM(CASE WHEN o.operation_type = 'delivery' AND o.status = 'done' THEN sm.quantity ELSE 0 END), 0) as total_deliveries,
                IFNULL(SUM(CASE WHEN o.operation_type = 'delivery' AND o.status = 'done' THEN sm.price * sm.quantity ELSE 0 END), 0) as total_delivery_revenue,
                IFNULL(SUM(CASE WHEN o.operation_type = 'delivery' AND o.status = 'done' THEN p.unit_cost * sm.quantity ELSE 0 END), 0) as total_delivery_cost
            FROM products p
            LEFT JOIN stock_quants sq ON p.id = sq.product_id AND sq.location_id = 1
            LEFT JOIN stock_moves sm ON p.id = sm.product_id
            LEFT JOIN operations o ON sm.operation_id = o.id
            GROUP BY p.id, p.name, p.unit_cost, sq.quantity
        `);

        let totalProfit = 0;

        productStats.forEach(stat => {
            const initial = parseFloat(stat.initial_stock);
            const receipts = parseFloat(stat.total_receipts);
            const deliveries = parseFloat(stat.total_deliveries);

            const pendingQty = initial + receipts - deliveries;

            // Profit = Revenue from Deliveries - Cost of Goods Delivered
            const revenue = parseFloat(stat.total_delivery_revenue);
            const cost = parseFloat(stat.total_delivery_cost);

            if (deliveries > 0) {
                totalProfit += (revenue - cost);
            }

            // Stock Logic: Based on Pending Qty
            if (pendingQty <= 0) {
                outOfStockCount++;
            } else if (pendingQty <= 5) {
                lowStockCount++;
            }
        });

        // Pending Receipts (operation_type = receipt, status != done/canceled)
        const [pendingReceipts] = await db.query("SELECT COUNT(*) as total FROM operations WHERE operation_type = 'receipt' AND status NOT IN ('done', 'canceled')");

        // Pending Deliveries
        const [pendingDeliveries] = await db.query("SELECT COUNT(*) as total FROM operations WHERE operation_type = 'delivery' AND status NOT IN ('done', 'canceled')");

        res.json({
            totalProducts,
            lowStock: lowStockCount,
            outOfStock: outOfStockCount,
            profit: totalProfit,
            pendingReceipts: pendingReceipts[0].total,
            pendingDeliveries: pendingDeliveries[0].total
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching KPIs' });
    }
});

module.exports = router;
