import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-yellow-50">
      <div className="text-center space-y-6 p-8">
        <div className="space-y-2">
          <h1 className="text-6xl font-bold text-purple-600">404</h1>
          <h2 className="text-2xl font-semibold text-gray-800">Page Not Found</h2>
          <p className="text-gray-600 max-w-md mx-auto">The page you're looking for doesn't exist or has been moved.</p>
        </div>

        <div className="space-y-4">
          <Link href="/login">
            <Button className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3">Go to Login</Button>
          </Link>

          <div className="text-sm text-gray-500">
            <Link href="/api/health" className="text-purple-600 hover:underline">
              Check API Health
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
