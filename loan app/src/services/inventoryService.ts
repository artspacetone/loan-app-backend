import type { Transaction, Borrower, ReturnDetails, CreateTransactionPayload, CreateReturnPayload } from "../types"
import { authService } from "./authService"

const API_BASE_URL =
  process.env.NODE_ENV === "production" ? "https://your-backend-api.vercel.app/api" : "http://localhost:5000/api"

interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message: string
  errors?: any
  pagination?: {
    page: number
    pages: number
    per_page: number
    total: number
    has_next: boolean
    has_prev: boolean
  }
}

export const inventoryService = {
  async getTransactions(params?: {
    page?: number
    per_page?: number
    status?: string
    transaction_type?: string
    search?: string
    date_from?: string
    date_to?: string
  }): Promise<{ transactions: Transaction[]; pagination?: any }> {
    try {
      const queryParams = new URLSearchParams()
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== "") {
            queryParams.append(key, value.toString())
          }
        })
      }

      const url = `${API_BASE_URL}/transactions${queryParams.toString() ? `?${queryParams.toString()}` : ""}`
      const response = await authService.makeAuthenticatedRequest<Transaction[]>(url)

      if (response.success) {
        return {
          transactions: response.data || [],
          pagination: response.pagination,
        }
      } else {
        throw new Error(response.message || "Failed to fetch transactions")
      }
    } catch (error) {
      console.error("Get transactions error:", error)
      throw error
    }
  },

  async getTransactionById(id: string): Promise<Transaction | null> {
    try {
      const response = await authService.makeAuthenticatedRequest<Transaction>(`${API_BASE_URL}/transactions/${id}`)

      if (response.success) {
        return response.data || null
      } else {
        return null
      }
    } catch (error) {
      console.error("Get transaction by ID error:", error)
      return null
    }
  },

  async createTransaction(transactionData: CreateTransactionPayload): Promise<Transaction> {
    try {
      const response = await authService.makeAuthenticatedRequest<Transaction>(`${API_BASE_URL}/transactions`, {
        method: "POST",
        body: JSON.stringify({
          borrow_date: transactionData.borrowDate,
          program_name: transactionData.programName,
          transaction_type: transactionData.transactionType,
          additional_number: transactionData.additionalNumber,
          item: {
            description: transactionData.item.description,
            quantity: transactionData.item.quantity,
            photo_url: transactionData.item.photoPreview,
          },
          borrower_id: transactionData.borrowerId,
          admin_id: transactionData.adminId,
        }),
      })

      if (response.success && response.data) {
        return response.data
      } else {
        throw new Error(response.message || "Failed to create transaction")
      }
    } catch (error) {
      console.error("Create transaction error:", error)
      throw error
    }
  },

  async updateTransaction(id: string, updates: Partial<Transaction>): Promise<Transaction> {
    try {
      const response = await authService.makeAuthenticatedRequest<Transaction>(`${API_BASE_URL}/transactions/${id}`, {
        method: "PATCH",
        body: JSON.stringify(updates),
      })

      if (response.success && response.data) {
        return response.data
      } else {
        throw new Error(response.message || "Failed to update transaction")
      }
    } catch (error) {
      console.error("Update transaction error:", error)
      throw error
    }
  },

  async addReturnToTransaction(transactionId: string, returnData: CreateReturnPayload): Promise<Transaction> {
    try {
      const response = await authService.makeAuthenticatedRequest<ReturnDetails>(
        `${API_BASE_URL}/transactions/${transactionId}/returns`,
        {
          method: "POST",
          body: JSON.stringify({
            return_date: returnData.returnDate,
            marked_photo_url: returnData.markedPhotoPreview,
            condition_notes: returnData.conditionNotes,
            returned_quantity: returnData.returnedQuantity,
            admin_id: returnData.adminId,
          }),
        },
      )

      if (response.success) {
        // Fetch updated transaction
        const updatedTransaction = await this.getTransactionById(transactionId)
        if (updatedTransaction) {
          return updatedTransaction
        }
      }

      throw new Error(response.message || "Failed to add return")
    } catch (error) {
      console.error("Add return error:", error)
      throw error
    }
  },

  async processReturnApproval(returnId: string, approved: boolean): Promise<void> {
    try {
      const response = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/returns/${returnId}/approve`, {
        method: "PATCH",
        body: JSON.stringify({ approved }),
      })

      if (!response.success) {
        throw new Error(response.message || "Failed to process return approval")
      }
    } catch (error) {
      console.error("Process return approval error:", error)
      throw error
    }
  },

  async getBorrowers(params?: {
    page?: number
    per_page?: number
    search?: string
    department?: string
    nik?: string
  }): Promise<{ borrowers: Borrower[]; pagination?: any }> {
    try {
      const queryParams = new URLSearchParams()
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== "") {
            queryParams.append(key, value.toString())
          }
        })
      }

      const url = `${API_BASE_URL}/borrowers${queryParams.toString() ? `?${queryParams.toString()}` : ""}`
      const response = await authService.makeAuthenticatedRequest<Borrower[]>(url)

      if (response.success) {
        return {
          borrowers: response.data || [],
          pagination: response.pagination,
        }
      } else {
        throw new Error(response.message || "Failed to fetch borrowers")
      }
    } catch (error) {
      console.error("Get borrowers error:", error)
      throw error
    }
  },

  async createBorrower(
    borrowerData: Omit<Borrower, "id" | "isBlocked" | "createdAt" | "updatedAt">,
  ): Promise<Borrower> {
    try {
      const response = await authService.makeAuthenticatedRequest<Borrower>(`${API_BASE_URL}/borrowers`, {
        method: "POST",
        body: JSON.stringify({
          nik: borrowerData.nik,
          name: borrowerData.name,
          department: borrowerData.department,
          phone: borrowerData.phone,
          supervisor_name: borrowerData.supervisorName,
          supervisor_phone: borrowerData.supervisorPhone,
        }),
      })

      if (response.success && response.data) {
        return response.data
      } else {
        throw new Error(response.message || "Failed to create borrower")
      }
    } catch (error) {
      console.error("Create borrower error:", error)
      throw error
    }
  },

  async updateBorrower(id: string, updates: Partial<Borrower>): Promise<Borrower> {
    try {
      const response = await authService.makeAuthenticatedRequest<Borrower>(`${API_BASE_URL}/borrowers/${id}`, {
        method: "PATCH",
        body: JSON.stringify(updates),
      })

      if (response.success && response.data) {
        return response.data
      } else {
        throw new Error(response.message || "Failed to update borrower")
      }
    } catch (error) {
      console.error("Update borrower error:", error)
      throw error
    }
  },

  async getDashboardStats(): Promise<{
    totalTransactions: number
    pendingApprovals: number
    overdueTransactions: number
    totalBorrowers: number
    blockedBorrowers: number
    recentTransactions: Transaction[]
  }> {
    try {
      const response = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/dashboard/stats`)

      if (response.success && response.data) {
        return response.data
      } else {
        throw new Error(response.message || "Failed to fetch dashboard stats")
      }
    } catch (error) {
      console.error("Get dashboard stats error:", error)
      throw error
    }
  },
}
