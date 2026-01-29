
// Simplified version of use-toast hook
import { useState, useEffect } from "react"

export interface Toast {
    id: string
    title?: string
    description?: string
    action?: React.ReactNode
    variant?: "default" | "destructive"
}

export function useToast() {
    const [toasts, setToasts] = useState<Toast[]>([])

    const toast = ({ title, description, variant }: Omit<Toast, "id">) => {
        const id = Math.random().toString(36).substring(2, 9)
        const newToast = { id, title, description, variant }
        setToasts((prev) => [...prev, newToast])

        // Auto dismiss
        setTimeout(() => {
            dismiss(id)
        }, 3000)

        return {
            id,
            dismiss: () => dismiss(id),
            update: (props: Partial<Toast>) => {
                setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, ...props } : t)))
            }
        }
    }

    const dismiss = (id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id))
    }

    return {
        toast,
        dismiss,
        toasts,
    }
}
