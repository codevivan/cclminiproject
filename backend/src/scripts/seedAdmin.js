const path = require('path');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const readline = require('readline');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

const askQuestion = (query) => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  return new Promise((resolve) =>
    rl.question(query, (ans) => {
      rl.close();
      resolve(ans.trim());
    })
  );
};

const seedAdmin = async () => {
  console.log('==================================================');
  console.log('   Create Administrator Account (Safe CLI Utility)  ');
  console.log('==================================================\n');

  // Parse command line flags if provided (--name, --email, --password)
  const args = process.argv.slice(2);
  let name = '';
  let email = '';
  let password = '';

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--name' && args[i + 1]) name = args[i + 1];
    if (args[i] === '--email' && args[i + 1]) email = args[i + 1];
    if (args[i] === '--password' && args[i + 1]) password = args[i + 1];
  }

  // Interactive prompts if not passed via CLI
  if (!name) {
    name = (await askQuestion('Enter Admin Name [Canteen Admin]: ')) || 'Canteen Admin';
  }
  if (!email) {
    email = (await askQuestion('Enter Admin Email [admin@canteen.edu]: ')) || 'admin@canteen.edu';
  }
  if (!password) {
    password = await askQuestion('Enter Admin Password (min 6 chars) [Admin@12345]: ');
    if (!password) password = 'Admin@12345';
  }

  if (password.length < 6) {
    console.error('❌ Error: Password must be at least 6 characters.');
    process.exit(1);
  }

  const host = process.env.DB_HOST || 'localhost';
  const user = process.env.DB_USER || 'root';
  const dbPassword = process.env.DB_PASSWORD || '';
  const database = process.env.DB_NAME || 'canteen_db';
  const port = Number(process.env.DB_PORT) || 3306;

  let connection;
  try {
    connection = await mysql.createConnection({
      host,
      user,
      password: dbPassword,
      database,
      port
    });

    // Check if an admin already exists to enforce exactly ONE admin
    const [allAdmins] = await connection.execute(
      'SELECT id, name, email FROM users WHERE role = "admin"'
    );

    if (allAdmins.length > 0) {
      const currentAdmin = allAdmins[0];
      if (currentAdmin.email !== email) {
        console.log(`\n⚠️ Policy: Exactly ONE Admin account is permitted in the system.`);
        console.log(`   Current Admin: ${currentAdmin.name} (${currentAdmin.email})`);
        const confirmReplace = await askQuestion(`   Do you wish to replace this administrator with "${email}"? (y/N): `);
        if (confirmReplace.toLowerCase() === 'y') {
          await connection.execute('UPDATE users SET role = "student" WHERE role = "admin"');
          console.log(`ℹ️ Previous admin "${currentAdmin.email}" demoted to student.`);
        } else {
          console.log('Operation cancelled. System retains single existing administrator.');
          return;
        }
      }
    }

    // Check if admin email already exists
    const [existing] = await connection.execute(
      'SELECT id, email, role FROM users WHERE email = ?',
      [email]
    );

    if (existing.length > 0) {
      console.log(`\n⚠️ An account with email "${email}" already exists (Role: ${existing[0].role}).`);
      const updateRole = await askQuestion('Would you like to promote this account to the single "admin"? (y/N): ');
      if (updateRole.toLowerCase() === 'y') {
        const passwordHash = await bcrypt.hash(password, 12);
        await connection.execute(
          'UPDATE users SET role = "admin", password_hash = ? WHERE id = ?',
          [passwordHash, existing[0].id]
        );
        console.log(`✅ User ${email} has been designated as the single "admin" with updated password.`);
      } else {
        console.log('No changes were made.');
      }
      return;
    }

    // Hash the password securely
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Insert admin record
    const [result] = await connection.execute(
      'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, "admin")',
      [name, email, passwordHash]
    );

    console.log('\n🎉 Administrator account created successfully!');
    console.log(`   ID:    ${result.insertId}`);
    console.log(`   Name:  ${name}`);
    console.log(`   Email: ${email}`);
    console.log(`   Role:  admin`);
    console.log('   (Password hashed safely with bcrypt)\n');
  } catch (error) {
    console.error('❌ Failed to seed administrator:', error.message);
    process.exit(1);
  } finally {
    if (connection) await connection.end();
  }
};

seedAdmin();
