"use client"

import { Button } from "@/components/ui/button"
import { Speaker, Group } from "@/types"
import { useState } from "react"
import { SpeakerItem } from "./SpeakerItem"

interface SpeakerSectionProps {
    group: Group | { id: string, name: string } // Handle "unassigned" pseudo-group
    speakers: Speaker[]
    isCollapsed: boolean
    onToggle: () => void
    currentQueueId: string | null
    onAddToQueue: (speaker: Speaker) => void
    onUpdateSpeaker: (id: string, name: string) => void
    onDeleteSpeaker: (id: string) => void
}

export function SpeakerSection({
    group,
    speakers,
    isCollapsed,
    onToggle,
    currentQueueId,
    onAddToQueue,
    onUpdateSpeaker,
    onDeleteSpeaker
}: SpeakerSectionProps) {
    return (
        <div className="space-y-0.5">
            <button
                onClick={onToggle}
                className="group/header w-full flex items-center justify-between py-1 text-[9px] font-black uppercase text-emerald-900/40 tracking-widest hover:bg-muted/50 rounded px-1 transition-colors"
                aria-expanded={!isCollapsed}
            >
                <div className="flex items-center gap-1.5">
                    <span className={`transition-transform duration-200 text-[7px] ${isCollapsed ? '-rotate-90' : ''}`}>
                        ▼
                    </span>
                    {group.name}
                    <span className="text-[9px] font-medium text-muted-foreground/40 tabular-nums">
                        {speakers.length}
                    </span>
                </div>
            </button>

            {!isCollapsed && (
                <div className="space-y-0.5 pl-1">
                    {speakers.map((speaker) => (
                        <SpeakerItem
                            key={speaker.id}
                            speaker={speaker}
                            currentQueueId={currentQueueId}
                            onAddToQueue={onAddToQueue}
                            onUpdate={onUpdateSpeaker}
                            onDelete={onDeleteSpeaker}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}
