"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useAuth } from "../contexts/AuthContext"
import { useTransactions } from "../contexts/TransactionContext"
import PageTitle from "../components/PageTitle"
import LoadingSpinner from "../components/LoadingSpinner"
import StatusBadge from "../components/StatusBadge"
import Button from "../components/Button"
import {
  ChartBarIcon,
  UsersIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
} from "@heroicons/react/24/outline"
import { Link } from "react-router-dom"

interface DashboardStats {
  totalTransactions: number
  pendingApprovals: number
  overdueTransactions: number
  totalBorrowers: number
  blockedBorrowers: number
  recentTransactions: any[]
}

const DashboardPage: React.FC = () => {
  const { user, hasRole } = useAuth()
  const { transactions, borrowers, isLoading, fetchTransactions, fetchBorrowers } = useTransactions()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [isLoadingStats, setIsLoadingStats] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setIsLoadingStats(true)
      await Promise.all([fetchTransactions(), fetchBorrowers()])

      // Calculate stats from loaded data
      calculateStats()
    } catch (error) {
      console.error("Failed to load dashboard data:", error)
    } finally {
      setIsLoadingStats(false)
    }
  }

  const calculateStats = () => {
    const now = new Date()
    const pendingApprovals = transactions.filter((t) => t.status === "PENDING_APPROVAL").length
    const overdueTransactions = transactions.filter((t) => {
      const deadline = new Date(t.deadlineDate)
      return t.status === "NVL" && deadline < now
    }).length
    const blockedBorrowers = borrowers.filter((b) => b.isBlocked).length
    const recentTransactions = transactions
      .sort((a, b) => new Date(b.borrowDate).getTime() - new Date(a.borrowDate).getTime())
      .slice(0, 5)

    setStats({
      totalTransactions: transactions.length,
      pendingApprovals,
      overdueTransactions,
      totalBorrowers: borrowers.length,
      blockedBorrowers,
      recentTransactions,
    })
  }

  useEffect(() => {
    if (transactions.length > 0 && borrowers.length > 0) {
      calculateStats()
    }
  }, [transactions, borrowers])

  if (isLoading || isLoadingStats) {
    return (
      <>
        <PageTitle title="Dashboard" />
        <LoadingSpinner message="Loading dashboard..." />
      </>
    )
  }

  const StatCard: React.FC<{
    title: string
    value: number
    icon: React.ComponentType<any>
    color: string
    description?: string
    actionLink?: string
    actionText?: string
  }> = ({ title, value, icon: Icon, color, description, actionLink, actionText }) => (
    <div className="bg-white rounded-lg shadow-md p-6 border-l-4" style={{ borderLeftColor: color }}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
          {description && <p className="text-xs text-gray-500 mt-1">{description}</p>}
        </div>
        <div className="flex-shrink-0">
          <Icon className="h-8 w-8" style={{ color }} />
        </div>
      </div>
      {actionLink && actionText && (
        <div className="mt-4">
          <Link to={actionLink}>
            <Button size="sm" variant="outline" className="text-xs">
              {actionText}
            </Button>
          </Link>
        </div>
      )}
    </div>
  )

  return (
    <div className="space-y-6">
      <PageTitle
        title={`Welcome back, ${user?.username}!`}
        subtitle="Here's what's happening with your inventory system today."
      />

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        <StatCard
          title="Total Transactions"
          value={stats?.totalTransactions || 0}
          icon={DocumentTextIcon}
          color="#3B82F6"
          description="All time"
          actionLink="/incoming-list"
          actionText="View All"
        />

        <StatCard
          title="Pending Approvals"
          value={stats?.pendingApprovals || 0}
          icon={ClockIcon}
          color="#F59E0B"
          description="Needs attention"
          actionLink="/approval"
          actionText="Review"
        />

        <StatCard
          title="Overdue Items"
          value={stats?.overdueTransactions || 0}
          icon={ExclamationTriangleIcon}
          color="#EF4444"
          description="Past deadline"
          actionLink="/reports"
          actionText="View Details"
        />

        <StatCard
          title="Total Borrowers"
          value={stats?.totalBorrowers || 0}
          icon={UsersIcon}
          color="#10B981"
          description="Registered users"
        />

        <StatCard
          title="Blocked Borrowers"
          value={stats?.blockedBorrowers || 0}
          icon={XCircleIcon}
          color="#EF4444"
          description="Restricted access"
          actionLink="/supervisor"
          actionText="Manage"
        />

        <StatCard
          title="System Health"
          value={100}
          icon={CheckCircleIcon}
          color="#10B981"
          description="All systems operational"
        />
      </div>

      {/* Admin Quick Actions */}
      {hasRole(["ADMIN", "SUPERVISOR"]) && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link to="/incoming-form">
              <Button className="w-full justify-center" variant="primary">
                <DocumentTextIcon className="h-5 w-5 mr-2" />
                New Transaction
              </Button>
            </Link>

            <Link to="/approval">
              <Button className="w-full justify-center" variant="secondary">
                <ClockIcon className="h-5 w-5 mr-2" />
                Review Approvals
              </Button>
            </Link>

            <Link to="/reports">
              <Button className="w-full justify-center" variant="outline">
                <ChartBarIcon className="h-5 w-5 mr-2" />
                Generate Reports
              </Button>
            </Link>

            {hasRole(["ADMIN"]) && (
              <Link to="/supervisor">
                <Button className="w-full justify-center" variant="success">
                  <UsersIcon className="h-5 w-5 mr-2" />
                  Manage System
                </Button>
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Recent Transactions */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Recent Transactions</h3>
          <Link to="/incoming-list">
            <Button size="sm" variant="outline">
              <EyeIcon className="h-4 w-4 mr-1" />
              View All
            </Button>
          </Link>
        </div>

        {stats?.recentTransactions && stats.recentTransactions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Transaction #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Item
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Borrower
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {stats.recentTransactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {transaction.transactionNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {transaction.item.description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {transaction.borrowerSnapshot.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={transaction.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(transaction.borrowDate).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8">
            <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No transactions yet</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by creating a new transaction.</p>
            <div className="mt-6">
              <Link to="/incoming-form">
                <Button variant="primary">
                  <DocumentTextIcon className="h-5 w-5 mr-2" />
                  New Transaction
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* System Alerts */}
      {(stats?.pendingApprovals || 0) > 0 || (stats?.overdueTransactions || 0) > 0 ? (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                <strong>Attention Required:</strong>
                {(stats?.pendingApprovals || 0) > 0 && (
                  <span> {stats?.pendingApprovals} transactions pending approval.</span>
                )}
                {(stats?.overdueTransactions || 0) > 0 && <span> {stats?.overdueTransactions} items are overdue.</span>}
              </p>
              <div className="mt-2 flex space-x-2">
                {(stats?.pendingApprovals || 0) > 0 && (
                  <Link to="/approval">
                    <Button size="sm" variant="secondary">
                      Review Approvals
                    </Button>
                  </Link>
                )}
                {(stats?.overdueTransactions || 0) > 0 && (
                  <Link to="/reports">
                    <Button size="sm" variant="secondary">
                      View Overdue
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <CheckCircleIcon className="h-5 w-5 text-green-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-green-700">
                <strong>All Good!</strong> No pending approvals or overdue items.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DashboardPage
