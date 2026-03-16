const db = require('./db');

async function testProducts() {
    try {
        const [rows] = await db.query(`
            SELECT 
                p.*,
                IFNULL(sq.quantity, 0) as initial_stock,
                IFNULL(SUM(CASE WHEN o.operation_type = 'receipt' THEN sm.quantity ELSE 0 END), 0) as total_receipts,
                IFNULL(SUM(CASE WHEN o.operation_type = 'delivery' THEN sm.quantity ELSE 0 END), 0) as total_deliveries
            FROM products p
            LEFT JOIN stock_quants sq ON p.id = sq.product_id AND sq.location_id = 1
            LEFT JOIN stock_moves sm ON p.id = sm.product_id
            LEFT JOIN operations o ON sm.operation_id = o.id
            GROUP BY p.id, sq.quantity
            ORDER BY p.name ASC
        `);

        const mapped = rows.map(r => ({
            ...r,
            available_stock: parseFloat(r.initial_stock) + parseFloat(r.total_receipts) - parseFloat(r.total_deliveries)
        }));
        console.log("PRODUCTS MAPPED:", mapped);
    } catch (e) {
        console.error(e);
    }
    process.exit();
}
testProducts();
