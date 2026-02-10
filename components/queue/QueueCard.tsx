"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"

interface Speaker {
    id: string
    name: string
    type: string
    speakCount: number
}

// Client-side queue item structure
export interface LocalQueueItem {
    id: string
    speaker: Speaker
    position: number
    createdAt: number
}

interface QueueCardProps {
    id: string
    name: string
    items: LocalQueueItem[]
    isCollapsed: boolean
    isCurrentQueue: boolean
    readOnly?: boolean
    onOpenSubqueue: (name: string) => void
    onCloseQueue: () => void
    onRemoveSpeaker: (itemId: string) => void
    onNextSpeaker: () => void
}

export function QueueCard({
    id,
    name,
    items,
    isCollapsed,
    isCurrentQueue,
    readOnly = false,
    onOpenSubqueue,
    onCloseQueue,
    onRemoveSpeaker,
    onNextSpeaker,
}: QueueCardProps) {
    const [subqueueName, setSubqueueName] = useState("")
    const [showSubqueueInput, setShowSubqueueInput] = useState(false)

    const handleOpenSubqueue = () => {
        if (subqueueName.trim()) {
            onOpenSubqueue(subqueueName.trim())
            setSubqueueName("")
            setShowSubqueueInput(false)
        }
    }

    if (isCollapsed) {
        return (
            <div className="rounded-lg border bg-muted/50 p-3 transition-all">
                <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">
                        {name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                        {items.length} speaker{items.length !== 1 ? "s" : ""}
                    </span>
                </div>
            </div>
        )
    }

    return (
        <div className="rounded-xl border bg-card shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-rose-600 to-rose-700 px-6 py-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-white">{name}</h2>
                    {!readOnly && (
                        <div className="flex items-center gap-2">
                            <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => setShowSubqueueInput(!showSubqueueInput)}
                                className="bg-white/20 hover:bg-white/30 text-white border-0"
                            >
                                Open Subqueue
                            </Button>
                            {isCurrentQueue && (
                                <Button
                                    size="sm"
                                    variant="secondary"
                                    onClick={onCloseQueue}
                                    className="bg-white/20 hover:bg-white/30 text-white border-0"
                                >
                                    Close Queue
                                </Button>
                            )}
                        </div>
                    )}
                </div>

                {showSubqueueInput && (
                    <div className="mt-3 flex gap-2">
                        <input
                            type="text"
                            value={subqueueName}
                            onChange={(e) => setSubqueueName(e.target.value)}
                            placeholder="Subqueue name..."
                            className="flex-1 rounded-md px-3 py-2 text-sm bg-white/90 text-gray-900 placeholder:text-gray-500"
                            onKeyDown={(e) => e.key === "Enter" && handleOpenSubqueue()}
                        />
                        <Button
                            size="sm"
                            onClick={handleOpenSubqueue}
                            className="bg-white text-rose-700 hover:bg-white/90"
                        >
                            Create
                        </Button>
                    </div>
                )}
            </div>

            <div className="p-6">
                {/* Next Speaker Button */}
                {!readOnly && items.length > 0 && (
                    <div className="mb-4">
                        <Button
                            onClick={onNextSpeaker}
                            className="w-full bg-green-600 hover:bg-green-700 text-white"
                            size="lg"
                        >
                            Next Speaker →
                        </Button>
                    </div>
                )}

                {/* Speaker List */}
                <div className="space-y-2">
                    {items.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">
                            No speakers in queue. Click a speaker on the right to add them.
                        </p>
                    ) : (
                        items.map((item, index) => (
                            <div
                                key={item.id}
                                className={`flex items-center justify-between rounded-lg px-4 py-3 group transition-colors ${index === 0
                                    ? "bg-green-100 dark:bg-green-900/30 border-2 border-green-500"
                                    : "bg-muted/50 hover:bg-muted"
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <span className={`flex items-center justify-center w-8 h-8 rounded-full font-semibold text-sm ${index === 0
                                        ? "bg-green-500 text-white"
                                        : "bg-rose-100 text-rose-700"
                                        }`}>
                                        {index + 1}
                                    </span>
                                    <div>
                                        <span className="font-medium">{item.speaker.name}</span>
                                        <span className="ml-2 text-xs text-muted-foreground">
                                            ({item.speaker.speakCount} times)
                                        </span>
                                    </div>
                                </div>
                                {!readOnly && (
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => onRemoveSpeaker(item.id)}
                                        className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
                                    >
                                        Remove
                                    </Button>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    )
}
