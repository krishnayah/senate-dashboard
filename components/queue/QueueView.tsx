"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { QueueCard, LocalQueueItem, DiscussionInfo } from "./QueueCard"
import { BroadcastButton } from "./BroadcastButton"
import { v4 as uuidv4 } from "uuid"

interface Speaker {
    id: string
    name: string
    speakCount: number
}

const DISCUSSION_TOTAL_SEC = 45 * 60
const DISCUSSION_PER_SPEAKER_SEC = 5 * 60

// Client-side queue structure
interface LocalQueue {
    id: string
    name: string
    items: LocalQueueItem[]
    parentId: string | null
    isActive: boolean
    createdAt: number
    // Map of speakerId -> count for this specific queue
    speakerCounts: Record<string, number>
    type?: "normal" | "discussion"
    discussionStartedAt?: number
    currentSpeakerStartedAt?: number | null
    totalDurationSec?: number
    perSpeakerDurationSec?: number
}

interface QueueViewProps {
    onQueueChange?: (currentQueueId: string | null) => void
    onAddSpeakerRef: (callback: (speaker: Speaker) => void) => void
    onRefetchSpeakers: () => void
}

function getDiscussionInfo(q: LocalQueue): DiscussionInfo | null {
    if (q.type !== "discussion" || !q.discussionStartedAt) return null
    return {
        discussionStartedAt: q.discussionStartedAt,
        currentSpeakerStartedAt: q.currentSpeakerStartedAt ?? null,
        totalDurationSec: q.totalDurationSec ?? DISCUSSION_TOTAL_SEC,
        perSpeakerDurationSec: q.perSpeakerDurationSec ?? DISCUSSION_PER_SPEAKER_SEC,
    }
}

