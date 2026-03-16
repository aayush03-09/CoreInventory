const bcrypt = require('bcrypt');
const mysql = require('mysql2/promise');

async function seedUsers() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        database: 'coreinventory'
    });

    const hash = await bcrypt.hash('password123', 10);

    await connection.execute(
        'INSERT IGNORE INTO users (email, password_hash, name, role) VALUES (?, ?, ?, ?)',
        ['manager@coreinventory.local', hash, 'Inventory Manager', 'manager']
    );

    await connection.execute(
        'INSERT IGNORE INTO users (email, password_hash, name, role) VALUES (?, ?, ?, ?)',
        ['staff@coreinventory.local', hash, 'Warehouse Staff', 'staff']
    );

    console.log('Manager and Staff users seeded successfully.');
    process.exit(0);
}
seedUsers();
