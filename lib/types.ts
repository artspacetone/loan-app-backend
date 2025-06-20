export interface User {
  id: string
  username: string
  email: string
  role: "admin" | "supervisor" | "user"
  fullName: string
  createdAt: string
  updatedAt: string
}

export interface InventoryItem {
  id: string
  name: string
  description: string
  category: string
  quantity: number
  unit: string
  price: number
  location: string
  status: "available" | "low_stock" | "out_of_stock"
  createdAt: string
  updatedAt: string
}

export interface Transaction {
  id: string
  type: "incoming" | "outgoing"
  itemId: string
  itemName: string
  quantity: number
  requestedBy: string
  approvedBy?: string
  status: "pending" | "approved" | "rejected" | "completed"
  reason: string
  notes?: string
  requestDate: string
  approvalDate?: string
  completedDate?: string
}

export interface AuthContextType {
  user: User | null
  login: (credentials: { username: string; password: string }) => Promise<void>
  logout: () => void
  loading: boolean
}

export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}
