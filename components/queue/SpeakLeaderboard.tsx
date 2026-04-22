"use client"

import { useMemo } from "react"
import { useSpeakers } from "@/hooks/useSpeakers"

interface SpeakLeaderboardProps {
    limit?: number
}

export function SpeakLeaderboard({ limit = 5 }: SpeakLeaderboardProps) {
    const { speakers, loading } = useSpeakers()

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

    return (
        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2 flex items-center justify-between">
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                    Most Spoken Senators
                </h2>
                <span className="text-[10px] font-semibold text-white/80 uppercase tracking-wider">
                    All-time
                </span>
            </div>

            <div className="p-3">
                {loading ? (
                    <div className="animate-pulse space-y-2">
                        <div className="h-5 bg-muted rounded w-3/4"></div>
                        <div className="h-5 bg-muted rounded w-1/2"></div>
                        <div className="h-5 bg-muted rounded w-2/3"></div>
                    </div>
                ) : ranked.length === 0 ? (
                    <p className="text-center text-xs text-muted-foreground py-3">
                        No speaking counts yet. Advance speakers to start tracking.
                    </p>
                ) : (
                    <ol className="space-y-1.5">
                        {ranked.map((speaker, index) => {
                            const medal =
                                index === 0 ? "bg-amber-400 text-amber-950" :
                                index === 1 ? "bg-slate-300 text-slate-800" :
                                index === 2 ? "bg-orange-400 text-orange-950" :
                                "bg-muted text-muted-foreground"
                            return (
                                <li
                                    key={speaker.id}
                                    className="flex items-center justify-between rounded-md bg-muted/40 px-3 py-2"
                                >
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <span className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold shrink-0 ${medal}`}>
                                            {index + 1}
                                        </span>
                                        <span className="font-medium text-sm truncate">
                                            {speaker.name}
                                        </span>
                                    </div>
                                    <span className="text-xs font-semibold tabular-nums text-muted-foreground shrink-0">
                                        {speaker.speakCount}{" "}
                                        <span className="font-normal">
                                            {speaker.speakCount === 1 ? "time" : "times"}
                                        </span>
                                    </span>
                                </li>
                            )
                        })}
                    </ol>
                )}
            </div>
        </div>
    )
}
