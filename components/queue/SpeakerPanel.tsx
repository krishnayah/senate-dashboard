"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"

interface Speaker {
    id: string
    name: string
    type: string
    speakCount: number
}

interface SpeakerPanelProps {
    currentQueueId: string | null
    onSpeakerAdded: () => void
    onAddToQueue: (speaker: Speaker) => void
}

export function SpeakerPanel({ currentQueueId, onSpeakerAdded, onAddToQueue }: SpeakerPanelProps) {
    const [speakers, setSpeakers] = useState<Speaker[]>([])
    const [loading, setLoading] = useState(true)
    const [newName, setNewName] = useState("")
    const [newType, setNewType] = useState<"senate" | "guest" | "faculty">("guest")
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editName, setEditName] = useState("")
    const [showMenu, setShowMenu] = useState<string | null>(null)

    const fetchSpeakers = async () => {
        try {
            const res = await fetch("/api/speakers")
            if (res.ok) {
                const data = await res.json()
                setSpeakers(data)
            }
        } catch (error) {
            console.error("Failed to fetch speakers:", error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchSpeakers()
    }, [])

    const handleAddSpeaker = async () => {
        if (!newName.trim()) return

        try {
            const res = await fetch("/api/speakers", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: newName.trim(), type: newType }),
            })
            if (res.ok) {
                setNewName("")
                setNewType("guest")
                await fetchSpeakers()
                onSpeakerAdded()
            }
        } catch (error) {
            console.error("Failed to add speaker:", error)
        }
    }

    const handleUpdateSpeaker = async (id: string) => {
        if (!editName.trim()) return

        try {
            const res = await fetch(`/api/speakers/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: editName.trim() }),
            })
            if (res.ok) {
                setEditingId(null)
                setEditName("")
                await fetchSpeakers()
                onSpeakerAdded()
            }
        } catch (error) {
            console.error("Failed to update speaker:", error)
        }
    }

    const handleDeleteSpeaker = async (id: string) => {
        try {
            const res = await fetch(`/api/speakers/${id}`, {
                method: "DELETE",
            })
            if (res.ok) {
                setShowMenu(null)
                await fetchSpeakers()
                onSpeakerAdded()
            }
        } catch (error) {
            console.error("Failed to delete speaker:", error)
        }
    }

    const handleAddToQueue = (speaker: Speaker) => {
        if (!currentQueueId) return
        onAddToQueue(speaker)
    }

    const groupedSpeakers = {
        senate: speakers.filter(s => s.type === "senate"),
        faculty: speakers.filter(s => s.type === "faculty"),
        guest: speakers.filter(s => s.type === "guest"),
    }

    if (loading) {
        return (
            <div className="rounded-xl border bg-card p-4">
                <div className="animate-pulse space-y-2">
                    <div className="h-4 bg-muted rounded w-1/2"></div>
                    <div className="h-8 bg-muted rounded"></div>
                </div>
            </div>
        )
    }

    return (
        <div className="rounded-xl border bg-card shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 px-4 py-3">
                <h2 className="text-lg font-bold text-white">Speakers</h2>
            </div>

            <div className="p-4 space-y-4">
                {/* Add Speaker Form */}
                <div className="space-y-2">
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            placeholder="Name..."
                            className="flex-1 rounded-md border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            onKeyDown={(e) => e.key === "Enter" && handleAddSpeaker()}
                        />
                    </div>
                    <div className="flex gap-2">
                        <select
                            value={newType}
                            onChange={(e) => setNewType(e.target.value as "senate" | "guest" | "faculty")}
                            className="flex-1 rounded-md border bg-background px-3 py-2 text-sm"
                        >
                            <option value="guest">Guest</option>
                            <option value="senate">Senate</option>
                            <option value="faculty">Faculty</option>
                        </select>
                        <Button size="sm" onClick={handleAddSpeaker}>
                            Add
                        </Button>
                    </div>
                </div>

                {/* Speaker Lists by Type */}
                {(["senate", "faculty", "guest"] as const).map((type) => (
                    groupedSpeakers[type].length > 0 && (
                        <div key={type} className="space-y-1">
                            <h3 className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                                {type}
                            </h3>
                            <div className="space-y-1">
                                {groupedSpeakers[type].map((speaker) => (
                                    <div
                                        key={speaker.id}
                                        className="group flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2 hover:bg-muted transition-colors relative"
                                    >
                                        {editingId === speaker.id ? (
                                            <div className="flex-1 flex gap-2">
                                                <input
                                                    type="text"
                                                    value={editName}
                                                    onChange={(e) => setEditName(e.target.value)}
                                                    className="flex-1 rounded border bg-background px-2 py-1 text-sm"
                                                    autoFocus
                                                    onKeyDown={(e) => {
                                                        if (e.key === "Enter") handleUpdateSpeaker(speaker.id)
                                                        if (e.key === "Escape") setEditingId(null)
                                                    }}
                                                />
                                                <Button size="sm" variant="ghost" onClick={() => handleUpdateSpeaker(speaker.id)}>
                                                    Save
                                                </Button>
                                            </div>
                                        ) : (
                                            <>
                                                <button
                                                    onClick={() => handleAddToQueue(speaker)}
                                                    disabled={!currentQueueId}
                                                    className="flex-1 text-left text-sm font-medium hover:text-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    {speaker.name}
                                                </button>
                                                <div className="flex items-center gap-1">
                                                    {type === "guest" ? (
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() => handleDeleteSpeaker(speaker.id)}
                                                            className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0 text-destructive hover:text-destructive"
                                                        >
                                                            ×
                                                        </Button>
                                                    ) : (
                                                        <div className="relative">
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                onClick={() => setShowMenu(showMenu === speaker.id ? null : speaker.id)}
                                                                className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
                                                            >
                                                                ⋮
                                                            </Button>
                                                            {showMenu === speaker.id && (
                                                                <div className="absolute right-0 top-full mt-1 z-10 bg-popover border rounded-md shadow-md py-1 min-w-[100px]">
                                                                    <button
                                                                        onClick={() => {
                                                                            setEditingId(speaker.id)
                                                                            setEditName(speaker.name)
                                                                            setShowMenu(null)
                                                                        }}
                                                                        className="w-full px-3 py-1.5 text-left text-sm hover:bg-muted"
                                                                    >
                                                                        Edit
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleDeleteSpeaker(speaker.id)}
                                                                        className="w-full px-3 py-1.5 text-left text-sm hover:bg-muted text-destructive"
                                                                    >
                                                                        Delete
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )
                ))}

                {speakers.length === 0 && (
                    <p className="text-center text-sm text-muted-foreground py-4">
                        No speakers yet. Add one above.
                    </p>
                )}
            </div>
        </div>
    )
}
