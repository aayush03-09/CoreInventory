const bcrypt = require('bcrypt');
const mysql = require('mysql2/promise');

async function fixHash() {
    const hash = await bcrypt.hash('password123', 10);
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        database: 'coreinventory'
    });

    await connection.execute(
        'UPDATE users SET password_hash = ? WHERE email = ?',
        [hash, 'admin@coreinventory.local']
    );

    console.log('Password hash updated via Node.js db connector.');
    process.exit(0);
}
fixHash();
