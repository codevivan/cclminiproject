const path = require('path');
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

const INITIAL_MENU_ITEMS = [
  {
    name: 'Paneer Tikka Rice Bowl',
    description: 'Fragrant basmati rice served with char-grilled paneer tikka cubes, makhani gravy, and crisp onion slaw.',
    price: 120.00,
    category: 'Meals',
    image_url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80',
    prep_time_minutes: 12,
    is_featured: true
  },
  {
    name: 'Schezwan Veg Hakka Noodles',
    description: 'Wok-tossed noodles with colorful bell peppers, shredded cabbage, spring onions, and spicy garlic schezwan sauce.',
    price: 95.00,
    category: 'Meals',
    image_url: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=600&auto=format&fit=crop&q=80',
    prep_time_minutes: 10,
    is_featured: true
  },
  {
    name: 'Classic Masala Dosa',
    description: 'Golden crisp fermented rice crepe stuffed with spiced potato mash, served with coconut chutney and piping hot sambar.',
    price: 65.00,
    category: 'Meals',
    image_url: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=600&auto=format&fit=crop&q=80',
    prep_time_minutes: 8,
    is_featured: true
  },
  {
    name: 'Veggie Supreme Artisan Pizza',
    description: 'Hand-stretched crust topped with rich herb marinara, melted mozzarella, bell peppers, black olives, and sweet corn.',
    price: 150.00,
    category: 'Meals',
    image_url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&auto=format&fit=crop&q=80',
    prep_time_minutes: 15,
    is_featured: true
  },
  {
    name: 'Crispy Samosa Chaat',
    description: 'Crushed flaky samosas layered with spiced chole curry, sweet tamarind chutney, mint relish, curd, and crunchy sev.',
    price: 50.00,
    category: 'Snacks',
    image_url: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&auto=format&fit=crop&q=80',
    prep_time_minutes: 5,
    is_featured: true
  },
  {
    name: 'Signature Peri-Peri Fries',
    description: 'Golden crispy potato fingers tossed in our zesty house peri-peri spice blend with chipotle mayo dip.',
    price: 60.00,
    category: 'Snacks',
    image_url: 'https://images.unsplash.com/photo-1576107232684-1279f3908594?w=600&auto=format&fit=crop&q=80',
    prep_time_minutes: 6,
    is_featured: false
  },
  {
    name: 'Grilled Corn & Cheese Sandwich',
    description: 'Buttery toasted multigrain bread filled with melted cheddar, juicy sweet corn kernels, and bell pepper relish.',
    price: 70.00,
    category: 'Snacks',
    image_url: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=600&auto=format&fit=crop&q=80',
    prep_time_minutes: 8,
    is_featured: false
  },
  {
    name: 'Iced Cold Brew Coffee',
    description: 'Smooth 16-hour cold extracted premium Arabica coffee served chilled over ice with a silky milk swirl.',
    price: 55.00,
    category: 'Beverages',
    image_url: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=600&auto=format&fit=crop&q=80',
    prep_time_minutes: 3,
    is_featured: true
  },
  {
    name: 'Alphonso Mango Lassi',
    description: 'Traditional slow-churned thick yogurt blended with real Alphonso mango pulp and a touch of cardamom.',
    price: 50.00,
    category: 'Beverages',
    image_url: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&auto=format&fit=crop&q=80',
    prep_time_minutes: 4,
    is_featured: false
  },
  {
    name: 'Fresh Mint Lemon Cooler',
    description: 'Crisp hand-pressed lemon beverage infused with crushed garden mint leaves, rock salt, and ice.',
    price: 35.00,
    category: 'Beverages',
    image_url: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=600&auto=format&fit=crop&q=80',
    prep_time_minutes: 3,
    is_featured: false
  },
  {
    name: 'Warm Gulab Jamun with Rabri',
    description: 'Two golden khoya dumplings soaked in rose cardamom sugar syrup, served warm with chilled condensed rabri.',
    price: 45.00,
    category: 'Desserts',
    image_url: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&auto=format&fit=crop&q=80',
    prep_time_minutes: 3,
    is_featured: false
  },
  {
    name: 'Belgian Chocolate Fudge Brownie',
    description: 'Decadent baked brownie made with dark Belgian cocoa, stuffed with melted chocolate chunks and roasted walnuts.',
    price: 65.00,
    category: 'Desserts',
    image_url: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=600&auto=format&fit=crop&q=80',
    prep_time_minutes: 3,
    is_featured: true
  }
];

