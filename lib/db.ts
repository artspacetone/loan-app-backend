import { neon } from "@neondatabase/serverless"

// Use Neon database for production, SQLite for development
const sql = neon(process.env.DATABASE_URL!)

export interface User {
  id: number
  username: string
  email: string
  password_hash: string
  full_name: string
  role: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface InventoryItem {
  id: number
  name: string
  description?: string
  category: string
  quantity: number
  min_quantity: number
  unit: string
  price: number
  location?: string
  status: string
  barcode?: string
  supplier?: string
  created_at: string
  updated_at: string
}

export interface Transaction {
  id: number
  type: string
  item_id?: number
  item_name: string
  quantity: number
  requested_by: string
  approved_by?: string
  status: string
  reason?: string
  notes?: string
  priority: string
  request_date: string
  approval_date?: string
  completed_date?: string
}

// Initialize database tables
export async function initDatabase() {
  try {
    // Users table
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        full_name VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'user',
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `

    // Inventory items table
    await sql`
      CREATE TABLE IF NOT EXISTS inventory_items (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        category VARCHAR(100),
        quantity INTEGER DEFAULT 0,
        min_quantity INTEGER DEFAULT 5,
        unit VARCHAR(50) DEFAULT 'pcs',
        price DECIMAL(12,2) DEFAULT 0.0,
        location VARCHAR(255),
        status VARCHAR(50) DEFAULT 'available',
        barcode VARCHAR(255),
        supplier VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `

    // Transactions table
    await sql`
      CREATE TABLE IF NOT EXISTS transactions (
        id SERIAL PRIMARY KEY,
        type VARCHAR(50) NOT NULL,
        item_id INTEGER REFERENCES inventory_items(id),
        item_name VARCHAR(255) NOT NULL,
        quantity INTEGER NOT NULL,
        requested_by VARCHAR(255) NOT NULL,
        approved_by VARCHAR(255),
        status VARCHAR(50) DEFAULT 'pending',
        reason TEXT,
        notes TEXT,
        priority VARCHAR(50) DEFAULT 'normal',
        request_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        approval_date TIMESTAMP,
        completed_date TIMESTAMP
      )
    `

    console.log("✅ Database tables initialized")
    return true
  } catch (error) {
    console.error("❌ Database initialization failed:", error)
    return false
  }
}

// Seed default data
export async function seedDatabase() {
  try {
    // Check if users already exist
    const existingUsers = await sql`SELECT COUNT(*) as count FROM users`
    if (existingUsers[0].count > 0) {
      console.log("📊 Database already seeded")
      return true
    }

    // Create default users
    const bcrypt = require("bcryptjs")

    const defaultUsers = [
      {
        username: "admin",
        email: "admin@inventory.com",
        password: "admin123",
        full_name: "System Administrator",
        role: "admin",
      },
      {
        username: "supervisor",
        email: "supervisor@inventory.com",
        password: "super123",
        full_name: "Inventory Supervisor",
        role: "supervisor",
      },
      {
        username: "user",
        email: "user@inventory.com",
        password: "user123",
        full_name: "Regular User",
        role: "user",
      },
    ]

    for (const user of defaultUsers) {
      const hashedPassword = await bcrypt.hash(user.password, 10)
      await sql`
        INSERT INTO users (username, email, password_hash, full_name, role)
        VALUES (${user.username}, ${user.email}, ${hashedPassword}, ${user.full_name}, ${user.role})
      `
    }

    // Create sample inventory items
    const sampleItems = [
      {
        name: "Laptop Dell Inspiron",
        description: "Dell Inspiron 15 3000 Series",
        category: "Electronics",
        quantity: 25,
        min_quantity: 5,
        unit: "pcs",
        price: 8500000.0,
        location: "Warehouse A-1",
        supplier: "Dell Indonesia",
      },
      {
        name: "Office Chair",
        description: "Ergonomic office chair with lumbar support",
        category: "Furniture",
        quantity: 50,
        min_quantity: 10,
        unit: "pcs",
        price: 1200000.0,
        location: "Warehouse B-2",
        supplier: "Office Furniture Co",
      },
      {
        name: "A4 Paper",
        description: "White A4 paper 80gsm",
        category: "Stationery",
        quantity: 100,
        min_quantity: 20,
        unit: "ream",
        price: 45000.0,
        location: "Storage Room C",
        supplier: "Paper Supply Ltd",
      },
    ]

    for (const item of sampleItems) {
      await sql`
        INSERT INTO inventory_items 
        (name, description, category, quantity, min_quantity, unit, price, location, supplier)
        VALUES (${item.name}, ${item.description}, ${item.category}, ${item.quantity}, 
                ${item.min_quantity}, ${item.unit}, ${item.price}, ${item.location}, ${item.supplier})
      `
    }

    console.log("🌱 Database seeded successfully")
    return true
  } catch (error) {
    console.error("❌ Database seeding failed:", error)
    return false
  }
}

export { sql }
