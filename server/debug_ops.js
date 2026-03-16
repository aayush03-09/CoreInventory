const db = require('./db');

async function testOperations() {
    try {
        const [ops] = await db.query('SELECT * FROM operations');
        console.table(ops);
        const [moves] = await db.query('SELECT * FROM stock_moves');
        console.table(moves);
    } catch (e) {
        console.error(e);
    }
    process.exit();
}
testOperations();
