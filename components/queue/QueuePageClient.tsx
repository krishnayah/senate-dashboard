"use client"

import { useState, useCallback, useRef } from "react"
import { QueueView } from "./QueueView"
import { SpeakerPanel } from "./SpeakerPanel"
import { SpeakLeaderboard } from "./SpeakLeaderboard"

interface Speaker {
    id: string
    name: string
    speakCount: number
}

export function QueuePageClient() {
    const [currentQueueId, setCurrentQueueId] = useState<string | null>(null)
    const addSpeakerToQueueRef = useRef<((speaker: Speaker) => void) | null>(null)
    const [refreshSpeakersKey, setRefreshSpeakersKey] = useState(0)

    const handleQueueChange = useCallback((queueId: string | null) => {
        setCurrentQueueId(queueId)
    }, [])

    const handleRefetchSpeakers = useCallback(() => {
        setRefreshSpeakersKey(prev => prev + 1)
    }, [])

    const handleSpeakerAdded = useCallback(() => {
        handleRefetchSpeakers()
    }, [handleRefetchSpeakers])

    const handleAddToQueue = useCallback((speaker: Speaker) => {
        if (addSpeakerToQueueRef.current) {
            addSpeakerToQueueRef.current(speaker)
        }
    }, [])

    return (
        <div className="space-y-6">
            <SpeakLeaderboard
                currentQueueId={currentQueueId}
                onAddToQueue={handleAddToQueue}
                refreshNonce={refreshSpeakersKey}
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <QueueView
                        onQueueChange={handleQueueChange}
                        onAddSpeakerRef={(fn) => { addSpeakerToQueueRef.current = fn }}
                        onRefetchSpeakers={handleRefetchSpeakers}
                    />
                </div>
                <div className="lg:col-span-1">
                    <SpeakerPanel
                        currentQueueId={currentQueueId}
                        onSpeakerAdded={handleSpeakerAdded}
                        onAddToQueue={handleAddToQueue}
                    />
                </div>
            </div>
        </div>
    )
}
