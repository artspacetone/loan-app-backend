"use client"

import type React from "react"
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import { AuthProvider } from "./contexts/AuthContext"
import { TransactionProvider } from "./contexts/TransactionContext"
import ErrorBoundary from "./components/ErrorBoundary"
import ProtectedRoute from "./components/ProtectedRoute"
import Layout from "./components/Layout"
import LoginPage from "./pages/LoginPage"
import DashboardPage from "./pages/DashboardPage"
import OutgoingFormPage from "./pages/OutgoingFormPage"
import IncomingFormPage from "./pages/IncomingFormPage"
import IncomingListPage from "./pages/IncomingListPage"
import ApprovalPage from "./pages/ApprovalPage"
import SupervisorPage from "./pages/SupervisorPage"
import ReportsPage from "./pages/ReportsPage"
import ProfilePage from "./pages/ProfilePage"
import PrintIncomingPage from "./pages/PrintIncomingPage"
import PrintOutgoingPage from "./pages/PrintOutgoingPage"
import { AppRoutes, UserRole } from "./constants"

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <TransactionProvider>
          <Router>
            <Routes>
              {/* Public routes */}
              <Route path={AppRoutes.LOGIN} element={<LoginPage />} />

              {/* Protected routes */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Navigate to={AppRoutes.DASHBOARD} replace />} />

                <Route path={AppRoutes.DASHBOARD} element={<DashboardPage />} />

                <Route
                  path={AppRoutes.OUTGOING_FORM}
                  element={
                    <ProtectedRoute requiredRoles={[UserRole.ADMIN, UserRole.USER]}>
                      <OutgoingFormPage />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path={AppRoutes.INCOMING_FORM}
                  element={
                    <ProtectedRoute requiredRoles={[UserRole.ADMIN, UserRole.USER]}>
                      <IncomingFormPage />
                    </ProtectedRoute>
                  }
                />

                <Route path={AppRoutes.INCOMING_LIST} element={<IncomingListPage />} />

                <Route
                  path={AppRoutes.APPROVAL}
                  element={
                    <ProtectedRoute requiredRoles={[UserRole.ADMIN, UserRole.SUPERVISOR]}>
                      <ApprovalPage />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path={AppRoutes.SUPERVISOR}
                  element={
                    <ProtectedRoute requiredRoles={[UserRole.SUPERVISOR]}>
                      <SupervisorPage />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path={AppRoutes.REPORTS}
                  element={
                    <ProtectedRoute requiredRoles={[UserRole.ADMIN, UserRole.SUPERVISOR]}>
                      <ReportsPage />
                    </ProtectedRoute>
                  }
                />

                <Route path={AppRoutes.PROFILE} element={<ProfilePage />} />
              </Route>

              {/* Print routes (outside main layout) */}
              <Route
                path={AppRoutes.PRINT_INCOMING}
                element={
                  <ProtectedRoute>
                    <PrintIncomingPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path={AppRoutes.PRINT_OUTGOING}
                element={
                  <ProtectedRoute>
                    <PrintOutgoingPage />
                  </ProtectedRoute>
                }
              />

              {/* Catch all route */}
              <Route
                path="*"
                element={
                  <div className="min-h-screen flex items-center justify-center bg-gray-50">
                    <div className="text-center">
                      <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
                      <p className="text-gray-600 mb-4">Page not found</p>
                      <button
                        onClick={() => window.history.back()}
                        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                      >
                        Go Back
                      </button>
                    </div>
                  </div>
                }
              />
            </Routes>
          </Router>
        </TransactionProvider>
      </AuthProvider>
    </ErrorBoundary>
  )
}

export default App
