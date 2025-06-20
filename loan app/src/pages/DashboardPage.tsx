"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import PageTitle from "../components/PageTitle"
import Button from "../components/Button"
import StatusBadge from "../components/StatusBadge"
import LoadingSpinner from "../components/LoadingSpinner"
import { useTransactions } from "../contexts/TransactionContext"
import { useAuth } from "../contexts/AuthContext"
import { TransactionStatus } from "../types"
import { AppRoutes } from "../constants"
import {
  PlusIcon,
  ClipboardDocumentListIcon,
  UserGroupIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ChartBarIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline"

interface DashboardStats {
  totalTransactions: number
  pendingApprovals: number
  overdueTransactions: number
  completedTransactions: number
  totalBorrowers: number
}

const DashboardPage: React.FC = () => {
  const { transactions, borrowers, isLoading } = useTransactions()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState<DashboardStats>({
    totalTransactions: 0,
    pendingApprovals: 0,
    overdueTransactions: 0,
    completedTransactions: 0,
    totalBorrowers: 0,
  })

  useEffect(() => {
    if (transactions && borrowers) {
      const now = new Date()
      const pendingApprovals = transactions.filter((t) => t.status === TransactionStatus.PENDING_APPROVAL).length
      const overdueTransactions = transactions.filter((t) => {
        const deadline = new Date(t.deadlineDate)
        return deadline < now && (t.status === TransactionStatus.NVL || t.status === TransactionStatus.PENDING_APPROVAL)
      }).length
      const completedTransactions = transactions.filter((t) => t.status === TransactionStatus.AVL).length

      setStats({
        totalTransactions: transactions.length,
        pendingApprovals,
        overdueTransactions,
        completedTransactions,
        totalBorrowers: borrowers.length,
      })
    }
  }, [transactions, borrowers])

  const recentTransactions = transactions?.slice(0, 5) || []
  const pendingApprovalTransactions = transactions?.filter((t) => t.status === TransactionStatus.PENDING_APPROVAL) || []
  const overdueTransactions =
    transactions?.filter((t) => {
      const deadline = new Date(t.deadlineDate)
      const now = new Date()
      return deadline < now && (t.status === TransactionStatus.NVL || t.status === TransactionStatus.PENDING_APPROVAL)
    }) || []

  const getStatusIcon = (status: TransactionStatus) => {
    switch (status) {
      case TransactionStatus.PENDING_APPROVAL:
        return <ClockIcon className="h-5 w-5 text-yellow-500" />
      case TransactionStatus.NVL:
        return <ExclamationTriangleIcon className="h-5 w-5 text-orange-500" />
      case TransactionStatus.AVL:
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />
      default:
        return <XCircleIcon className="h-5 w-5 text-gray-500" />
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
  }

  if (isLoading) {
    return <LoadingSpinner message="Memuat dashboard..." />
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <PageTitle title={`👋 Selamat datang, ${user?.username}!`} subtitle="Dashboard Inventory Management System" />
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Link to={AppRoutes.OUTGOING_FORM}>
            <Button variant="primary" className="flex items-center">
              <PlusIcon className="h-5 w-5 mr-2" />📤 Buat Peminjaman
            </Button>
          </Link>
          <Link to={AppRoutes.INCOMING_FORM}>
            <Button variant="secondary" className="flex items-center">
              <PlusIcon className="h-5 w-5 mr-2" />📥 Proses Pengembalian
            </Button>
          </Link>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Transaksi</p>
              <p className="text-3xl font-bold text-blue-600">{stats.totalTransactions}</p>
            </div>
            <ChartBarIcon className="h-12 w-12 text-blue-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Approval</p>
              <p className="text-3xl font-bold text-yellow-600">{stats.pendingApprovals}</p>
            </div>
            <ClockIcon className="h-12 w-12 text-yellow-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Terlambat</p>
              <p className="text-3xl font-bold text-red-600">{stats.overdueTransactions}</p>
            </div>
            <ExclamationTriangleIcon className="h-12 w-12 text-red-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Selesai</p>
              <p className="text-3xl font-bold text-green-600">{stats.completedTransactions}</p>
            </div>
            <CheckCircleIcon className="h-12 w-12 text-green-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Peminjam</p>
              <p className="text-3xl font-bold text-purple-600">{stats.totalBorrowers}</p>
            </div>
            <UserGroupIcon className="h-12 w-12 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Alerts Section */}
      {(pendingApprovalTransactions.length > 0 || overdueTransactions.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pending Approvals Alert */}
          {pendingApprovalTransactions.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <div className="flex items-center mb-4">
                <ClockIcon className="h-6 w-6 text-yellow-500 mr-2" />
                <h3 className="text-lg font-semibold text-yellow-800">
                  ⏳ Menunggu Approval ({pendingApprovalTransactions.length})
                </h3>
              </div>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {pendingApprovalTransactions.slice(0, 3).map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between bg-white p-3 rounded border">
                    <div>
                      <p className="font-medium text-sm">{transaction.transactionNumber}</p>
                      <p className="text-xs text-gray-600">{transaction.borrowerSnapshot.name}</p>
                    </div>
                    <Link to={`${AppRoutes.APPROVAL}/${transaction.id}?type=outgoing`}>
                      <Button variant="outline" size="sm" className="bg-yellow-100 text-yellow-800 border-yellow-300">
                        Review
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
              {pendingApprovalTransactions.length > 3 && (
                <p className="text-xs text-yellow-700 mt-2">
                  +{pendingApprovalTransactions.length - 3} transaksi lainnya
                </p>
              )}
            </div>
          )}

          {/* Overdue Alert */}
          {overdueTransactions.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <div className="flex items-center mb-4">
                <ExclamationTriangleIcon className="h-6 w-6 text-red-500 mr-2" />
                <h3 className="text-lg font-semibold text-red-800">
                  🚨 Terlambat Dikembalikan ({overdueTransactions.length})
                </h3>
              </div>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {overdueTransactions.slice(0, 3).map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between bg-white p-3 rounded border">
                    <div>
                      <p className="font-medium text-sm">{transaction.transactionNumber}</p>
                      <p className="text-xs text-gray-600">Deadline: {formatDate(transaction.deadlineDate)}</p>
                    </div>
                    <Button variant="outline" size="sm" className="bg-red-100 text-red-800 border-red-300">
                      Follow Up
                    </Button>
                  </div>
                ))}
              </div>
              {overdueTransactions.length > 3 && (
                <p className="text-xs text-red-700 mt-2">+{overdueTransactions.length - 3} transaksi lainnya</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Recent Transactions */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center">
              <DocumentTextIcon className="h-6 w-6 mr-2" />📋 Transaksi Terbaru
            </h3>
            <Link to={AppRoutes.OUTGOING_LIST}>
              <Button variant="outline" size="sm">
                Lihat Semua
              </Button>
            </Link>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Transaksi
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Peminjam
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Barang
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tanggal
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recentTransactions.length > 0 ? (
                recentTransactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getStatusIcon(transaction.status)}
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900">{transaction.transactionNumber}</p>
                          <p className="text-xs text-gray-500">{transaction.programName}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{transaction.borrowerSnapshot.name}</p>
                        <p className="text-xs text-gray-500">{transaction.borrowerSnapshot.department}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate">{transaction.item.description}</div>
                      <div className="text-xs text-gray-500">Qty: {transaction.item.quantity}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={transaction.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(transaction.borrowDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        {transaction.status === TransactionStatus.PENDING_APPROVAL && (
                          <Link to={`${AppRoutes.APPROVAL}/${transaction.id}?type=outgoing`}>
                            <Button
                              variant="outline"
                              size="sm"
                              className="bg-yellow-50 text-yellow-700 border-yellow-200"
                            >
                              Review
                            </Button>
                          </Link>
                        )}
                        <Link to={`${AppRoutes.PRINT_OUTGOING}/${transaction.id}`}>
                          <Button variant="outline" size="sm">
                            Print
                          </Button>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="text-gray-500">
                      <ClipboardDocumentListIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p className="text-lg font-medium">Belum ada transaksi</p>
                      <p className="text-sm">Mulai dengan membuat transaksi peminjaman baru</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">🚀 Aksi Cepat</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link to={AppRoutes.OUTGOING_FORM}>
            <div className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
              <PlusIcon className="h-8 w-8 text-blue-500 mb-2" />
              <p className="font-medium text-gray-800">Buat Peminjaman</p>
              <p className="text-xs text-gray-500">Tambah transaksi baru</p>
            </div>
          </Link>

          <Link to={AppRoutes.INCOMING_FORM}>
            <div className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
              <DocumentTextIcon className="h-8 w-8 text-green-500 mb-2" />
              <p className="font-medium text-gray-800">Proses Return</p>
              <p className="text-xs text-gray-500">Kelola pengembalian</p>
            </div>
          </Link>

          <Link to={AppRoutes.OUTGOING_LIST}>
            <div className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
              <ClipboardDocumentListIcon className="h-8 w-8 text-purple-500 mb-2" />
              <p className="font-medium text-gray-800">Lihat Semua</p>
              <p className="text-xs text-gray-500">Daftar transaksi</p>
            </div>
          </Link>

          <Link to={AppRoutes.REPORTS}>
            <div className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
              <ChartBarIcon className="h-8 w-8 text-orange-500 mb-2" />
              <p className="font-medium text-gray-800">Laporan</p>
              <p className="text-xs text-gray-500">Analisis data</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default DashboardPage