const initDatabase = async () => {
  const host = process.env.DB_HOST || 'localhost';
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || '';
  const database = process.env.DB_NAME || 'canteen_db';
  const port = Number(process.env.DB_PORT) || 3306;

  console.log(`Connecting to MySQL server at ${host}:${port}...`);

  let connection;
  try {
    connection = await mysql.createConnection({ host, user, password, port });
    console.log('✅ Connected to MySQL server.');

    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
    console.log(`✅ Database "${database}" verified/created.`);

    await connection.changeUser({ database });

    // 1. Users Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS \`users\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`name\` VARCHAR(100) NOT NULL,
        \`email\` VARCHAR(150) NOT NULL UNIQUE,
        \`password_hash\` VARCHAR(255) NULL DEFAULT NULL,
        \`google_id\` VARCHAR(100) NULL UNIQUE,
        \`avatar_url\` VARCHAR(500) NULL DEFAULT NULL,
        \`auth_provider\` ENUM('local', 'google') NOT NULL DEFAULT 'local',
        \`role\` ENUM('student', 'admin') NOT NULL DEFAULT 'student',
        \`is_active\` BOOLEAN NOT NULL DEFAULT TRUE,
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX \`idx_users_email\` (\`email\`),
        INDEX \`idx_users_google_id\` (\`google_id\`),
        INDEX \`idx_users_role\` (\`role\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    try {
      const [colRows] = await connection.query(
        "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users' AND COLUMN_NAME = 'is_active'",
        [database]
      );
      if (colRows.length === 0) {
        await connection.query("ALTER TABLE `users` ADD COLUMN `is_active` BOOLEAN NOT NULL DEFAULT TRUE;");
        console.log('✅ Added column "is_active" to users table.');
      }
    } catch (_) {}
    console.log('✅ Table "users" verified/created.');

    // 2. Menu Items Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS \`menu_items\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`name\` VARCHAR(150) NOT NULL,
        \`description\` TEXT,
        \`price\` DECIMAL(10, 2) NOT NULL,
        \`category\` ENUM('Meals', 'Snacks', 'Beverages', 'Desserts') NOT NULL DEFAULT 'Meals',
        \`image_url\` VARCHAR(500),
        \`is_available\` BOOLEAN DEFAULT TRUE,
        \`prep_time_minutes\` INT DEFAULT 10,
        \`is_featured\` BOOLEAN DEFAULT FALSE,
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX \`idx_menu_category\` (\`category\`),
        INDEX \`idx_menu_available\` (\`is_available\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('✅ Table "menu_items" verified/created.');

    // 3. Orders Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS \`orders\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`user_id\` INT NOT NULL,
        \`token_number\` VARCHAR(20) NOT NULL UNIQUE,
        \`receipt_number\` VARCHAR(50) NULL UNIQUE,
        \`status\` ENUM('pending', 'preparing', 'ready', 'completed', 'cancelled') NOT NULL DEFAULT 'pending',
        \`payment_method\` ENUM('UPI', 'Cash', 'Credit Card', 'Debit Card') NOT NULL DEFAULT 'Cash',
        \`payment_status\` ENUM('PENDING', 'PENDING_VERIFICATION', 'PAID') NOT NULL DEFAULT 'PENDING',
        \`transaction_ref\` VARCHAR(100) NULL,
        \`verified_by\` INT NULL,
        \`verified_at\` DATETIME NULL,
        \`total_amount\` DECIMAL(10, 2) NOT NULL,
        \`pickup_counter\` VARCHAR(50) DEFAULT 'Bay #1 (Hot Meals)',
        \`notes\` VARCHAR(255) NULL,
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX \`idx_orders_user\` (\`user_id\`),
        INDEX \`idx_orders_status\` (\`status\`),
        INDEX \`idx_orders_payment_status\` (\`payment_status\`),
        INDEX \`idx_orders_token\` (\`token_number\`),
        FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Migration helper for existing orders table
    const orderCols = [
      { name: 'receipt_number', def: 'VARCHAR(50) NULL UNIQUE AFTER `token_number`' },
      { name: 'payment_method', def: "ENUM('UPI', 'Cash', 'Credit Card', 'Debit Card') NOT NULL DEFAULT 'Cash' AFTER `status`" },
      { name: 'payment_status', def: "ENUM('PENDING', 'PENDING_VERIFICATION', 'PAID') NOT NULL DEFAULT 'PENDING' AFTER `payment_method`" },
      { name: 'transaction_ref', def: 'VARCHAR(100) NULL AFTER `payment_status`' },
      { name: 'verified_by', def: 'INT NULL AFTER `transaction_ref`' },
      { name: 'verified_at', def: 'DATETIME NULL AFTER `verified_by`' }
    ];

    for (const col of orderCols) {
      try {
        const [cRows] = await connection.query(
          "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'orders' AND COLUMN_NAME = ?",
          [database, col.name]
        );
        if (cRows.length === 0) {
          await connection.query(`ALTER TABLE \`orders\` ADD COLUMN \`${col.name}\` ${col.def};`);
          console.log(`✅ Added column "${col.name}" to orders table.`);
        }
      } catch (err) {
        console.warn(`Migration note (${col.name}):`, err.message);
      }
    }
    console.log('✅ Table "orders" verified/created.');

    // 4. Order Items Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS \`order_items\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`order_id\` INT NOT NULL,
        \`menu_item_id\` INT NULL,
        \`item_name\` VARCHAR(150) NOT NULL,
        \`quantity\` INT NOT NULL DEFAULT 1,
        \`unit_price\` DECIMAL(10, 2) NOT NULL,
        \`subtotal\` DECIMAL(10, 2) NOT NULL,
        FOREIGN KEY (\`order_id\`) REFERENCES \`orders\`(\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('✅ Table "order_items" verified/created.');

    // Ensure orders.status includes 'confirmed'
    try {
      await connection.query(`
        ALTER TABLE \`orders\` 
        MODIFY COLUMN \`status\` ENUM('pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled') NOT NULL DEFAULT 'pending';
      `);
      console.log("✅ Modified orders.status ENUM to include 'confirmed'.");
    } catch (err) {
      console.warn('orders.status ENUM note:', err.message);
    }

    // 5. In-App Notifications Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS \`notifications\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`user_id\` INT NOT NULL,
        \`order_id\` INT NULL,
        \`title\` VARCHAR(150) NOT NULL,
        \`message\` TEXT NOT NULL,
        \`type\` ENUM('order_created', 'payment_review', 'payment_confirmed', 'preparing', 'ready', 'completed', 'info') NOT NULL DEFAULT 'info',
        \`is_read\` BOOLEAN NOT NULL DEFAULT FALSE,
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX \`idx_notif_user\` (\`user_id\`),
        INDEX \`idx_notif_read\` (\`is_read\`),
        FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE,
        FOREIGN KEY (\`order_id\`) REFERENCES \`orders\`(\`id\`) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('✅ Table "notifications" verified/created.');

    // 6. Today's Canteen Status Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS \`canteen_status\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`status\` ENUM('open', 'paused', 'closing_soon', 'closed') NOT NULL DEFAULT 'open',
        \`notice\` TEXT NULL,
        \`opening_time\` VARCHAR(10) DEFAULT '08:00',
        \`closing_time\` VARCHAR(10) DEFAULT '20:00',
        \`status_date\` DATE NOT NULL,
        \`updated_by\` INT NULL,
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY \`idx_canteen_date\` (\`status_date\`),
        FOREIGN KEY (\`updated_by\`) REFERENCES \`users\`(\`id\`) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('✅ Table "canteen_status" verified/created.');

    // Seed Today's Status if missing
    await connection.query(`
      INSERT IGNORE INTO \`canteen_status\` (status_date, status, notice, opening_time, closing_time)
      VALUES (CURDATE(), 'open', 'Welcome! Online food pre-orders are open today.', '08:00', '20:00');
    `);

    // Seed Menu Items if empty
    const [menuRows] = await connection.query('SELECT COUNT(*) as count FROM `menu_items`;');
    if (menuRows[0].count === 0) {
      console.log('🌱 Seeding initial delicious campus menu items...');
      for (const item of INITIAL_MENU_ITEMS) {
        await connection.query(
          'INSERT INTO `menu_items` (name, description, price, category, image_url, prep_time_minutes, is_featured) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [item.name, item.description, item.price, item.category, item.image_url, item.prep_time_minutes, item.is_featured]
        );
      }
      console.log(`✅ Seeded ${INITIAL_MENU_ITEMS.length} menu items successfully.`);
    }

    console.log('\n🎉 Database initialization completed successfully!');
  } catch (error) {
    console.error('\n❌ Database initialization error:', error.message);
    process.exit(1);
  } finally {
    if (connection) await connection.end();
  }
};

initDatabase();
