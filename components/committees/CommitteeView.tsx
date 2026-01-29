"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { MeetingCard } from "./MeetingCard"

import { Speaker, Group, Committee, Meeting } from "@/types"

export function CommitteeView() {
    // Data state
    const [committees, setCommittees] = useState<Committee[]>([])
    const [meetings, setMeetings] = useState<Meeting[]>([])
    const [speakers, setSpeakers] = useState<Speaker[]>([])

    // Selection state
    const [selectedCommitteeId, setSelectedCommitteeId] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)
    const [expandedMeetingId, setExpandedMeetingId] = useState<string | null>(null)

    // Create forms
    const [newCommitteeName, setNewCommitteeName] = useState("")
    const [showCreateCommittee, setShowCreateCommittee] = useState(false)

    // Initialize
    useEffect(() => {
        fetchCommittees()
        fetchSpeakers()
    }, [])

    const [isEditingCommittee, setIsEditingCommittee] = useState(false)
    const [editCommitteeName, setEditCommitteeName] = useState("")

    useEffect(() => {
        if (selectedCommitteeId) {
            fetchMeetings(selectedCommitteeId)
            const committee = committees.find(c => c.id === selectedCommitteeId)
            if (committee) setEditCommitteeName(committee.name)
        } else {
            setMeetings([])
        }
    }, [selectedCommitteeId, committees])

    const handleRenameCommittee = async () => {
        if (!selectedCommitteeId || !editCommitteeName.trim()) return

        try {
            const res = await fetch(`/api/committees/${selectedCommitteeId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: editCommitteeName })
            })
            if (res.ok) {
                const updated = await res.json()
                setCommittees(committees.map(c => c.id === updated.id ? updated : c))
                setIsEditingCommittee(false)
            }
        } catch (e) {
            console.error(e)
        }
    }

    const handleDeleteCommittee = async () => {
        if (!selectedCommitteeId) return
        if (!confirm("Are you sure you want to delete this committee? All meetings and data will be lost.")) return

        try {
            const res = await fetch(`/api/committees/${selectedCommitteeId}`, {
                method: "DELETE"
            })
            if (res.ok) {
                setCommittees(committees.filter(c => c.id !== selectedCommitteeId))
                setSelectedCommitteeId(null)
            }
        } catch (e) {
            console.error(e)
        }
    }

    // ... fetch functions ...

    const fetchCommittees = async () => {
        try {
            const res = await fetch("/api/committees")
            if (res.ok) setCommittees(await res.json())
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }

    const fetchSpeakers = async () => {
        try {
            const res = await fetch("/api/speakers")
            if (res.ok) setSpeakers(await res.json())
        } catch (e) {
            console.error(e)
        }
    }

    const fetchMeetings = async (committeeId: string) => {
        try {
            const res = await fetch(`/api/committees/${committeeId}/meetings`)
            if (res.ok) {
                const data = await res.json()
                setMeetings(data)
                // Expand the most recent meeting by default (first in list)
                if (data.length > 0 && !expandedMeetingId) {
                    setExpandedMeetingId(data[0].id)
                }
            }
        } catch (e) {
            console.error(e)
        }
    }

    const handleCreateCommittee = async () => {
        if (!newCommitteeName.trim()) return

        try {
            const res = await fetch("/api/committees", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: newCommitteeName })
            })
            if (res.ok) {
                const newCommittee = await res.json()
                setCommittees([...committees, newCommittee])
                setSelectedCommitteeId(newCommittee.id)
                setNewCommitteeName("")
                setShowCreateCommittee(false)
            }
        } catch (e) {
            console.error(e)
        }
    }

    const handleCreateMeeting = async () => {
        if (!selectedCommitteeId) return

        try {
            const res = await fetch(`/api/committees/${selectedCommitteeId}/meetings`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({}) // Default title handled by API
            })
            if (res.ok) {
                const newMeeting = await res.json()
                // Prepend new meeting
                setMeetings([newMeeting, ...meetings])
                setExpandedMeetingId(newMeeting.id)
            }
        } catch (e) {
            console.error(e)
        }
    }

    const handleDeleteMeeting = async (id: string) => {
        try {
            const res = await fetch(`/api/meetings/${id}`, {
                method: "DELETE"
            })
            if (res.ok) {
                setMeetings(meetings.filter(m => m.id !== id))
            }
        } catch (e) {
            console.error(e)
        }
    }

    const handleMeetingUpdate = (updated: Meeting) => {
        setMeetings(prev => prev.map(m => m.id === updated.id ? updated : m))
    }

    if (loading) {
        return <div className="text-center py-8">Loading...</div>
    }

    return (
        <div className="space-y-6">
            {/* Top Bar: Selector and Actions */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center bg-card p-4 rounded-lg border shadow-sm">
                <div className="flex flex-1 gap-2 w-full sm:w-auto items-center">
                    {isEditingCommittee ? (
                        <div className="flex gap-2 items-center flex-1 sm:max-w-[300px]">
                            <input
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                value={editCommitteeName}
                                onChange={e => setEditCommitteeName(e.target.value)}
                                autoFocus
                            />
                            <Button size="sm" onClick={handleRenameCommittee}>Save</Button>
                            <Button size="sm" variant="ghost" onClick={() => setIsEditingCommittee(false)}>Cancel</Button>
                        </div>
                    ) : (
                        <select
                            className="flex h-10 w-full sm:w-[300px] items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            value={selectedCommitteeId || ""}
                            onChange={(e) => {
                                setSelectedCommitteeId(e.target.value || null)
                                setExpandedMeetingId(null) // Reset expanded
                            }}
                        >
                            <option value="">Select a Committee...</option>
                            {committees.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    )}

                    {selectedCommitteeId && !isEditingCommittee && (
                        <div className="flex gap-1">
                            <Button variant="ghost" size="icon" onClick={() => setIsEditingCommittee(true)} title="Rename Committee">
                                ✎
                            </Button>
                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={handleDeleteCommittee} title="Delete Committee">
                                🗑️
                            </Button>
                        </div>
                    )}
                </div>

                <div className="flex gap-2">
                    {selectedCommitteeId && (
                        <Button onClick={handleCreateMeeting}>
                            + New Meeting
                        </Button>
                    )}

                    <div className="relative">
                        <Button variant="outline" onClick={() => setShowCreateCommittee(!showCreateCommittee)}>
                            New Committee
                        </Button>

                        {showCreateCommittee && (
                            <div className="absolute right-0 top-full mt-2 w-72 p-4 bg-popover border rounded-lg shadow-lg z-50 animate-in fade-in-0 zoom-in-95">
                                <h4 className="font-semibold mb-2">Create Committee</h4>
                                <div className="flex gap-2">
                                    <input
                                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                        placeholder="Name..."
                                        value={newCommitteeName}
                                        onChange={e => setNewCommitteeName(e.target.value)}
                                    />
                                    <Button size="sm" onClick={handleCreateCommittee}>Add</Button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Content Area */}
            {!selectedCommitteeId ? (
                <div className="text-center py-20 text-muted-foreground border-2 border-dashed rounded-lg">
                    Select a committee to view meetings or create a new one.
                </div>
            ) : (
                <div className="space-y-4">
                    {meetings.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            No meetings yet. Click "New Meeting" to start.
                        </div>
                    ) : (
                        meetings.map(meeting => (
                            <MeetingCard
                                key={meeting.id}
                                meeting={meeting}
                                allSpeakers={speakers}
                                isExpanded={expandedMeetingId === meeting.id}
                                onToggleExpand={() => setExpandedMeetingId(
                                    expandedMeetingId === meeting.id ? null : meeting.id
                                )}
                                onUpdate={handleMeetingUpdate}
                                onDelete={handleDeleteMeeting}
                                onSpeakerCreated={(newSpeaker) => setSpeakers([...speakers, newSpeaker])}
                            />
                        ))
                    )}
                </div>
            )}
        </div>
    )
}
