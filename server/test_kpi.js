const db = require('./db');

async function test() {
    try {
        const [productStats] = await db.query(`
            SELECT 
                p.id, 
                p.name,
                IFNULL(p.unit_cost, 0) as purchased_amount,
                IFNULL(sq.quantity, 0) as initial_stock,
                IFNULL(SUM(CASE WHEN o.operation_type = 'receipt' AND o.status = 'done' THEN sm.quantity ELSE 0 END), 0) as total_receipts,
                IFNULL(SUM(CASE WHEN o.operation_type = 'delivery' AND o.status = 'done' THEN sm.quantity ELSE 0 END), 0) as total_deliveries,
                IFNULL(SUM(CASE WHEN o.operation_type = 'receipt' AND o.status = 'done' THEN sm.price * sm.quantity ELSE 0 END), 0) as total_receipt_amount,
                IFNULL(SUM(CASE WHEN o.operation_type = 'receipt' AND o.status = 'done' THEN p.unit_cost * sm.quantity ELSE 0 END), 0) as total_purchased_amount
            FROM products p
            LEFT JOIN stock_quants sq ON p.id = sq.product_id AND sq.location_id = 1
            LEFT JOIN stock_moves sm ON p.id = sm.product_id
            LEFT JOIN operations o ON sm.operation_id = o.id
            GROUP BY p.id, p.name, p.unit_cost, sq.quantity
        `);

        let lowStockCount = 0;
        let outOfStockCount = 0;
        let totalProfit = 0;

        productStats.forEach(stat => {
            const initial = parseFloat(stat.initial_stock);
            const receipts = parseFloat(stat.total_receipts);
            const deliveries = parseFloat(stat.total_deliveries);
            const pendingQty = initial + receipts - deliveries;
            const receiptAmount = parseFloat(stat.total_receipt_amount);
            const totalPurchasedAmount = parseFloat(stat.total_purchased_amount);

            console.log(stat.name, '| initial:', initial, 'receipts:', receipts, 'deliveries:', deliveries, 'pendingQty:', pendingQty);

            if (receipts > 0) {
                totalProfit += (receiptAmount - totalPurchasedAmount);
            }

            if (pendingQty <= 0) {
                outOfStockCount++;
            } else if (pendingQty <= 5) {
                lowStockCount++;
            }
        });
        
        console.log({ outOfStockCount, lowStockCount, totalProfit });
    } catch (e) {
        console.error(e);
    }
    process.exit();
}
test();
