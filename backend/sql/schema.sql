-- ====================================================================
-- Cloud-Based Canteen Pre-Order & Token Management System
-- Database Schema (Users, Menu Items, Orders, Order Items)
-- ====================================================================

CREATE DATABASE IF NOT EXISTS `canteen_db`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `canteen_db`;

-- 1. Users Table
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(150) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NULL DEFAULT NULL,
  `google_id` VARCHAR(100) NULL UNIQUE,
  `avatar_url` VARCHAR(500) NULL DEFAULT NULL,
  `auth_provider` ENUM('local', 'google') NOT NULL DEFAULT 'local',
  `role` ENUM('STUDENT', 'OWNER') NOT NULL DEFAULT 'STUDENT',
  `is_active` BOOLEAN NOT NULL DEFAULT TRUE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_users_email` (`email`),
  INDEX `idx_users_google_id` (`google_id`),
  INDEX `idx_users_role` (`role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Menu Items Table
CREATE TABLE IF NOT EXISTS `menu_items` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(150) NOT NULL,
  `description` TEXT,
  `price` DECIMAL(10, 2) NOT NULL,
  `category` ENUM('Meals', 'Snacks', 'Beverages', 'Desserts') NOT NULL DEFAULT 'Meals',
  `image_url` VARCHAR(500),
  `is_available` BOOLEAN DEFAULT TRUE,
  `prep_time_minutes` INT DEFAULT 10,
  `is_featured` BOOLEAN DEFAULT FALSE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_menu_category` (`category`),
  INDEX `idx_menu_available` (`is_available`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Orders Table
CREATE TABLE IF NOT EXISTS `orders` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `token_number` VARCHAR(20) NOT NULL UNIQUE,
  `receipt_number` VARCHAR(50) NULL UNIQUE,
  `status` ENUM('pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled') NOT NULL DEFAULT 'pending',
  `payment_method` ENUM('UPI', 'Cash', 'Credit Card', 'Debit Card') NOT NULL DEFAULT 'Cash',
  `payment_status` ENUM('PENDING', 'PENDING_VERIFICATION', 'PAID') NOT NULL DEFAULT 'PENDING',
  `transaction_ref` VARCHAR(100) NULL,
  `verified_by` INT NULL,
  `verified_at` DATETIME NULL,
  `status_updated_by` INT NULL,
  `total_amount` DECIMAL(10, 2) NOT NULL,
  `pickup_counter` VARCHAR(50) DEFAULT 'Bay #1 (Hot Meals)',
  `notes` VARCHAR(255) NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_orders_user` (`user_id`),
  INDEX `idx_orders_status` (`status`),
  INDEX `idx_orders_payment_status` (`payment_status`),
  INDEX `idx_orders_token` (`token_number`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`verified_by`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`status_updated_by`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Order Items Table
CREATE TABLE IF NOT EXISTS `order_items` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `order_id` INT NOT NULL,
  `menu_item_id` INT NULL,
  `item_name` VARCHAR(150) NOT NULL,
  `quantity` INT NOT NULL DEFAULT 1,
  `unit_price` DECIMAL(10, 2) NOT NULL,
  `subtotal` DECIMAL(10, 2) NOT NULL,
  FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. In-App Notifications Table
CREATE TABLE IF NOT EXISTS `notifications` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `order_id` INT NULL,
  `title` VARCHAR(150) NOT NULL,
  `message` TEXT NOT NULL,
  `type` ENUM('order_created', 'payment_review', 'payment_confirmed', 'preparing', 'ready', 'completed', 'cancelled', 'info') NOT NULL DEFAULT 'info',
  `is_read` BOOLEAN NOT NULL DEFAULT FALSE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_notif_user` (`user_id`),
  INDEX `idx_notif_read` (`is_read`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Today's Canteen Status Table
CREATE TABLE IF NOT EXISTS `canteen_status` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `status` ENUM('open', 'paused', 'closing_soon', 'closed') NOT NULL DEFAULT 'open',
  `notice` TEXT NULL,
  `opening_time` VARCHAR(10) DEFAULT '08:00',
  `closing_time` VARCHAR(10) DEFAULT '20:00',
  `status_date` DATE NOT NULL,
  `updated_by` INT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `idx_canteen_date` (`status_date`),
  FOREIGN KEY (`updated_by`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

