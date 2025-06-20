import { type NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { generateToken } from "@/lib/auth"
import bcrypt from "bcryptjs"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()

    if (!username || !password) {
      return NextResponse.json({ success: false, message: "Username and password are required" }, { status: 400 })
    }

    // Find user in database
    const { data: users, error } = await supabaseAdmin
      .from("users")
      .select("*")
      .eq("username", username)
      .eq("is_active", true)
      .limit(1)

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ success: false, message: "Database error" }, { status: 500 })
    }

    if (!users || users.length === 0) {
      return NextResponse.json({ success: false, message: "Invalid username or password" }, { status: 401 })
    }

    const user = users[0]

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash)

    if (!isValidPassword) {
      return NextResponse.json({ success: false, message: "Invalid username or password" }, { status: 401 })
    }

    // Generate JWT token
    const token = generateToken({
      user_id: user.id,
      username: user.username,
      role: user.role,
    })

    // Return success response
    return NextResponse.json({
      success: true,
      message: "Login successful",
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          fullName: user.full_name,
          role: user.role,
        },
      },
    })
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}
