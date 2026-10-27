const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

const runMigration = async () => {
  console.log('--- Starting Database Migration: Role & Schema Alignment ---');

  const host = process.env.DB_HOST || 'localhost';
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || '';
  const database = process.env.DB_NAME || 'canteen_db';
  const port = Number(process.env.DB_PORT) || 3306;

  let connection;
  try {
    connection = await mysql.createConnection({ host, user, password, database, port });
    console.log('Connected to MySQL database:', database);

    // 1. Temporarily change `role` to VARCHAR so values can be mapped without enum constraint errors
    console.log('1. Altering users.role to VARCHAR(20)...');
    await connection.query('ALTER TABLE users MODIFY COLUMN role VARCHAR(20) NOT NULL DEFAULT "STUDENT"');

    // 2. Normalize and migrate roles to exact OWNER and STUDENT values
    console.log('2. Migrating existing user roles...');
    await connection.query('UPDATE users SET role = "STUDENT" WHERE LOWER(role) = "student"');
    await connection.query('UPDATE users SET role = "OWNER" WHERE LOWER(role) = "admin" OR LOWER(role) = "owner"');

    // 3. Convert `role` to ENUM('STUDENT', 'OWNER')
    console.log('3. Applying ENUM("STUDENT", "OWNER") constraint...');
    await connection.query('ALTER TABLE users MODIFY COLUMN role ENUM("STUDENT", "OWNER") NOT NULL DEFAULT "STUDENT"');

    // 4. Safely add status_updated_by column to orders if not already present
    console.log('4. Checking status_updated_by in orders table...');
    const [cols] = await connection.query('DESCRIBE orders');
    const hasStatusUpdatedBy = cols.some((c) => c.Field === 'status_updated_by');
    if (!hasStatusUpdatedBy) {
      console.log('   Adding status_updated_by column to orders table...');
      await connection.query(
        'ALTER TABLE orders ADD COLUMN status_updated_by INT NULL AFTER verified_at, ADD CONSTRAINT fk_orders_status_updated_by FOREIGN KEY (status_updated_by) REFERENCES users(id) ON DELETE SET NULL'
      );
    } else {
      console.log('   status_updated_by column already exists in orders table.');
    }

    // 5. Expand notifications.type ENUM to include 'cancelled'
    console.log('5. Updating notifications.type ENUM...');
    await connection.query(
      "ALTER TABLE notifications MODIFY COLUMN type ENUM('order_created', 'payment_review', 'payment_confirmed', 'preparing', 'ready', 'completed', 'cancelled', 'info') NOT NULL DEFAULT 'info'"
    );

    // Verify migrated data
    const [users] = await connection.query('SELECT id, name, email, role FROM users');
    console.log('\nMigration complete! Current users in database:');
    console.table(users);

    const owners = users.filter((u) => u.role === 'OWNER');
    console.log(`Verified: Exactly ${owners.length} OWNER account(s) present.`);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  } finally {
    if (connection) await connection.end();
  }
};

runMigration();
