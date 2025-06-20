import { NextResponse } from "next/server"
import { validateConfig } from "@/lib/config"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function GET() {
  try {
    const validation = validateConfig()

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Configuration validation failed",
          error: validation.message,
          missing: validation.missing,
          help: {
            message: "Please add the missing environment variables in Vercel dashboard",
            steps: [
              "1. Go to Vercel Dashboard",
              "2. Select your project",
              "3. Go to Settings → Environment Variables",
              "4. Add the missing variables",
              "5. Redeploy the application",
            ],
          },
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      message: "Configuration is valid",
      data: {
        hasSupabaseUrl: !!process.env.SUPABASE_NEXT_PUBLIC_SUPABASE_URL,
        hasSupabaseAnonKey: !!proSUPABASE_NEXT_PUBLIC_SUPABASE_ANON_KEY_ANON_KEY,
        hasServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        hasJwtSecret: !!process.env.JWT_SECRET,
        timestamp: new Date().toISOString(),
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: "Configuration check failed",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
