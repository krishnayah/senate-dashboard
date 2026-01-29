"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Group, Speaker } from "@/types"
import { useSpeakers } from "@/hooks/useSpeakers"
import { useGroups } from "@/hooks/useGroups"

interface SpeakerPanelProps {
    currentQueueId: string | null
    onSpeakerAdded: () => void
    onAddToQueue: (speaker: Speaker) => void
}

export function SpeakerPanel({ currentQueueId, onSpeakerAdded, onAddToQueue }: SpeakerPanelProps) {
    const { speakers, loading: speakersLoading, createSpeaker, updateSpeaker, deleteSpeaker, fetchSpeakers } = useSpeakers()
    const { groups, loading: groupsLoading } = useGroups()

    const [newName, setNewName] = useState("")
    const [selectedGroupId, setSelectedGroupId] = useState<string>("guest")
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editName, setEditName] = useState("")
    const [showMenu, setShowMenu] = useState<string | null>(null)
    const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({})
    const [searchQuery, setSearchQuery] = useState("")

    const loading = speakersLoading || groupsLoading

    // Initialize default group
    useMemo(() => {
        if (groups.length > 0 && (selectedGroupId === "guest" || !selectedGroupId)) {
            const guestGroup = groups.find(g => g.name.toLowerCase() === "guest")
            if (guestGroup) setSelectedGroupId(guestGroup.id)
        }
    }, [groups])

    // Load/Save collapse state
    useMemo(() => {
        if (typeof window !== "undefined") {
            const saved = localStorage.getItem("speaker-panel-collapse")
            if (saved) {
                try {
                    setCollapsedSections(JSON.parse(saved))
                } catch (e) {
                    console.error("Failed to parse collapse state", e)
                }
            }
        }
    }, [])

    const toggleSection = (sectionId: string) => {
        const newState = { ...collapsedSections, [sectionId]: !collapsedSections[sectionId] }
        setCollapsedSections(newState)
        localStorage.setItem("speaker-panel-collapse", JSON.stringify(newState))
    }

    const handleAddSpeaker = async () => {
        if (!newName.trim()) return
        const groupIds = (selectedGroupId && selectedGroupId !== "guest") ? [selectedGroupId] : []

        await createSpeaker(newName.trim(), groupIds)
        setNewName("")
        onSpeakerAdded()
    }

    const handleUpdateSpeaker = async (id: string) => {
        if (!editName.trim()) return
        await updateSpeaker(id, { name: editName.trim() })
        setEditingId(null)
        setEditName("")
        onSpeakerAdded()
    }

    const handleDeleteSpeaker = async (id: string) => {
        if (confirm("Are you sure?")) {
            await deleteSpeaker(id)
            setShowMenu(null)
            onSpeakerAdded()
        }
    }

    const handleAddToQueue = (speaker: Speaker) => {
        if (!currentQueueId) return
        onAddToQueue(speaker)
    }

    const sortedSections = useMemo(() => {
        const query = searchQuery.toLowerCase().trim()

        let sectionsData = groups.map(group => {
            const groupSpeakers = speakers
                .filter(s => s.groups.some(g => g.id === group.id))
                .filter(s => s.name.toLowerCase().includes(query))
                .sort((a, b) => a.name.localeCompare(b.name))

            return {
                ...group,
                speakers: groupSpeakers
            }
        }).filter(section => section.speakers.length > 0)

        const unassignedSpeakers = speakers
            .filter(s => s.groups.length === 0)
            .filter(s => s.name.toLowerCase().includes(query))
            .sort((a, b) => a.name.localeCompare(b.name))

        if (unassignedSpeakers.length > 0) {
            sectionsData.push({
                id: "unassigned",
                name: "Guests",
                speakers: unassignedSpeakers
            })
        }

        return sectionsData.sort((a, b) => {
            const order = ["Senate", "EBoard", "Committee Member", "Faculty", "Guests"]
            let indexA = order.indexOf(a.name)
            let indexB = order.indexOf(b.name)

            if (indexA === -1) indexA = 90
            if (indexB === -1) indexB = 90

            if (indexA !== indexB) return indexA - indexB
            return a.name.localeCompare(b.name)
        })
    }, [speakers, groups, searchQuery])

    if (loading) {
        return (
            <div className="rounded-xl border bg-card p-3">
                <div className="animate-pulse space-y-2">
                    <div className="h-4 bg-muted rounded w-1/2"></div>
                    <div className="h-8 bg-muted rounded"></div>
                </div>
            </div>
        )
    }

    return (
        <div className="rounded-xl border bg-card shadow-sm overflow-hidden flex flex-col h-full max-h-screen">
            <div className="bg-emerald-600 px-3 py-2 shrink-0">
                <h2 className="text-sm font-bold text-white uppercase tracking-tight">Speakers</h2>
            </div>

            <div className="p-3 space-y-3 flex flex-col flex-1 min-h-0">
                {/* Search Bar */}
                <div className="relative shrink-0">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search..."
                        className="w-full rounded-md border bg-muted/30 px-8 py-1.5 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500 transition-all font-medium"
                    />
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] opacity-40">
                        🔍
                    </span>
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery("")}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-[10px]"
                        >
                            ✕
                        </button>
                    )}
                </div>

                {/* Add Speaker Form */}
                <div className="space-y-1.5 shrink-0 bg-muted/10 p-2 rounded-md border border-dotted border-emerald-100">
                    <input
                        type="text"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        placeholder="Quick add..."
                        className="w-full rounded border bg-background px-2.5 py-1.5 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500"
                        onKeyDown={(e) => e.key === "Enter" && handleAddSpeaker()}
                    />
                    <div className="flex gap-1.5">
                        <select
                            value={selectedGroupId}
                            onChange={(e) => setSelectedGroupId(e.target.value)}
                            className="flex-1 rounded border bg-background px-2 py-1 text-xs focus:ring-1 focus:ring-emerald-500"
                        >
                            {groups.map(group => (
                                <option key={group.id} value={group.id}>
                                    {group.name}
                                </option>
                            ))}
                            {!groups.some(g => g.name.toLowerCase() === "guest") && (
                                <option value="guest">Guest</option>
                            )}
                        </select>
                        <Button size="sm" onClick={handleAddSpeaker} className="h-7 px-3 text-[11px] bg-emerald-600 hover:bg-emerald-700">
                            Add
                        </Button>
                    </div>
                </div>

                {/* Speaker Lists by Group */}
                <div className="space-y-3 overflow-y-auto pr-1.5 custom-scrollbar flex-1 border-t pt-2">
                    {sortedSections.length === 0 ? (
                        <div className="text-center py-6">
                            <p className="text-[11px] text-muted-foreground italic">No results</p>
                        </div>
                    ) : (
                        sortedSections.map((section) => (
                            <div key={section.id} className="space-y-0.5">
                                <button
                                    onClick={() => toggleSection(section.id)}
                                    className="group/header w-full flex items-center justify-between py-1 text-[9px] font-black uppercase text-emerald-900/40 tracking-widest hover:bg-muted/50 rounded px-1 transition-colors"
                                >
                                    <div className="flex items-center gap-1.5">
                                        <span className={`transition-transform duration-200 text-[7px] ${collapsedSections[section.id] ? '-rotate-90' : ''}`}>
                                            ▼
                                        </span>
                                        {section.name}
                                        <span className="text-[9px] font-medium text-muted-foreground/40 tabular-nums">
                                            {section.speakers.length}
                                        </span>
                                    </div>
                                </button>

                                {!collapsedSections[section.id] && (
                                    <div className="space-y-0.5 pl-1">
                                        {section.speakers.map((speaker) => (
                                            <div
                                                key={`${section.id}-${speaker.id}`}
                                                className="group flex items-center justify-between rounded bg-muted/30 px-2 py-1.5 hover:bg-muted transition-colors relative"
                                            >
                                                {editingId === speaker.id ? (
                                                    <div className="flex-1 flex gap-1">
                                                        <input
                                                            type="text"
                                                            value={editName}
                                                            onChange={(e) => setEditName(e.target.value)}
                                                            className="flex-1 rounded border bg-background px-1.5 py-0.5 text-xs"
                                                            autoFocus
                                                            onKeyDown={(e) => {
                                                                if (e.key === "Enter") handleUpdateSpeaker(speaker.id)
                                                                if (e.key === "Escape") setEditingId(null)
                                                            }}
                                                        />
                                                        <Button size="sm" variant="ghost" className="h-6 px-2 text-[10px]" onClick={() => handleUpdateSpeaker(speaker.id)}>
                                                            Save
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <button
                                                            onClick={() => handleAddToQueue(speaker)}
                                                            disabled={!currentQueueId}
                                                            className="flex-1 text-left text-[12px] font-medium hover:text-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed leading-tight"
                                                        >
                                                            {speaker.name}
                                                        </button>
                                                        <div className="flex items-center gap-0.5">
                                                            <div className="relative">
                                                                <Button
                                                                    size="sm"
                                                                    variant="ghost"
                                                                    onClick={() => setShowMenu(showMenu === `${section.id}-${speaker.id}` ? null : `${section.id}-${speaker.id}`)}
                                                                    className="opacity-0 group-hover:opacity-100 transition-opacity h-5 w-5 p-0 text-[10px]"
                                                                >
                                                                    ⋮
                                                                </Button>
                                                                {showMenu === `${section.id}-${speaker.id}` && (
                                                                    <div className="absolute right-0 top-full mt-0.5 z-50 bg-popover border rounded shadow-sm py-0.5 min-w-[80px]">
                                                                        <button
                                                                            onClick={() => {
                                                                                setEditingId(speaker.id)
                                                                                setEditName(speaker.name)
                                                                                setShowMenu(null)
                                                                            }}
                                                                            className="w-full px-2 py-1 text-left text-[11px] hover:bg-muted"
                                                                        >
                                                                            Edit
                                                                        </button>
                                                                        <button
                                                                            onClick={() => handleDeleteSpeaker(speaker.id)}
                                                                            className="w-full px-2 py-1 text-left text-[11px] hover:bg-muted text-destructive"
                                                                        >
                                                                            Delete
                                                                        </button>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    )
}
