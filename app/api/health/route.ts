import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function GET() {
  try {
    // Test database connection
    const { data, error } = await supabaseAdmin.from("users").select("count").limit(1)

    if (error) {
      return NextResponse.json(
        {
          success: false,
          message: "Database connection failed",
          error: error.message,
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      message: "System is healthy",
      data: {
        status: "ok",
        database: "connected",
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
