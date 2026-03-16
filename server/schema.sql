CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS warehouses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  short_code VARCHAR(50) UNIQUE NOT NULL,
  address TEXT
);

CREATE TABLE IF NOT EXISTS locations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  short_code VARCHAR(50) UNIQUE NOT NULL,
  warehouse_id INT NOT NULL,
  FOREIGN KEY (warehouse_id) REFERENCES warehouses(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  sku VARCHAR(100) UNIQUE NOT NULL,
  category VARCHAR(100),
  unit_of_measure VARCHAR(50) DEFAULT 'Units',
  unit_cost DECIMAL(10, 2) DEFAULT 0.00,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS stock_quants (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  location_id INT NOT NULL,
  quantity DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  CHECK (quantity >= 0),
  UNIQUE KEY unique_product_location (product_id, location_id),
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
  FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS operations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  reference VARCHAR(50) UNIQUE NOT NULL,
  operation_type ENUM('receipt', 'delivery', 'transfer', 'adjustment') NOT NULL,
  contact VARCHAR(255),
  source_location_id INT,
  dest_location_id INT,
  status ENUM('draft', 'waiting', 'ready', 'done', 'canceled') DEFAULT 'draft',
  scheduled_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (source_location_id) REFERENCES locations(id) ON DELETE SET NULL,
  FOREIGN KEY (dest_location_id) REFERENCES locations(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS stock_moves (
  id INT AUTO_INCREMENT PRIMARY KEY,
  operation_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity DECIMAL(10, 2) NOT NULL,
  status ENUM('draft', 'waiting', 'ready', 'done', 'canceled') DEFAULT 'draft',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (operation_id) REFERENCES operations(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
);

-- Seed Data
INSERT IGNORE INTO warehouses (id, name, short_code, address) VALUES 
(1, 'Main Warehouse', 'WH', '123 Supply Chain Ave');

INSERT IGNORE INTO locations (id, name, short_code, warehouse_id) VALUES 
(1, 'Stock Rack 1', 'WH/Stock/1', 1),
(2, 'Stock Rack 2', 'WH/Stock/2', 1),
(3, 'Vendor Location', 'Partner/Vendor', 1),
(4, 'Customer Location', 'Partner/Customer', 1),
(5, 'Virtual Inventory Adjustment', 'Virtual/Adjustment', 1);

-- Default User password: 'password123' -> bcrypt hash
INSERT IGNORE INTO users (email, password_hash, name, role) VALUES
('admin@coreinventory.local', '$2b$10$wE9K2j35qQd/2B4j5J8k6uT2kLQ7Z/v8rMvM9H3D2Z6v8rMvM9H3D', 'Admin User', 'admin');
