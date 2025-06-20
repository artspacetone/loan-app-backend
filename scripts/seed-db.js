const { createClient } = require("@supabase/supabase-js")
const bcrypt = require("bcryptjs")

async function seedDatabase() {
  const supabaseUrl = process.env.SUPABASE_NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.error("❌ Missing Supabase environment variables")
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, supabaseKey)

  console.log("🌱 Seeding database...")

  try {
    // Seed users
    const users = [
      {
        username: "admin",
        password: "admin123",
        role: "admin",
        full_name: "System Administrator",
        email: "admin@company.com",
      },
      {
        username: "supervisor",
        password: "super123",
        role: "supervisor",
        full_name: "Supervisor User",
        email: "supervisor@company.com",
      },
      {
        username: "user",
        password: "user123",
        role: "user",
        full_name: "Regular User",
        email: "user@company.com",
      },
    ]

    for (const user of users) {
      const hashedPassword = await bcrypt.hash(user.password, 10)

      const { error } = await supabase.from("users").upsert(
        {
          username: user.username,
          password_hash: hashedPassword,
          role: user.role,
          full_name: user.full_name,
          email: user.email,
        },
        { onConflict: "username" },
      )

      if (error) throw error
    }

    // Seed inventory
    const inventory = [
      {
        name: "Laptop Dell XPS 13",
        description: "High-performance laptop for office work",
        quantity: 25,
        price: 1299.99,
        category: "Electronics",
        status: "active",
      },
      {
        name: "Office Chair Ergonomic",
        description: "Comfortable ergonomic office chair",
        quantity: 50,
        price: 299.99,
        category: "Furniture",
        status: "active",
      },
      {
        name: "Wireless Mouse",
        description: "Bluetooth wireless mouse",
        quantity: 100,
        price: 29.99,
        category: "Accessories",
        status: "active",
      },
    ]

    for (const item of inventory) {
      const { error } = await supabase.from("inventory").upsert(item)

      if (error) throw error
    }

    console.log("✅ Database seeded successfully!")
  } catch (error) {
    console.error("❌ Database seeding failed:", error.message)
    process.exit(1)
  }
}

seedDatabase()
