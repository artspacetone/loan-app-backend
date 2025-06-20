import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { verifyToken } from "@/lib/auth"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function GET(request: NextRequest) {
  try {
    const user = await verifyToken(request)
    if (!user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    // Get dashboard statistics
    const [totalItems] = await sql`SELECT COUNT(*) as count FROM inventory_items`

    const [lowStockItems] = await sql`
      SELECT COUNT(*) as count FROM inventory_items 
      WHERE quantity <= min_quantity
    `

    const [pendingTransactions] = await sql`
      SELECT COUNT(*) as count FROM transactions 
      WHERE status = 'pending'
    `

    const [completedTransactions] = await sql`
      SELECT COUNT(*) as count FROM transactions 
      WHERE status = 'completed' 
      AND DATE_TRUNC('month', completed_date) = DATE_TRUNC('month', CURRENT_DATE)
    `

    const recentTransactions = await sql`
      SELECT * FROM transactions 
      ORDER BY request_date DESC 
      LIMIT 5
    `

    return NextResponse.json({
      success: true,
      data: {
        totalItems: Number.parseInt(totalItems.count),
        lowStockItems: Number.parseInt(lowStockItems.count),
        pendingTransactions: Number.parseInt(pendingTransactions.count),
        completedTransactions: Number.parseInt(completedTransactions.count),
        recentTransactions: recentTransactions.map((trans) => ({
          id: trans.id,
          type: trans.type,
          itemName: trans.item_name,
          quantity: trans.quantity,
          status: trans.status,
          requestDate: trans.request_date,
          requestedBy: trans.requested_by,
        })),
      },
    })
  } catch (error) {
    console.error("Dashboard stats error:", error)
    return NextResponse.json({ success: false, message: "Failed to get dashboard stats" }, { status: 500 })
  }
}
