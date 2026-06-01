'use client'

import React, { createContext, useContext, useState, useCallback } from 'react'
import * as Toast from '@radix-ui/react-toast'

type ToastVariant = 'success' | 'error' | 'info'

interface ToastMessage {
  id: string
  message: string
  variant: ToastVariant
}

interface ToastContextType {
  showToast: (message: string, variant: ToastVariant) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const showToast = useCallback((message: string, variant: ToastVariant) => {
    const id = Math.random().toString(36).slice(2)
    setToasts((prev) => [...prev, { id, message, variant }])

    // Auto-remove after 4 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 4000)
  }, [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      <Toast.Provider swipeDirection="right">
        {children}
        <Toast.Viewport className="fixed bottom-0 right-0 z-[100] flex flex-col gap-2 p-4 md:bottom-4 md:right-4 w-full md:w-96" />
        {toasts.map((toast) => (
          <ToastRoot key={toast.id} message={toast.message} variant={toast.variant} />
        ))}
      </Toast.Provider>
    </ToastContext.Provider>
  )
}

function ToastRoot({ message, variant }: { message: string; variant: ToastVariant }) {
  const [open, setOpen] = useState(true)

  const borderColor = {
    success: 'border-l-4 border-l-green-500 bg-green-50',
    error: 'border-l-4 border-l-red-500 bg-red-50',
    info: 'border-l-4 border-l-gray-400 bg-gray-50',
  }[variant]

  const textColor = {
    success: 'text-green-900',
    error: 'text-red-900',
    info: 'text-gray-900',
  }[variant]

  return (
    <Toast.Root open={open} onOpenChange={setOpen} className={`rounded-lg px-4 py-3 shadow-lg ${borderColor}`}>
      <Toast.Title className={`text-sm font-medium ${textColor}`}>{message}</Toast.Title>
    </Toast.Root>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}
