import type React from "react"

interface PageTitleProps {
  title: string
  subtitle?: string
}

const PageTitle: React.FC<PageTitleProps> = ({ title, subtitle }) => {
  return (
    <div className="mb-6 pb-2 border-b border-gray-300">
      <h1 className="text-3xl font-bold text-gray-800">{title}</h1>
      {subtitle && <p className="text-sm text-gray-600 mt-1">{subtitle}</p>}
    </div>
  )
}

export { PageTitle as default }
