// src/components/StatusBadge.tsx

import type React from "react"
import { type Transaction, TransactionStatus } from "../types"

interface StatusBadgeProps {
  transaction: Transaction
}

const isOverdue = (deadline: string): boolean => {
  const today = new Date()
  today.setHours(0, 0, 0, 0) // Compare date only, ignore time
  const deadlineDate = new Date(deadline)
  deadlineDate.setHours(0, 0, 0, 0)
  return deadlineDate < today
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ transaction }) => {
  const { status, deadlineDate } = transaction
  const overdue = status === TransactionStatus.NVL && isOverdue(deadlineDate)

  let text = status.replace(/_/g, " ")
  let colorClasses = "bg-gray-100 text-gray-800"

  if (overdue) {
    text = "OVERDUE"
    colorClasses = "bg-red-100 text-red-800"
  } else if (status === TransactionStatus.NVL) {
    colorClasses = "bg-yellow-100 text-yellow-800"
  } else if (status === TransactionStatus.AVL) {
    colorClasses = "bg-green-100 text-green-800"
  } else if (status === TransactionStatus.PENDING_APPROVAL) {
    colorClasses = "bg-blue-100 text-blue-800"
  }

  return <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${colorClasses}`}>{text}</span>
}

export { StatusBadge as default }
