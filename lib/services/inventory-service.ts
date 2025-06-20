import { apiClient } from "../api-client"
import type { InventoryItem, Transaction, PaginatedResponse } from "../types"

export class InventoryService {
  private static instance: InventoryService

  static getInstance(): InventoryService {
    if (!InventoryService.instance) {
      InventoryService.instance = new InventoryService()
    }
    return InventoryService.instance
  }

  // Inventory Items
  async getInventoryItems(params?: {
    page?: number
    limit?: number
    search?: string
    category?: string
    status?: string
  }): Promise<PaginatedResponse<InventoryItem>> {
    const queryParams = new URLSearchParams()

    if (params?.page) queryParams.append("page", params.page.toString())
    if (params?.limit) queryParams.append("limit", params.limit.toString())
    if (params?.search) queryParams.append("search", params.search)
    if (params?.category) queryParams.append("category", params.category)
    if (params?.status) queryParams.append("status", params.status)

    const query = queryParams.toString()
    const endpoint = query ? `/api/inventory?${query}` : "/api/inventory"

    return apiClient.getInventoryItems()
  }

  async getInventoryItem(id: string): Promise<InventoryItem> {
    return apiClient.request(`/api/inventory/${id}`)
  }

  async createInventoryItem(item: Omit<InventoryItem, "id" | "createdAt" | "updatedAt">): Promise<InventoryItem> {
    return apiClient.createInventoryItem(item)
  }

  async updateInventoryItem(id: string, item: Partial<InventoryItem>): Promise<InventoryItem> {
    return apiClient.updateInventoryItem(id, item)
  }

  async deleteInventoryItem(id: string): Promise<void> {
    return apiClient.deleteInventoryItem(id)
  }

  // Transactions
  async getTransactions(params?: {
    page?: number
    limit?: number
    type?: "incoming" | "outgoing"
    status?: string
    userId?: string
  }): Promise<PaginatedResponse<Transaction>> {
    const queryParams = new URLSearchParams()

    if (params?.page) queryParams.append("page", params.page.toString())
    if (params?.limit) queryParams.append("limit", params.limit.toString())
    if (params?.type) queryParams.append("type", params.type)
    if (params?.status) queryParams.append("status", params.status)
    if (params?.userId) queryParams.append("userId", params.userId)

    return apiClient.getTransactions()
  }

  async getTransaction(id: string): Promise<Transaction> {
    return apiClient.request(`/api/transactions/${id}`)
  }

  async createTransaction(transaction: Omit<Transaction, "id" | "requestDate" | "status">): Promise<Transaction> {
    return apiClient.createTransaction({
      ...transaction,
      status: "pending",
      requestDate: new Date().toISOString(),
    })
  }

  async updateTransactionStatus(id: string, status: Transaction["status"], notes?: string): Promise<Transaction> {
    return apiClient.updateTransactionStatus(id, status)
  }

  async approveTransaction(id: string, notes?: string): Promise<Transaction> {
    return this.updateTransactionStatus(id, "approved", notes)
  }

  async rejectTransaction(id: string, notes?: string): Promise<Transaction> {
    return this.updateTransactionStatus(id, "rejected", notes)
  }

  async completeTransaction(id: string): Promise<Transaction> {
    return this.updateTransactionStatus(id, "completed")
  }

  // Dashboard Stats
  async getDashboardStats(): Promise<{
    totalItems: number
    lowStockItems: number
    pendingTransactions: number
    completedTransactions: number
    recentTransactions: Transaction[]
  }> {
    return apiClient.request("/api/dashboard/stats")
  }

  // Reports
  async getInventoryReport(params?: {
    startDate?: string
    endDate?: string
    category?: string
  }): Promise<any> {
    const queryParams = new URLSearchParams()

    if (params?.startDate) queryParams.append("startDate", params.startDate)
    if (params?.endDate) queryParams.append("endDate", params.endDate)
    if (params?.category) queryParams.append("category", params.category)

    const query = queryParams.toString()
    const endpoint = query ? `/api/reports/inventory?${query}` : "/api/reports/inventory"

    return apiClient.request(endpoint)
  }

  async getTransactionReport(params?: {
    startDate?: string
    endDate?: string
    type?: "incoming" | "outgoing"
  }): Promise<any> {
    const queryParams = new URLSearchParams()

    if (params?.startDate) queryParams.append("startDate", params.startDate)
    if (params?.endDate) queryParams.append("endDate", params.endDate)
    if (params?.type) queryParams.append("type", params.type)

    const query = queryParams.toString()
    const endpoint = query ? `/api/reports/transactions?${query}` : "/api/reports/transactions"

    return apiClient.request(endpoint)
  }
}

export const inventoryService = InventoryService.getInstance()
