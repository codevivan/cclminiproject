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

const seedOwner = async () => {
  console.log('====================================================');
  console.log('   Single Canteen OWNER Setup & Recovery CLI        ');
  console.log('====================================================\n');

  // Parse command line flags (--name, --email, --password, --reset, --demote-owner, --status)
  const args = process.argv.slice(2);
  let name = '';
  let email = '';
  let password = '';
  let isReset = false;
  let isDemote = false;
  let isStatus = false;

  for (let i = 0; i < args.length; i++) {
    if ((args[i] === '--name' || args[i] === '-n') && args[i + 1]) name = args[i + 1];
    if ((args[i] === '--email' || args[i] === '-e') && args[i + 1]) email = args[i + 1];
    if ((args[i] === '--password' || args[i] === '-p' || args[i] === '--reset-password') && args[i + 1]) password = args[i + 1];
    if (args[i] === '--reset') isReset = true;
    if (args[i] === '--demote-owner') isDemote = true;
    if (args[i] === '--status') isStatus = true;
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

    console.log(`✅ Connected to MySQL database "${database}" on ${host}:${port}.\n`);

    // Fetch existing OWNER accounts
    const [existingOwners] = await connection.execute(
      'SELECT id, name, email, created_at FROM users WHERE role = "OWNER"'
    );

    // Case 1: Status inquiry flag
    if (isStatus) {
      if (existingOwners.length === 0) {
        console.log('ℹ️  Current System Status: No OWNER account exists yet.');
        console.log('👉 First-time setup is available via the Web UI at /owner/auth or by running this script.');
      } else {
        const o = existingOwners[0];
        console.log('ℹ️  Current System Status: 1 Active OWNER account configured.');
        console.log(`   ID:         ${o.id}`);
        console.log(`   Name:       ${o.name}`);
        console.log(`   Email:      ${o.email}`);
        console.log(`   Configured: ${o.created_at}`);
      }
      return;
    }

    // Case 2: Demote owner flag (preserves records, but allows fresh web onboarding)
    if (isDemote) {
      if (existingOwners.length === 0) {
        console.log('ℹ️  No OWNER account exists to demote.');
        return;
      }
      const o = existingOwners[0];
      await connection.execute('UPDATE users SET role = "STUDENT" WHERE id = ?', [o.id]);
      console.log(`✅ Account "${o.email}" (ID: ${o.id}) demoted from OWNER to STUDENT.`);
      console.log('🎉 0 OWNER accounts now exist. You can now use the Web UI at /owner/auth to create your new Owner account!\n');
      return;
    }

    // Case 3: An OWNER account already exists
    if (existingOwners.length > 0) {
      const currentOwner = existingOwners[0];
      console.log(`⚠️ An OWNER account is already configured in MySQL:`);
      console.log(`   ID:         ${currentOwner.id}`);
      console.log(`   Name:       ${currentOwner.name}`);
      console.log(`   Email:      ${currentOwner.email}`);
      console.log(`   Configured: ${currentOwner.created_at}`);
      console.log(`\nSystem Policy: Exactly ONE master Owner account is permitted.\n`);

      // If flags were passed to update or reset
      if (password) {
        if (password.length < 6) {
          console.error('❌ Error: Password must be at least 6 characters long.');
          process.exit(1);
        }
        const hash = await bcrypt.hash(password, 12);
        
        let updateSql = 'UPDATE users SET password_hash = ?';
        const params = [hash];

        if (name) {
          updateSql += ', name = ?';
          params.push(name.trim());
        }
        if (email) {
          updateSql += ', email = ?';
          params.push(email.trim().toLowerCase());
        }

        updateSql += ' WHERE id = ?';
        params.push(currentOwner.id);

        await connection.execute(updateSql, params);

        console.log(`✅ Success: Credentials updated for Owner account (ID: ${currentOwner.id})`);
        if (email) console.log(`   Updated Email: ${email}`);
        if (name) console.log(`   Updated Name:  ${name}`);
        console.log(`   New password hashed securely with bcrypt (12 rounds).`);
        console.log(`👉 You can now sign in at http://localhost:5173/owner/auth\n`);
        return;
      }

      // Interactive prompt menu
      console.log('Select an action:');
      console.log('  [1] Reset password for this Owner account');
      console.log('  [2] Update Owner Name, Email, and Password');
      console.log('  [3] Demote this account to STUDENT (enables fresh Web UI Owner setup)');
      console.log('  [4] Exit without changes\n');

      const choice = await askQuestion('Enter choice (1-4): ');

      if (choice === '1') {
        const newPass = await askQuestion('Enter new password (min 6 characters): ');
        if (!newPass || newPass.length < 6) {
          console.error('❌ Error: Password must be at least 6 characters.');
          process.exit(1);
        }
        const hash = await bcrypt.hash(newPass, 12);
        await connection.execute('UPDATE users SET password_hash = ? WHERE id = ?', [hash, currentOwner.id]);
        console.log(`\n✅ Password successfully updated for OWNER "${currentOwner.email}".`);
        console.log('👉 Sign in at: http://localhost:5173/owner/auth\n');
      } else if (choice === '2') {
        const newName = (await askQuestion(`Enter Full Name [${currentOwner.name}]: `)) || currentOwner.name;
        const newEmail = (await askQuestion(`Enter Email Address [${currentOwner.email}]: `)) || currentOwner.email;
        const newPass = await askQuestion('Enter new password (min 6 characters): ');
        if (!newPass || newPass.length < 6) {
          console.error('❌ Error: Password must be at least 6 characters.');
          process.exit(1);
        }
        const hash = await bcrypt.hash(newPass, 12);
        await connection.execute(
          'UPDATE users SET name = ?, email = ?, password_hash = ? WHERE id = ?',
          [newName.trim(), newEmail.trim().toLowerCase(), hash, currentOwner.id]
        );
        console.log(`\n✅ Owner profile & password updated successfully!`);
        console.log(`   Name:  ${newName}`);
        console.log(`   Email: ${newEmail}`);
        console.log('👉 Sign in at: http://localhost:5173/owner/auth\n');
      } else if (choice === '3') {
        const confirm = await askQuestion(`Are you sure you want to demote "${currentOwner.email}" to STUDENT? (y/N): `);
        if (confirm.toLowerCase() === 'y') {
          await connection.execute('UPDATE users SET role = "STUDENT" WHERE id = ?', [currentOwner.id]);
          console.log(`\n✅ Account "${currentOwner.email}" demoted to STUDENT.`);
          console.log('🎉 0 OWNER accounts now exist.');
          console.log('👉 Visit http://localhost:5173/owner/auth to create your new Owner account!\n');
        } else {
          console.log('Action cancelled. Account remains OWNER.');
        }
      } else {
        console.log('Operation cancelled. No database changes were made.');
      }
      return;
    }

    // Case 4: No OWNER exists yet - proceed with initial provisioning
    console.log('ℹ️  No OWNER account found. Initializing first-time Owner provisioning...\n');

    if (!name) {
      name = (await askQuestion('Enter Owner Full Name: ')) || 'Canteen Owner';
    }
    if (!email) {
      email = (await askQuestion('Enter Owner Email Address: ')) || 'owner@canteen.edu';
    }
    if (!password) {
      password = await askQuestion('Enter Owner Master Password (min 6 chars): ');
      if (!password || password.length < 6) {
        console.error('❌ Error: Password must be at least 6 characters.');
        process.exit(1);
      }
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      console.error('❌ Error: Invalid email format.');
      process.exit(1);
    }

    // Check if email already belongs to a user
    const [existingUser] = await connection.execute(
      'SELECT id, name, role FROM users WHERE email = ?',
      [email.trim().toLowerCase()]
    );

    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    if (existingUser.length > 0) {
      // Elevate the single account to OWNER
      await connection.execute(
        'UPDATE users SET role = "OWNER", password_hash = ?, name = ? WHERE id = ?',
        [passwordHash, name.trim(), existingUser[0].id]
      );
      console.log(`\n✅ Existing user "${email}" has been elevated to the single OWNER.`);
    } else {
      // Create new single OWNER
      const [result] = await connection.execute(
        'INSERT INTO users (name, email, password_hash, role, auth_provider) VALUES (?, ?, ?, "OWNER", "local")',
        [name.trim(), email.trim().toLowerCase(), passwordHash]
      );
      console.log('\n🎉 Single OWNER account created successfully!');
      console.log(`   ID:    ${result.insertId}`);
      console.log(`   Name:  ${name}`);
      console.log(`   Email: ${email}`);
      console.log(`   Role:  OWNER`);
      console.log('   (Password hashed safely with bcrypt, 12 rounds)\n');
    }

    console.log('👉 You can now sign in at http://localhost:5173/owner/auth\n');
  } catch (error) {
    console.error('❌ Failed to configure OWNER account:', error.message);
    process.exit(1);
  } finally {
    if (connection) await connection.end();
  }
};

seedOwner();
