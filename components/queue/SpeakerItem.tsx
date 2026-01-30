"use client"

import { Button } from "@/components/ui/button"
import { Speaker } from "@/types"
import { useState } from "react"

interface SpeakerItemProps {
    speaker: Speaker
    currentQueueId: string | null
    onAddToQueue: (speaker: Speaker) => void
    onUpdate: (id: string, name: string) => void
    onDelete: (id: string) => void
}

export function SpeakerItem({ speaker, currentQueueId, onAddToQueue, onUpdate, onDelete }: SpeakerItemProps) {
    const [isEditing, setIsEditing] = useState(false)
    const [editName, setEditName] = useState(speaker.name)
    const [showMenu, setShowMenu] = useState(false)

    const handleSave = () => {
        if (editName.trim() && editName !== speaker.name) {
            onUpdate(speaker.id, editName.trim())
        }
        setIsEditing(false)
    }

    if (isEditing) {
        return (
            <div className="group flex items-center justify-between rounded bg-muted/30 px-2 py-1.5 relative">
                <div className="flex-1 flex gap-1">
                    <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="flex-1 rounded border bg-background px-1.5 py-0.5 text-xs"
                        autoFocus
                        onKeyDown={(e) => {
                            if (e.key === "Enter") handleSave()
                            if (e.key === "Escape") {
                                setIsEditing(false)
                                setEditName(speaker.name)
                            }
                        }}
                    />
                    <Button size="sm" variant="ghost" className="h-6 px-2 text-[10px]" onClick={handleSave}>
                        Save
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <div className="group flex items-center justify-between rounded bg-muted/30 px-2 py-1.5 hover:bg-muted transition-colors relative">
            <button
                onClick={() => onAddToQueue(speaker)}
                disabled={!currentQueueId}
                className="flex-1 text-left text-[12px] font-medium hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed leading-tight"
            >
                {speaker.name}
            </button>
            <div className="flex items-center gap-0.5">
                <div className="relative">
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setShowMenu(!showMenu)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity h-5 w-5 p-0 text-[10px]"
                    >
                        ⋮
                    </Button>
                    {showMenu && (
                        <>
                            <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                            <div className="absolute right-0 top-full mt-0.5 z-50 bg-popover border rounded shadow-sm py-0.5 min-w-[80px]">
                                <button
                                    onClick={() => {
                                        setIsEditing(true)
                                        setShowMenu(false)
                                    }}
                                    className="w-full px-2 py-1 text-left text-[11px] hover:bg-muted"
                                >
                                    Edit
                                </button>
                                <button
                                    onClick={() => {
                                        onDelete(speaker.id)
                                        setShowMenu(false)
                                    }}
                                    className="w-full px-2 py-1 text-left text-[11px] hover:bg-muted text-destructive"
                                >
                                    Delete
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}
