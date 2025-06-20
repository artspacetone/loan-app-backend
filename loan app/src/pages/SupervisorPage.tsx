"use client"

import type React from "react"
import { useState, useEffect } from "react"
import PageTitle from "../components/PageTitle"
import Button from "../components/Button"
import Input from "../components/Input"
import Select from "../components/Select"
import ImageUpload from "../components/ImageUpload"
import { useAuth } from "../contexts/AuthContext"
import { useTransactions } from "../contexts/TransactionContext"
import type { User } from "../types"
import { UserRole } from "../constants"
import LoadingSpinner from "../components/LoadingSpinner"
import { userService } from "../services/userService"
import {
  UserPlusIcon,
  ShieldCheckIcon,
  DocumentArrowDownIcon,
  CogIcon,
  TrashIcon,
  PencilIcon,
  EyeIcon,
  UserIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline"

const SupervisorPage: React.FC = () => {
  const { user, updateCompanyLogo, hasRole } = useAuth()
  const { borrowers, transactions, isLoading: isLoadingBorrowers, fetchBorrowers, updateBorrower } = useTransactions()

  // Company Logo State
  const [companyLogoFile, setCompanyLogoFile] = useState<File | null>(null)
  const [companyLogoPreview, setCompanyLogoPreview] = useState<string | null>(user?.companyLogo || null)

  // User Management State
  const [managedUsers, setManagedUsers] = useState<User[]>([])
  const [isLoadingUsers, setIsLoadingUsers] = useState(false)
  const [newUserName, setNewUserName] = useState("")
  const [newUserRole, setNewUserRole] = useState<UserRole>(UserRole.USER)
  const [newUserPassword, setNewUserPassword] = useState("")

  // UI State
  const [message, setMessage] = useState<string>("")
  const [activeTab, setActiveTab] = useState<"users" | "borrowers" | "system" | "reports">("users")
  const [editingUser, setEditingUser] = useState<User | null>(null)

  useEffect(() => {
    fetchBorrowers()
    if (hasRole(["ADMIN"])) {
      fetchManagedUsers()
    }
  }, [])

  const fetchManagedUsers = async () => {
    setIsLoadingUsers(true)
    try {
      const users = await userService.getUsers()
      setManagedUsers(users)
    } catch (error) {
      setMessage(`Error fetching users: ${(error as Error).message}`)
    }
    setIsLoadingUsers(false)
  }

  const handleLogoUpload = async () => {
    if (companyLogoFile && companyLogoPreview) {
      setMessage("Uploading logo...")
      try {
        await new Promise((resolve) => setTimeout(resolve, 1000))
        updateCompanyLogo(companyLogoPreview)
        setMessage("Company logo updated successfully!")
        setTimeout(() => setMessage(""), 3000)
      } catch (error) {
        setMessage("Failed to update logo.")
      }
    } else {
      setMessage("Please select a logo to upload.")
    }
  }

  const handleCreateUser = async () => {
    if (!newUserName.trim()) {
      setMessage("Username cannot be empty.")
      return
    }
    if (!newUserPassword.trim() || newUserPassword.length < 6) {
      setMessage("Password must be at least 6 characters.")
      return
    }

    setIsLoadingUsers(true)
    try {
      await userService.createUser({
        username: newUserName,
        role: newUserRole,
        password: newUserPassword,
      })
      setMessage(`User ${newUserName} (${newUserRole}) created successfully.`)
      setNewUserName("")
      setNewUserPassword("")
      setNewUserRole(UserRole.USER)
      fetchManagedUsers()
      setTimeout(() => setMessage(""), 3000)
    } catch (error) {
      setMessage(`Error creating user: ${(error as Error).message}`)
    }
    setIsLoadingUsers(false)
  }

  const handleUpdateUser = async (userId: string, updates: Partial<User>) => {
    try {
      await userService.updateUser(userId, updates)
      setMessage("User updated successfully.")
      fetchManagedUsers()
      setEditingUser(null)
      setTimeout(() => setMessage(""), 3000)
    } catch (error) {
      setMessage(`Error updating user: ${(error as Error).message}`)
    }
  }

  const handleDeleteUser = async (userId: string, username: string) => {
    if (window.confirm(`Are you sure you want to deactivate user "${username}"?`)) {
      try {
        await userService.updateUser(userId, { isActive: false })
        setMessage(`User ${username} deactivated successfully.`)
        fetchManagedUsers()
        setTimeout(() => setMessage(""), 3000)
      } catch (error) {
        setMessage(`Error deactivating user: ${(error as Error).message}`)
      }
    }
  }

  const toggleBlockBorrower = async (borrowerId: string, currentBlockedStatus: boolean) => {
    setMessage(`Updating borrower status...`)
    try {
      await updateBorrower(borrowerId, { isBlocked: !currentBlockedStatus })
      setMessage(`Borrower status updated successfully!`)
      setTimeout(() => setMessage(""), 3000)
    } catch (error) {
      setMessage(`Failed to update borrower status: ${(error as Error).message}`)
    }
  }

  const handleExportReport = () => {
    setMessage("Generating report...")
    const headers = "TransactionID,Borrower,Item,BorrowDate,Deadline,Status\n"
    const csvData = transactions
      .map(
        (t) =>
          `${t.transactionNumber},${t.borrowerSnapshot.name},${t.item.description},${t.borrowDate},${t.deadlineDate},${t.status}`,
      )
      .join("\n")
    const blob = new Blob([headers + csvData], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob)
      link.setAttribute("href", url)
      link.setAttribute("download", `inventory_report_${new Date().toISOString().split("T")[0]}.csv`)
      link.style.visibility = "hidden"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
    setMessage("Report exported successfully.")
    setTimeout(() => setMessage(""), 3000)
  }

  const TabButton: React.FC<{ tab: string; label: string; icon: React.ComponentType<any> }> = ({
    tab,
    label,
    icon: Icon,
  }) => (
    <button
      onClick={() => setActiveTab(tab as any)}
      className={`flex items-center px-4 py-2 font-medium text-sm rounded-md transition-colors ${
        activeTab === tab ? "bg-blue-600 text-white shadow-md" : "text-gray-600 hover:bg-blue-50 hover:text-blue-600"
      }`}
    >
      <Icon className="h-4 w-4 mr-2" />
      {label}
    </button>
  )

  return (
    <div className="space-y-6">
      <PageTitle title="System Administration" subtitle="Manage users, borrowers, and system settings." />

      {message && (
        <div
          className={`p-4 rounded-md ${
            message.includes("Error") || message.includes("Failed")
              ? "bg-red-50 text-red-700 border border-red-200"
              : "bg-green-50 text-green-700 border border-green-200"
          }`}
        >
          <div className="flex">
            <ExclamationTriangleIcon className="h-5 w-5 mr-2 flex-shrink-0" />
            <p className="text-sm">{message}</p>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-4">
        {hasRole(["ADMIN"]) && <TabButton tab="users" label="User Management" icon={UserIcon} />}
        <TabButton tab="borrowers" label="Borrower Management" icon={UserPlusIcon} />
        <TabButton tab="system" label="System Settings" icon={CogIcon} />
        <TabButton tab="reports" label="Reports & Export" icon={DocumentArrowDownIcon} />
      </div>

      {/* User Management Tab */}
      {activeTab === "users" && hasRole(["ADMIN"]) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Create New User */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <UserPlusIcon className="h-5 w-5 mr-2" />
              Create New User
            </h3>
            <div className="space-y-4">
              <Input
                label="Username"
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
                placeholder="Enter username"
                required
              />
              <Input
                label="Password"
                type="password"
                value={newUserPassword}
                onChange={(e) => setNewUserPassword(e.target.value)}
                placeholder="Enter password (min 6 characters)"
                required
              />
              <Select
                label="Role"
                value={newUserRole}
                onChange={(e) => setNewUserRole(e.target.value as UserRole)}
                options={[
                  { value: UserRole.USER, label: "User" },
                  { value: UserRole.ADMIN, label: "Admin" },
                  { value: UserRole.SUPERVISOR, label: "Supervisor" },
                ]}
              />
              <Button onClick={handleCreateUser} isLoading={isLoadingUsers} variant="primary" className="w-full">
                <UserPlusIcon className="h-4 w-4 mr-2" />
                Create User
              </Button>
            </div>
          </div>

          {/* User List */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <ShieldCheckIcon className="h-5 w-5 mr-2" />
              Existing Users ({managedUsers.length})
            </h3>
            {isLoadingUsers ? (
              <LoadingSpinner message="Loading users..." />
            ) : managedUsers.length > 0 ? (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {managedUsers.map((u) => (
                  <div key={u.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <span className="font-medium text-gray-900">{u.username}</span>
                        <span
                          className={`ml-2 px-2 py-1 text-xs rounded-full ${
                            u.role === "ADMIN"
                              ? "bg-red-100 text-red-800"
                              : u.role === "SUPERVISOR"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-green-100 text-green-800"
                          }`}
                        >
                          {u.role}
                        </span>
                        {!u.isActive && (
                          <span className="ml-2 px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">
                            Inactive
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">
                        Created: {new Date(u.createdAt || "").toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline" onClick={() => setEditingUser(u)}>
                        <PencilIcon className="h-3 w-3" />
                      </Button>
                      {u.id !== user?.id && (
                        <Button size="sm" variant="danger" onClick={() => handleDeleteUser(u.id, u.username)}>
                          <TrashIcon className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No users found.</p>
            )}
          </div>
        </div>
      )}

      {/* Borrower Management Tab */}
      {activeTab === "borrowers" && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <UserIcon className="h-5 w-5 mr-2" />
            Borrower Management ({borrowers.length} total)
          </h3>
          {isLoadingBorrowers ? (
            <LoadingSpinner message="Loading borrowers..." />
          ) : borrowers.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">NIK</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {borrowers.map((b) => (
                    <tr key={b.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="font-medium text-gray-900">{b.name}</div>
                        <div className="text-sm text-gray-500">{b.supervisorName}</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{b.nik}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{b.department}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{b.phone}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            b.isBlocked ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"
                          }`}
                        >
                          {b.isBlocked ? "Blocked" : "Active"}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant={b.isBlocked ? "success" : "danger"}
                            onClick={() => toggleBlockBorrower(b.id, b.isBlocked)}
                          >
                            {b.isBlocked ? "Unblock" : "Block"}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No borrowers found.</p>
          )}
        </div>
      )}

      {/* System Settings Tab */}
      {activeTab === "system" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Company Logo */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Company Logo</h3>
            <ImageUpload
              onFileSelect={(file, preview) => {
                setCompanyLogoFile(file)
                setCompanyLogoPreview(preview)
              }}
              currentImageUrl={user?.companyLogo}
              label="Upload New Company Logo (Max 2MB)"
            />
            <Button onClick={handleLogoUpload} className="mt-4 w-full" variant="primary">
              Update Logo
            </Button>
          </div>

          {/* System Information */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">System Information</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Users:</span>
                <span className="font-medium">{managedUsers.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Borrowers:</span>
                <span className="font-medium">{borrowers.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Transactions:</span>
                <span className="font-medium">{transactions.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">System Version:</span>
                <span className="font-medium">v2.0.0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Last Backup:</span>
                <span className="font-medium">Never</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reports & Export Tab */}
      {activeTab === "reports" && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
            Reports & Data Export
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Button onClick={handleExportReport} variant="primary" className="flex items-center justify-center">
              <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
              Export All Transactions (CSV)
            </Button>
            <Button
              onClick={() => setMessage("Backup feature would be implemented with proper backend storage.")}
              variant="secondary"
              className="flex items-center justify-center"
            >
              <ShieldCheckIcon className="h-5 w-5 mr-2" />
              Backup Database
            </Button>
            <Button
              onClick={() => setMessage("System maintenance logs would be available in production.")}
              variant="outline"
              className="flex items-center justify-center"
            >
              <EyeIcon className="h-5 w-5 mr-2" />
              View System Logs
            </Button>
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Available Reports:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• All Transactions Report (CSV format)</li>
              <li>• Overdue Items Report (Available in Reports page)</li>
              <li>• Borrower Activity Report</li>
              <li>• System Usage Statistics</li>
            </ul>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Edit User: {editingUser.username}</h3>
            <div className="space-y-4">
              <Select
                label="Role"
                value={editingUser.role}
                onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value as UserRole })}
                options={[
                  { value: UserRole.USER, label: "User" },
                  { value: UserRole.ADMIN, label: "Admin" },
                  { value: UserRole.SUPERVISOR, label: "Supervisor" },
                ]}
              />
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={editingUser.isActive !== false}
                  onChange={(e) => setEditingUser({ ...editingUser, isActive: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <label htmlFor="isActive" className="text-sm text-gray-700">
                  Active User
                </label>
              </div>
            </div>
            <div className="flex space-x-3 mt-6">
              <Button
                onClick={() => handleUpdateUser(editingUser.id, editingUser)}
                variant="primary"
                className="flex-1"
              >
                Save Changes
              </Button>
              <Button onClick={() => setEditingUser(null)} variant="outline" className="flex-1">
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SupervisorPage
