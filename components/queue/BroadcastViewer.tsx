"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { QueueCard, LocalQueueItem, DiscussionInfo } from "./QueueCard"

interface LocalQueue {
    id: string
    name: string
    items: LocalQueueItem[]
    parentId: string | null
    isActive: boolean
    createdAt: number
    speakerCounts: Record<string, number>
    type?: "normal" | "discussion"
    discussionStartedAt?: number
    currentSpeakerStartedAt?: number | null
    totalDurationSec?: number
    perSpeakerDurationSec?: number
}

function getDiscussionInfo(q: LocalQueue): DiscussionInfo | null {
    if (q.type !== "discussion" || !q.discussionStartedAt) return null
    return {
        discussionStartedAt: q.discussionStartedAt,
        currentSpeakerStartedAt: q.currentSpeakerStartedAt ?? null,
        totalDurationSec: q.totalDurationSec ?? 45 * 60,
        perSpeakerDurationSec: q.perSpeakerDurationSec ?? 5 * 60,
    }
}

type ConnectionStatus = "connecting" | "connected" | "disconnected"

interface BroadcastViewerProps {
    token: string
}

export function BroadcastViewer({ token }: BroadcastViewerProps) {
    const [queues, setQueues] = useState<LocalQueue[]>([])
    const [status, setStatus] = useState<ConnectionStatus>("connecting")
    const eventSourceRef = useRef<EventSource | null>(null)
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)

    const connect = useCallback(() => {
        if (eventSourceRef.current) {
            eventSourceRef.current.close()
        }

        setStatus("connecting")
        const es = new EventSource(`/api/queue/broadcast/${token}`)
        eventSourceRef.current = es

        es.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data)
                setQueues(data)
                setStatus("connected")
            } catch {
                // Ignore parse errors
            }
        }

        // Handle broadcast closed event from server
        es.addEventListener("closed", () => {
            es.close()
            eventSourceRef.current = null
            setStatus("disconnected")
        })

        es.onerror = () => {
            es.close()
            eventSourceRef.current = null
            setStatus("disconnected")

            // Auto-reconnect after 3 seconds
            reconnectTimeoutRef.current = setTimeout(() => {
                connect()
            }, 3000)
        }
    }, [token])

    useEffect(() => {
        connect()

        return () => {
            if (eventSourceRef.current) {
                eventSourceRef.current.close()
            }
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current)
            }
        }
    }, [connect])

    // Get active queue chain (same logic as QueueView)
    const getActiveQueueChain = useCallback(() => {
        if (queues.length === 0) return []

        const allActive = queues.filter(q => q.isActive)
        const root = allActive.find(q => q.parentId === null)
        if (!root) return []

        const chain = [root]
        let current = root

        while (true) {
            const child = allActive.find(q => q.parentId === current.id)
            if (!child) break
            chain.push(child)
            current = child
        }

        return chain
    }, [queues])

    const activeChain = getActiveQueueChain()
    const currentQueue = activeChain.length > 0 ? activeChain[activeChain.length - 1] : null
    const noop = () => {}

    return (
        <div className="space-y-4">
            {/* Connection Status */}
            <div className="flex items-center gap-2">
                <span className={`inline-flex h-2.5 w-2.5 rounded-full ${
                    status === "connected" ? "bg-green-500" :
                    status === "connecting" ? "bg-yellow-500 animate-pulse" :
                    "bg-gray-400"
                }`} />
                <span className="text-sm text-muted-foreground">
                    {status === "connected" && "Live"}
                    {status === "connecting" && "Connecting..."}
                    {status === "disconnected" && "Reconnecting..."}
                </span>
            </div>

            {/* Breadcrumb trail of parent queues (collapsed) */}
            {activeChain.slice(0, -1).map((queue) => (
                <QueueCard
                    key={queue.id}
                    id={queue.id}
                    name={queue.name}
                    items={queue.items}
                    isCollapsed={true}
                    isCurrentQueue={false}
                    readOnly={true}
                    discussion={getDiscussionInfo(queue)}
                    onOpenSubqueue={noop}
                    onCloseQueue={noop}
                    onRemoveSpeaker={noop}
                    onNextSpeaker={noop}
                />
            ))}

            {/* Current active queue */}
            {currentQueue ? (
                <QueueCard
                    key={currentQueue.id}
                    id={currentQueue.id}
                    name={currentQueue.name}
                    items={currentQueue.items}
                    isCollapsed={false}
                    isCurrentQueue={true}
                    readOnly={true}
                    discussion={getDiscussionInfo(currentQueue)}
                    onOpenSubqueue={noop}
                    onCloseQueue={noop}
                    onRemoveSpeaker={noop}
                    onNextSpeaker={noop}
                />
            ) : (
                status === "connected" && (
                    <div className="text-center py-12 text-muted-foreground">
                        No active queue
                    </div>
                )
            )}
        </div>
    )
}
