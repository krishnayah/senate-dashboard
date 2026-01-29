"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { QueueCard, LocalQueueItem } from "./QueueCard"
import { v4 as uuidv4 } from "uuid"

interface Speaker {
    id: string
    name: string
    type: string
    speakCount: number
}

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
}

interface QueueViewProps {
    onQueueChange?: (currentQueueId: string | null) => void
    onAddSpeakerRef: (callback: (speaker: Speaker) => void) => void
    onRefetchSpeakers: () => void
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
                speakerCounts: {}
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
                speakerCounts: {}
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
            speakerCounts: {}
        }
        setQueues(prev => [...prev, subqueue])
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
                        // We need to look up speak count for the existing item in the queue map
                        // But wait, the item.speaker object might have stale data or global data
                        // The item.speaker object comes from the DB, so it has global count.
                        // We must use the local map for comparison.

                        // However, QueueItem currently stores a full Speaker object.
                        // Ideally we should update the logic to trust the local map for priority.

                        const itemSpeakerId = items[i].speaker.id
                        const itemLocalCount = q.speakerCounts[itemSpeakerId] || 0

                        if (itemLocalCount > localSpeakCount) {
                            insertIndex = i
                            break
                        }
                    }

                    // Create a modified speaker object that reflects the LOCAL count for display purposes
                    // (Optional: if we want the UI to show queue-specific count, we can override it here)
                    // The user said "times spoken feature should be PER QUEUE".
                    // So we should probably override the speakCount in the stored item for display.
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

                    // Re-index positions
                    const reindexed = items.map((item, idx) => ({
                        ...item,
                        position: idx
                    }))

                    return { ...q, items: reindexed }
                }
                return q
            })
        })
    }, [])

    const handleRemoveSpeaker = (queueId: string, itemId: string) => {
        setQueues(prev => prev.map(q => {
            if (q.id === queueId) {
                const items = q.items.filter(i => i.id !== itemId)
                return { ...q, items }
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

                    // Increment count for this queue
                    const newCounts = { ...q.speakerCounts }
                    newCounts[speakerId] = (newCounts[speakerId] || 0) + 1

                    return { ...q, items, speakerCounts: newCounts }
                }
                return { ...q, items }
            }
            return q
        }))

        // Call API to increment GLOBAL speak count as well (if desired)
        // User said "Speakers should still be stored globally".
        // Usually, global stats are useful, but "times spoken feature" (for priority) is per queue.
        // We will uphold the API call so the database has a record of total speaks.
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
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
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
                    onOpenSubqueue={(name) => handleOpenSubqueue(currentQueue.id, name)}
                    onCloseQueue={() => handleCloseQueue(currentQueue.id)}
                    onRemoveSpeaker={(itemId) => handleRemoveSpeaker(currentQueue.id, itemId)}
                    onNextSpeaker={() => handleNextSpeaker(currentQueue.id)}
                />
            )}

            {/* Reset button */}
            <div className="flex justify-center pt-4">
                <Button variant="outline" size="sm" onClick={handleCreateMainQueue}>
                    Reset All Queues
                </Button>
            </div>
        </div>
    )
}
