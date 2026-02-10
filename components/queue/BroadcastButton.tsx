"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"

interface LocalQueue {
    id: string
    name: string
    items: any[]
    parentId: string | null
    isActive: boolean
    createdAt: number
    speakerCounts: Record<string, number>
}

interface BroadcastButtonProps {
    queues: LocalQueue[]
}

export function BroadcastButton({ queues }: BroadcastButtonProps) {
    const [isBroadcasting, setIsBroadcasting] = useState(false)
    const [shareToken, setShareToken] = useState<string | null>(null)
    const [copied, setCopied] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const tokenRef = useRef<string | null>(null)

    const pushState = useCallback(async (token: string, queueData: LocalQueue[]) => {
        try {
            await fetch(`/api/queue/broadcast/${token}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ queues: queueData }),
            })
        } catch {
            // Silently fail on push errors
        }
    }, [])

    // Push queue state whenever it changes while broadcasting
    useEffect(() => {
        if (isBroadcasting && tokenRef.current) {
            pushState(tokenRef.current, queues)
        }
    }, [queues, isBroadcasting, pushState])

    const handleStartBroadcast = async () => {
        setError(null)
        try {
            const res = await fetch("/api/queue/broadcast", { method: "POST" })
            if (!res.ok) throw new Error("Failed to start broadcast")

            const { token } = await res.json()
            tokenRef.current = token
            setShareToken(token)
            setIsBroadcasting(true)

            // Push initial state
            await pushState(token, queues)
        } catch {
            setError("Failed to start broadcast")
        }
    }

    const handleStopBroadcast = async () => {
        if (!tokenRef.current) return

        try {
            await fetch("/api/queue/broadcast", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token: tokenRef.current }),
            })
        } catch {
            // Cleanup locally even if server call fails
        }

        tokenRef.current = null
        setShareToken(null)
        setIsBroadcasting(false)
        setCopied(false)
    }

    const handleCopyLink = async () => {
        if (!shareToken) return
        const url = `${window.location.origin}/queue/live/${shareToken}`
        try {
            await navigator.clipboard.writeText(url)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        } catch {
            // Fallback for older browsers
            const input = document.createElement("input")
            input.value = url
            document.body.appendChild(input)
            input.select()
            document.execCommand("copy")
            document.body.removeChild(input)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        }
    }

    if (!isBroadcasting) {
        return (
            <div>
                <Button
                    onClick={handleStartBroadcast}
                    variant="outline"
                    size="sm"
                    className="border-blue-300 text-blue-700 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-400 dark:hover:bg-blue-950"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1.5"><path d="M2 10v3"/><path d="M6 6v11"/><path d="M10 3v18"/><path d="M14 8v7"/><path d="M18 5v13"/><path d="M22 10v3"/></svg>
                    Broadcast Queue
                </Button>
                {error && <p className="text-xs text-destructive mt-1">{error}</p>}
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-2 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/50 p-3">
            <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                </span>
                <span className="text-xs font-semibold text-blue-800 dark:text-blue-300">Broadcasting Live</span>
            </div>

            <div className="flex items-center gap-1.5">
                <input
                    type="text"
                    readOnly
                    value={`${typeof window !== "undefined" ? window.location.origin : ""}/queue/live/${shareToken}`}
                    className="flex-1 rounded border bg-white dark:bg-background px-2 py-1 text-xs text-muted-foreground select-all"
                />
                <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCopyLink}
                    className="h-7 px-2 text-xs shrink-0"
                >
                    {copied ? "Copied!" : "Copy"}
                </Button>
            </div>

            <Button
                size="sm"
                variant="destructive"
                onClick={handleStopBroadcast}
                className="w-full h-7 text-xs"
            >
                Stop Broadcasting
            </Button>
        </div>
    )
}
