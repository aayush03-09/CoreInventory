const db = require('./db');

async function debugMath() {
    try {
        const [products] = await db.query('SELECT * FROM products');
        console.log("PRODUCTS:");
        console.table(products);

        const [moves] = await db.query('SELECT * FROM stock_moves');
        console.log("STOCK MOVES:");
        console.table(moves);

        const [quants] = await db.query('SELECT * FROM stock_quants');
        console.log("STOCK QUANTS:");
        console.table(quants);
    } catch (e) {
        console.error(e);
    }
    process.exit();
}

debugMath();
