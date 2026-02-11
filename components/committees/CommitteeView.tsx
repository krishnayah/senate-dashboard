"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import { MeetingCard } from "./MeetingCard"
import { RequiredMembersPanel } from "./RequiredMembersPanel"
import { exportAttendanceXlsx } from "@/lib/export-attendance"
import { Speaker, MeetingGroup, Meeting } from "@/types"

export function CommitteeView() {
    const [meetingGroups, setMeetingGroups] = useState<MeetingGroup[]>([])
    const [meetings, setMeetings] = useState<Meeting[]>([])
    const [speakers, setSpeakers] = useState<Speaker[]>([])

    const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)
    const [expandedMeetingId, setExpandedMeetingId] = useState<string | null>(null)

    const [newGroupName, setNewGroupName] = useState("")
    const [showCreateGroup, setShowCreateGroup] = useState(false)

    const [isEditingGroup, setIsEditingGroup] = useState(false)
    const [editGroupName, setEditGroupName] = useState("")
    const [showMembersPanel, setShowMembersPanel] = useState(false)

    useEffect(() => {
        fetchMeetingGroups()
        fetchSpeakers()
    }, [])

    useEffect(() => {
        if (selectedGroupId) {
            fetchMeetings(selectedGroupId)
            const group = meetingGroups.find(g => g.id === selectedGroupId)
            if (group) setEditGroupName(group.name)
        } else {
            setMeetings([])
        }
    }, [selectedGroupId, meetingGroups])

    const selectedGroup = meetingGroups.find(g => g.id === selectedGroupId)

    const fetchMeetingGroups = async () => {
        try {
            const res = await fetch("/api/meeting-groups")
            if (res.ok) setMeetingGroups(await res.json())
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

    const fetchMeetings = async (groupId: string) => {
        try {
            const res = await fetch(`/api/meeting-groups/${groupId}/meetings`)
            if (res.ok) {
                const data = await res.json()
                setMeetings(data)
                if (data.length > 0 && !expandedMeetingId) {
                    setExpandedMeetingId(data[0].id)
                }
            }
        } catch (e) {
            console.error(e)
        }
    }

    const handleCreateGroup = async () => {
        if (!newGroupName.trim()) return
        try {
            const res = await fetch("/api/meeting-groups", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: newGroupName })
            })
            if (res.ok) {
                const newGroup = await res.json()
                setMeetingGroups([...meetingGroups, newGroup])
                setSelectedGroupId(newGroup.id)
                setNewGroupName("")
                setShowCreateGroup(false)
            }
        } catch (e) {
            console.error(e)
        }
    }

    const handleRenameGroup = async () => {
        if (!selectedGroupId || !editGroupName.trim()) return
        try {
            const res = await fetch(`/api/meeting-groups/${selectedGroupId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: editGroupName })
            })
            if (res.ok) {
                const updated = await res.json()
                setMeetingGroups(meetingGroups.map(g => g.id === updated.id ? updated : g))
                setIsEditingGroup(false)
            }
        } catch (e) {
            console.error(e)
        }
    }

    const handleDeleteGroup = async () => {
        if (!selectedGroupId) return
        if (!confirm("Are you sure you want to delete this meeting group? All meetings and data will be lost.")) return
        try {
            const res = await fetch(`/api/meeting-groups/${selectedGroupId}`, { method: "DELETE" })
            if (res.ok) {
                setMeetingGroups(meetingGroups.filter(g => g.id !== selectedGroupId))
                setSelectedGroupId(null)
            }
        } catch (e) {
            console.error(e)
        }
    }

    const handleCreateMeeting = async () => {
        if (!selectedGroupId) return
        try {
            const res = await fetch(`/api/meeting-groups/${selectedGroupId}/meetings`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({})
            })
            if (res.ok) {
                const newMeeting = await res.json()
                setMeetings([newMeeting, ...meetings])
                setExpandedMeetingId(newMeeting.id)
            }
        } catch (e) {
            console.error(e)
        }
    }

    const handleDeleteMeeting = async (id: string) => {
        try {
            const res = await fetch(`/api/meetings/${id}`, { method: "DELETE" })
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

    const handleMembersUpdated = (updatedGroup: MeetingGroup) => {
        setMeetingGroups(prev => prev.map(g => g.id === updatedGroup.id ? updatedGroup : g))
    }

    const handleExportAttendance = async () => {
        if (meetings.length === 0) return
        const groupName = selectedGroup?.name || "attendance"
        await exportAttendanceXlsx(meetings, groupName)
    }

    if (loading) {
        return <div className="text-center py-8">Loading...</div>
    }

    return (
        <div className="space-y-6">
            {/* Top Bar */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center bg-card p-4 rounded-lg border shadow-sm">
                <div className="flex flex-1 gap-2 w-full sm:w-auto items-center">
                    {isEditingGroup ? (
                        <div className="flex gap-2 items-center flex-1 sm:max-w-[300px]">
                            <input
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                value={editGroupName}
                                onChange={e => setEditGroupName(e.target.value)}
                                onKeyDown={e => e.key === "Enter" && handleRenameGroup()}
                                autoFocus
                            />
                            <Button size="sm" onClick={handleRenameGroup}>Save</Button>
                            <Button size="sm" variant="ghost" onClick={() => setIsEditingGroup(false)}>Cancel</Button>
                        </div>
                    ) : (
                        <select
                            className="flex h-10 w-full sm:w-[300px] items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            value={selectedGroupId || ""}
                            onChange={(e) => {
                                setSelectedGroupId(e.target.value || null)
                                setExpandedMeetingId(null)
                            }}
                        >
                            <option value="">Select a meeting group...</option>
                            {meetingGroups.map(g => (
                                <option key={g.id} value={g.id}>{g.name}</option>
                            ))}
                        </select>
                    )}

                    {selectedGroupId && !isEditingGroup && (
                        <div className="flex gap-1">
                            <Button variant="ghost" size="icon" onClick={() => setIsEditingGroup(true)} title="Rename">
                                ✎
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setShowMembersPanel(!showMembersPanel)}
                                title="Manage Required Members"
                                className={showMembersPanel ? "bg-accent" : ""}
                            >
                                👥
                            </Button>
                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={handleDeleteGroup} title="Delete">
                                🗑️
                            </Button>
                        </div>
                    )}
                </div>

                <div className="flex gap-2">
                    {selectedGroupId && (
                        <>
                            <Button
                                variant="outline"
                                onClick={handleExportAttendance}
                                disabled={meetings.length === 0}
                                title="Export attendance to spreadsheet"
                            >
                                <Download className="size-4 mr-1.5" />
                                Export
                            </Button>
                            <Button onClick={handleCreateMeeting}>
                                + New Meeting
                            </Button>
                        </>
                    )}

                    <div className="relative">
                        <Button variant="outline" onClick={() => setShowCreateGroup(!showCreateGroup)}>
                            New Group
                        </Button>

                        {showCreateGroup && (
                            <div className="absolute right-0 top-full mt-2 w-72 p-4 bg-popover border rounded-lg shadow-lg z-50 animate-in fade-in-0 zoom-in-95">
                                <h4 className="font-semibold mb-2">Create Meeting Group</h4>
                                <div className="flex gap-2">
                                    <input
                                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                        placeholder="Name..."
                                        value={newGroupName}
                                        onChange={e => setNewGroupName(e.target.value)}
                                        onKeyDown={e => e.key === "Enter" && handleCreateGroup()}
                                        autoFocus
                                    />
                                    <Button size="sm" onClick={handleCreateGroup}>Add</Button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Required Members Panel */}
            {selectedGroupId && showMembersPanel && selectedGroup && (
                <RequiredMembersPanel
                    meetingGroup={selectedGroup}
                    allSpeakers={speakers}
                    onUpdate={handleMembersUpdated}
                    onSpeakerCreated={(s) => setSpeakers([...speakers, s])}
                />
            )}

            {/* Content Area */}
            {!selectedGroupId ? (
                <div className="text-center py-20 text-muted-foreground border-2 border-dashed rounded-lg">
                    Select a meeting group to view meetings or create a new one.
                </div>
            ) : (
                <div className="space-y-4">
                    {meetings.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            No meetings yet. Click &quot;+ New Meeting&quot; to start.
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
