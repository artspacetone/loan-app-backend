import { NextResponse } from "next/server"
import { supabaseAdmin, initDatabase, seedDatabase } from "@/lib/supabase"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function POST() {
  try {
    console.log("🚀 Starting database setup...")

    // Test Supabase connection
    const { data, error } = await supabaseAdmin.from("users").select("count").limit(1)

    if (error) {
      console.error("❌ Supabase connection failed:", error)
      return NextResponse.json(
        {
          success: false,
          message: "Database connection failed",
          error: error.message,
        },
        { status: 500 },
      )
    }

    // Initialize database
    const initSuccess = await initDatabase()
    if (!initSuccess) {
      return NextResponse.json(
        {
          success: false,
          message: "Database initialization failed",
        },
        { status: 500 },
      )
    }

    // Seed database
    const seedSuccess = await seedDatabase()
    if (!seedSuccess) {
      return NextResponse.json(
        {
          success: false,
          message: "Database seeding failed",
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      message: "Database setup completed successfully",
      data: {
        initialized: true,
        seeded: true,
        timestamp: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error("❌ Setup error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Setup failed",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function GET() {
  try {
    // Check database status
    const { data, error } = await supabaseAdmin.from("users").select("count").limit(1)

    if (error) {
      return NextResponse.json(
        {
          success: false,
          message: "Database not accessible",
          error: error.message,
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      message: "Database is ready",
      data: {
        status: "connected",
        timestamp: new Date().toISOString(),
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: "Health check failed",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