export function QueueView({ onQueueChange, onAddSpeakerRef, onRefetchSpeakers }: QueueViewProps) {
    const [queues, setQueues] = useState<LocalQueue[]>([])
    const [loading, setLoading] = useState(true)

    // Load queues from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem("senate_queues")
        if (saved) {
            try {
                const parsed = JSON.parse(saved)
                // Migration: Ensure speakerCounts exists on older queues
                const migrated = parsed.map((q: any) => ({
                    ...q,
                    speakerCounts: q.speakerCounts || {}
                }))
                setQueues(migrated)
            } catch (e) {
                console.error("Failed to parse saved queues", e)
            }
        }
        setLoading(false)
    }, [])

    // Ensure there's always a main queue if empty
    useEffect(() => {
        if (!loading && queues.length === 0) {
            const mainQueue: LocalQueue = {
                id: uuidv4(),
                name: "Main Queue",
                items: [],
                parentId: null,
                isActive: true,
                createdAt: Date.now(),
                speakerCounts: {},
                type: "normal"
            }
            setQueues([mainQueue])
        }
    }, [loading, queues.length])

    // Save to localStorage whenever queues change
    useEffect(() => {
        if (!loading && queues.length > 0) {
            localStorage.setItem("senate_queues", JSON.stringify(queues))

            // Find active queue ID
            const activeQueueChain = getActiveQueueChain()
            const currentQueue = activeQueueChain.length > 0 ? activeQueueChain[activeQueueChain.length - 1] : null
            onQueueChange?.(currentQueue?.id || null)
        }
    }, [queues, loading, onQueueChange])

    // Helper to get the chain of active queues
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

    const handleCreateMainQueue = () => {
        if (confirm("Are you sure you want to reset all queues?")) {
            const mainQueue: LocalQueue = {
                id: uuidv4(),
                name: "Main Queue",
                items: [],
                parentId: null,
                isActive: true,
                createdAt: Date.now(),
                speakerCounts: {},
                type: "normal"
            }
            setQueues([mainQueue])
        }
    }

    const handleOpenSubqueue = (parentId: string, name: string) => {
        const subqueue: LocalQueue = {
            id: uuidv4(),
            name,
            items: [],
            parentId,
            isActive: true,
            createdAt: Date.now(),
            speakerCounts: {},
            type: "normal"
        }
        setQueues(prev => [...prev, subqueue])
    }

    const handleOpenDiscussionQueue = (parentId: string) => {
        const now = Date.now()
        const discussionQueue: LocalQueue = {
            id: uuidv4(),
            name: "Discussion Queue",
            items: [],
            parentId,
            isActive: true,
            createdAt: now,
            speakerCounts: {},
            type: "discussion",
            discussionStartedAt: now,
            currentSpeakerStartedAt: null,
            totalDurationSec: DISCUSSION_TOTAL_SEC,
            perSpeakerDurationSec: DISCUSSION_PER_SPEAKER_SEC,
        }
        setQueues(prev => [...prev, discussionQueue])
    }

    const handleCloseQueue = (queueId: string) => {
        setQueues(prev => prev.filter(q => q.id !== queueId))
    }

    const addSpeakerToQueue = useCallback((speaker: Speaker) => {
        setQueues(prev => {
            // Find active queue (tip of the chain)
            const allActive = prev.filter(q => q.isActive)
            const root = allActive.find(q => q.parentId === null)
            if (!root) return prev

            let current = root
            while (true) {
                const child = allActive.find(q => q.parentId === current.id)
                if (!child) break
                current = child
            }

            const activeQueueId = current.id

            return prev.map(q => {
                if (q.id === activeQueueId) {
                    // Check if speaker already exists
                    if (q.items.some(i => i.speaker.id === speaker.id)) {
                        return q
                    }

                    // Get speak count ONLY for this queue
                    const localSpeakCount = q.speakerCounts[speaker.id] || 0

                    // Priority insertion based on local speak count
                    const items = [...q.items]
                    let insertIndex = items.length

                    for (let i = 0; i < items.length; i++) {
                        const itemSpeakerId = items[i].speaker.id
                        const itemLocalCount = q.speakerCounts[itemSpeakerId] || 0

                        if (itemLocalCount > localSpeakCount) {
                            insertIndex = i
                            break
                        }
                    }

                    const displaySpeaker = {
                        ...speaker,
                        speakCount: localSpeakCount
                    }

                    const newItem: LocalQueueItem = {
                        id: uuidv4(),
                        speaker: displaySpeaker,
                        position: insertIndex,
                        createdAt: Date.now()
                    }

                    items.splice(insertIndex, 0, newItem)

                    const reindexed = items.map((item, idx) => ({
                        ...item,
                        position: idx
                    }))

                    // If this is a discussion queue and the first speaker just
                    // appeared at position 0, start the per-speaker timer.
                    const wasEmpty = q.items.length === 0
                    const nextCurrentStartedAt =
                        q.type === "discussion" && wasEmpty
                            ? Date.now()
                            : q.currentSpeakerStartedAt ?? null

                    return { ...q, items: reindexed, currentSpeakerStartedAt: nextCurrentStartedAt }
                }
                return q
            })
        })
    }, [])

    const handleRemoveSpeaker = (queueId: string, itemId: string) => {
        setQueues(prev => prev.map(q => {
            if (q.id === queueId) {
                const wasCurrent = q.items[0]?.id === itemId
                const items = q.items.filter(i => i.id !== itemId)

                let nextCurrentStartedAt = q.currentSpeakerStartedAt ?? null
                if (q.type === "discussion" && wasCurrent) {
                    nextCurrentStartedAt = items.length > 0 ? Date.now() : null
                }

                return { ...q, items, currentSpeakerStartedAt: nextCurrentStartedAt }
            }
            return q
        }))
    }

    const handleNextSpeaker = async (queueId: string) => {
        let speakerToIncrement: Speaker | null = null

        setQueues(prev => prev.map(q => {
            if (q.id === queueId && q.items.length > 0) {
                const items = [...q.items]
                const removed = items.shift() // Remove first

                if (removed) {
                    speakerToIncrement = removed.speaker
                    const speakerId = removed.speaker.id

                    const newCounts = { ...q.speakerCounts }
                    newCounts[speakerId] = (newCounts[speakerId] || 0) + 1

                    const nextCurrentStartedAt =
                        q.type === "discussion"
                            ? items.length > 0 ? Date.now() : null
                            : q.currentSpeakerStartedAt ?? null

                    return {
                        ...q,
                        items,
                        speakerCounts: newCounts,
                        currentSpeakerStartedAt: nextCurrentStartedAt,
                    }
                }
                return { ...q, items }
            }
            return q
        }))

        if (speakerToIncrement) {
            try {
                await fetch(`/api/speakers/${(speakerToIncrement as Speaker).id}/increment`, {
                    method: "POST"
                })
                onRefetchSpeakers()
            } catch (e) {
                console.error("Failed to increment speak count", e)
            }
        }
    }

    // Register the add speaker handler
    useEffect(() => {
        onAddSpeakerRef(addSpeakerToQueue)
    }, [onAddSpeakerRef, addSpeakerToQueue])


    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600"></div>
            </div>
        )
    }

    const activeChain = getActiveQueueChain()
    const currentQueue = activeChain.length > 0 ? activeChain[activeChain.length - 1] : null

    return (
        <div className="space-y-4">
            {/* Breadcrumb trail of parent queues (collapsed) */}
            {activeChain.slice(0, -1).map((queue) => (
                <QueueCard
                    key={queue.id}
                    id={queue.id}
                    name={queue.name}
                    items={queue.items}
                    isCollapsed={true}
                    isCurrentQueue={false}
                    discussion={getDiscussionInfo(queue)}
                    onOpenSubqueue={() => { }}
                    onCloseQueue={() => { }}
                    onRemoveSpeaker={() => { }}
                    onNextSpeaker={() => { }}
                />
            ))}

            {/* Current active queue (expanded) */}
            {currentQueue && (
                <QueueCard
                    key={currentQueue.id}
                    id={currentQueue.id}
                    name={currentQueue.name}
                    items={currentQueue.items}
                    isCollapsed={false}
                    isCurrentQueue={true}
                    discussion={getDiscussionInfo(currentQueue)}
                    onOpenSubqueue={(name) => handleOpenSubqueue(currentQueue.id, name)}
                    onOpenDiscussionQueue={() => handleOpenDiscussionQueue(currentQueue.id)}
                    onCloseQueue={() => handleCloseQueue(currentQueue.id)}
                    onRemoveSpeaker={(itemId) => handleRemoveSpeaker(currentQueue.id, itemId)}
                    onNextSpeaker={() => handleNextSpeaker(currentQueue.id)}
                />
            )}

            {/* Broadcast + Reset */}
            <div className="flex items-start justify-between pt-4 gap-4">
                <BroadcastButton queues={queues} />
                <Button variant="outline" size="sm" onClick={handleCreateMainQueue}>
                    Reset All Queues
                </Button>
            </div>
        </div>
    )
}
