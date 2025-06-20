const { createClient } = require("@supabase/supabase-js")

async function setupDatabase() {
  const supabaseUrl = process.env.SUPABASE_NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.error("❌ Missing Supabase environment variables")
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, supabaseKey)

  console.log("🚀 Setting up database...")

  try {
    // Create users table
    const { error: usersError } = await supabase.rpc("exec_sql", {
      sql: `
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          username VARCHAR(50) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          role VARCHAR(20) DEFAULT 'user',
          full_name VARCHAR(100),
          email VARCHAR(100),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `,
    })

    if (usersError) throw usersError

    // Create inventory table
    const { error: inventoryError } = await supabase.rpc("exec_sql", {
      sql: `
        CREATE TABLE IF NOT EXISTS inventory (
          id SERIAL PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          description TEXT,
          quantity INTEGER DEFAULT 0,
          price DECIMAL(10,2),
          category VARCHAR(50),
          status VARCHAR(20) DEFAULT 'active',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `,
    })

    if (inventoryError) throw inventoryError

    console.log("✅ Database setup completed!")
  } catch (error) {
    console.error("❌ Database setup failed:", error.message)
    process.exit(1)
  }
}

setupDatabase()
