import { type NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { verifyToken } from "@/lib/auth"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function GET(request: NextRequest) {
  try {
    const user = await verifyToken(request)
    if (!user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    const { data: users, error } = await supabaseAdmin.from("users").select("*").eq("id", user.user_id).limit(1)

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ success: false, message: "Database error" }, { status: 500 })
    }

    if (!users || users.length === 0) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 })
    }

    const userData = users[0]

    return NextResponse.json({
      success: true,
      data: {
        id: userData.id,
        username: userData.username,
        email: userData.email,
        fullName: userData.full_name,
        role: userData.role,
        isActive: userData.is_active,
        createdAt: userData.created_at,
        updatedAt: userData.updated_at,
      },
    })
  } catch (error) {
    console.error("Get user profile error:", error)
    return NextResponse.json({ success: false, message: "Failed to get user profile" }, { status: 500 })
  }
}
