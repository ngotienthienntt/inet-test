'use client'

import { useEffect } from 'react'
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface ToastData {
  id: number
  message: string
  type: ToastType
}

const ICONS = {
  success: <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />,
  error: <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />,
  warning: <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0" />,
  info: <Info className="w-5 h-5 text-blue-500 flex-shrink-0" />,
}

const STYLES = {
  success: 'border-green-200 bg-green-50',
  error: 'border-red-200 bg-red-50',
  warning: 'border-yellow-200 bg-yellow-50',
  info: 'border-blue-200 bg-blue-50',
}

const TEXT_STYLES = {
  success: 'text-green-800',
  error: 'text-red-800',
  warning: 'text-yellow-800',
  info: 'text-blue-800',
}

interface ToastItemProps {
  toast: ToastData
  onClose: (id: number) => void
  duration?: number
}

function ToastItem({ toast, onClose, duration = 4000 }: ToastItemProps) {
  useEffect(() => {
    const t = setTimeout(() => onClose(toast.id), duration)
    return () => clearTimeout(t)
  }, [toast.id, onClose, duration])

  return (
    <div className={`flex items-start gap-3 px-4 py-3 rounded-xl border shadow-lg w-full max-w-sm animate-slide-in ${STYLES[toast.type]}`}>
      {ICONS[toast.type]}
      <p className={`flex-1 text-sm font-medium ${TEXT_STYLES[toast.type]}`}>{toast.message}</p>
      <button
        type="button"
        onClick={() => onClose(toast.id)}
        className="text-gray-400 hover:text-gray-600 flex-shrink-0"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}

interface ToastContainerProps {
  toasts: ToastData[]
  onClose: (id: number) => void
}

export function ToastContainer({ toasts, onClose }: ToastContainerProps) {
  if (toasts.length === 0) return null
  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 items-end">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onClose={onClose} />
      ))}
    </div>
  )
}
