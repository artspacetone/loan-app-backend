import { createClient } from "@supabase/supabase-js"
import bcrypt from "bcryptjs"

// Validate environment variables
const supabaseUrl = process.env.SUPABASE_NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = proSUPABASE_NEXT_PUBLIC_SUPABASE_ANON_KEY_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL environment variable")
}

if (!supabaseAnonKey) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable")
}

if (!supabaseServiceKey) {
  throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY environment variable")
}

// Client-side Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Server-side Supabase client with service role key
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

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
    console.log("🔧 Initializing Supabase database...")

    // Create users table
    const { error: usersError } = await supabaseAdmin.rpc("exec", {
      sql: `
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          username VARCHAR(50) UNIQUE NOT NULL,
          email VARCHAR(100) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          full_name VARCHAR(100) NOT NULL,
          role VARCHAR(20) DEFAULT 'user',
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `,
    })

    if (usersError && !usersError.message.includes("already exists")) {
      console.error("Users table error:", usersError)
    }

    // Create inventory_items table
    const { error: inventoryError } = await supabaseAdmin.rpc("exec", {
      sql: `
        CREATE TABLE IF NOT EXISTS inventory_items (
          id SERIAL PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          description TEXT,
          category VARCHAR(50) NOT NULL,
          quantity INTEGER NOT NULL DEFAULT 0,
          min_quantity INTEGER DEFAULT 5,
          unit VARCHAR(20) NOT NULL,
          price DECIMAL(12,2) DEFAULT 0.00,
          location VARCHAR(100),
          status VARCHAR(20) DEFAULT 'available',
          barcode VARCHAR(50),
          supplier VARCHAR(100),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `,
    })

    if (inventoryError && !inventoryError.message.includes("already exists")) {
      console.error("Inventory table error:", inventoryError)
    }

    // Create transactions table
    const { error: transactionsError } = await supabaseAdmin.rpc("exec", {
      sql: `
        CREATE TABLE IF NOT EXISTS transactions (
          id SERIAL PRIMARY KEY,
          type VARCHAR(20) NOT NULL,
          item_id INTEGER REFERENCES inventory_items(id),
          item_name VARCHAR(100) NOT NULL,
          quantity INTEGER NOT NULL,
          requested_by VARCHAR(50) NOT NULL,
          approved_by VARCHAR(50),
          status VARCHAR(20) DEFAULT 'pending',
          reason TEXT,
          notes TEXT,
          priority VARCHAR(20) DEFAULT 'normal',
          request_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          approval_date TIMESTAMP,
          completed_date TIMESTAMP
        );
      `,
    })

    if (transactionsError && !transactionsError.message.includes("already exists")) {
      console.error("Transactions table error:", transactionsError)
    }

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
    console.log("🌱 Seeding database...")

    // Check if users already exist
    const { data: existingUsers, error: checkError } = await supabaseAdmin.from("users").select("id").limit(1)

    if (checkError) {
      console.error("Error checking existing users:", checkError)
      return false
    }

    if (existingUsers && existingUsers.length > 0) {
      console.log("📊 Database already seeded")
      return true
    }

    // Create default users
    const defaultUsers = [
      {
        username: "admin",
        email: "admin@inventory.com",
        password_hash: await bcrypt.hash("admin123", 10),
        full_name: "System Administrator",
        role: "admin",
      },
      {
        username: "supervisor",
        email: "supervisor@inventory.com",
        password_hash: await bcrypt.hash("super123", 10),
        full_name: "Inventory Supervisor",
        role: "supervisor",
      },
      {
        username: "user",
        email: "user@inventory.com",
        password_hash: await bcrypt.hash("user123", 10),
        full_name: "Regular User",
        role: "user",
      },
    ]

    const { error: usersError } = await supabaseAdmin.from("users").insert(defaultUsers)

    if (usersError) {
      console.error("Error seeding users:", usersError)
      return false
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
        status: "available",
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
        status: "available",
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
        status: "available",
      },
    ]

    const { error: itemsError } = await supabaseAdmin.from("inventory_items").insert(sampleItems)

    if (itemsError) {
      console.error("Error seeding inventory items:", itemsError)
      return false
    }

    console.log("🌱 Database seeded successfully")
    return true
  } catch (error) {
    console.error("❌ Database seeding failed:", error)
    return false
  }
}
