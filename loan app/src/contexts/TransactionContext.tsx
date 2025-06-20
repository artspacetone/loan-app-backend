"use client"

// src/contexts/TransactionContext.tsx (Lengkap & Stabil)

import type React from "react"
import { createContext, useState, useContext, useCallback, useEffect } from "react"
import type { Transaction, Borrower, ReturnDetails, CreateTransactionPayload, CreateReturnPayload } from "../types"
import { inventoryService } from "../services/inventoryService"
import { useAuth } from "./AuthContext"

interface TransactionContextType {
  transactions: Transaction[]
  borrowers: Borrower[]
  isLoading: boolean
  // Fungsi-fungsi untuk memodifikasi data
  addTransaction: (transaction: CreateTransactionPayload) => Promise<Transaction>
  updateTransaction: (transactionId: string, updates: Partial<Transaction>) => Promise<void>
  addReturnToTransaction: (transactionId: string, returnDetails: CreateReturnPayload) => Promise<Transaction>
  updateReturnDetails: (transactionId: string, returnId: string, updates: Partial<ReturnDetails>) => Promise<void>
  addBorrower: (borrowerData: Omit<Borrower, "id" | "isBlocked">) => Promise<Borrower>
  updateBorrower: (borrowerId: string, updates: Partial<Borrower>) => Promise<void>
  // Fungsi untuk mendapatkan data dari state
  getTransactionById: (transactionId: string) => Transaction | undefined
}

const TransactionContext = createContext<TransactionContextType | null>(null)

export const TransactionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [borrowers, setBorrowers] = useState<Borrower[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const { user } = useAuth()

  const fetchInitialData = useCallback(async () => {
    setIsLoading(true)
    try {
      const [borrowersData, transactionsData] = await Promise.all([
        inventoryService.getBorrowers(),
        inventoryService.getTransactions(),
      ])
      setBorrowers(borrowersData)
      setTransactions(transactionsData)
    } catch (error) {
      console.error("Failed to load initial data", error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    // Muat data hanya jika ada user yang login
    if (user) {
      fetchInitialData()
    } else {
      // Kosongkan data jika tidak ada user (logout)
      setTransactions([])
      setBorrowers([])
    }
  }, [user, fetchInitialData])

  const addTransaction = async (transaction: CreateTransactionPayload): Promise<Transaction> => {
    const newTransaction = await inventoryService.createTransaction(transaction)
    setTransactions((prev) => [newTransaction, ...prev])
    return newTransaction
  }

  const updateTransaction = async (transactionId: string, updates: Partial<Transaction>) => {
    const updatedTransaction = await inventoryService.updateTransaction(transactionId, updates)
    setTransactions((prev) => prev.map((t) => (t.id === transactionId ? updatedTransaction : t)))
  }

  const addReturnToTransaction = async (
    transactionId: string,
    returnDetails: CreateReturnPayload,
  ): Promise<Transaction> => {
    const updatedTransaction = await inventoryService.addReturnToTransaction(transactionId, returnDetails)
    setTransactions((prev) => prev.map((t) => (t.id === transactionId ? updatedTransaction : t)))
    return updatedTransaction
  }

  const updateReturnDetails = async (transactionId: string, returnId: string, updates: Partial<ReturnDetails>) => {
    const updatedTransaction = await inventoryService.processReturnApproval(
      transactionId,
      returnId,
      updates.borrowerApproved || false,
    )
    setTransactions((prev) => prev.map((t) => (t.id === transactionId ? updatedTransaction : t)))
  }

  const addBorrower = async (borrowerData: Omit<Borrower, "id" | "isBlocked">): Promise<Borrower> => {
    const newOrUpdatedBorrower = await inventoryService.createBorrower(borrowerData)
    setBorrowers((prev) => {
      const index = prev.findIndex((b) => b.id === newOrUpdatedBorrower.id)
      if (index > -1) {
        const newBorrowers = [...prev]
        newBorrowers[index] = newOrUpdatedBorrower
        return newBorrowers
      }
      return [...prev, newOrUpdatedBorrower]
    })
    return newOrUpdatedBorrower
  }

  const updateBorrower = async (borrowerId: string, updates: Partial<Borrower>) => {
    const updatedBorrower = await inventoryService.updateBorrower(borrowerId, updates)
    setBorrowers((prev) => prev.map((b) => (b.id === borrowerId ? updatedBorrower : b)))
  }

  const getTransactionById = (transactionId: string): Transaction | undefined =>
    transactions.find((t) => t.id === transactionId)

  return (
    <TransactionContext.Provider
      value={{
        transactions,
        borrowers,
        isLoading,
        addTransaction,
        updateTransaction,
        getTransactionById,
        addReturnToTransaction,
        updateReturnDetails,
        addBorrower,
        updateBorrower,
      }}
    >
      {children}
    </TransactionContext.Provider>
  )
}

export const useTransactions = (): TransactionContextType => {
  const context = useContext(TransactionContext)
  if (!context) {
    throw new Error("useTransactions must be used within a TransactionProvider")
  }
  return context
}

// Add this export at the end of the file;
