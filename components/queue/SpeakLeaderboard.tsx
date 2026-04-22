"use client"

import { useEffect, useMemo } from "react"
import { useSpeakers } from "@/hooks/useSpeakers"
import { Speaker } from "@/types"

interface SpeakLeaderboardProps {
    limit?: number
    currentQueueId: string | null
    onAddToQueue: (speaker: Speaker) => void
    refreshNonce?: number
}

export function SpeakLeaderboard({ limit = 5, currentQueueId, onAddToQueue, refreshNonce = 0 }: SpeakLeaderboardProps) {
    const { speakers, loading, fetchSpeakers } = useSpeakers()

    useEffect(() => {
        if (refreshNonce > 0) fetchSpeakers()
    }, [refreshNonce])

    const ranked = useMemo(() => {
        const senators = speakers.filter(s =>
            s.groups.some(g => g.name.toLowerCase() === "senate")
        )
        const pool = senators.length > 0 ? senators : speakers
        return [...pool]
            .filter(s => s.speakCount > 0)
            .sort((a, b) => b.speakCount - a.speakCount || a.name.localeCompare(b.name))
            .slice(0, limit)
    }, [speakers, limit])

    if (loading || ranked.length === 0) return null

    const disabled = !currentQueueId

    return (
        <div className="flex items-center gap-2 text-xs rounded-md border bg-muted/30 px-3 py-2 overflow-x-auto">
            <span className="font-semibold uppercase tracking-wider text-muted-foreground shrink-0">
                Most spoken
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
                {ranked.map((speaker) => (
                    <button
                        key={speaker.id}
                        onClick={() => onAddToQueue(speaker)}
                        disabled={disabled}
                        title={disabled ? "Open a queue to add speakers" : `Add ${speaker.name} to queue`}
                        className="rounded-full border bg-background px-2.5 py-0.5 font-medium hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-800 dark:hover:bg-emerald-950/40 dark:hover:text-emerald-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {speaker.name}
                    </button>
                ))}
            </div>
        </div>
    )
}
