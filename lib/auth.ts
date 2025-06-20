import type { NextRequest } from "next/server"
import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || "inventory-management-jwt-secret-key-2024"

export interface TokenPayload {
  user_id: number
  username: string
  role: string
}

export async function verifyToken(request: NextRequest): Promise<TokenPayload | null> {
  try {
    // Get authorization header
    const authHeader = request.headers.get("authorization")

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log("❌ No valid authorization header found")
      return null
    }

    const token = authHeader.substring(7)

    if (!token) {
      console.log("❌ No token provided")
      return null
    }

    // Verify JWT token
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload
    console.log("✅ Token verified for user:", decoded.username)

    return decoded
  } catch (error) {
    console.error("❌ Token verification failed:", error)
    return null
  }
}

export function generateToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "24h" })
}
