"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Speaker, MeetingGroup } from "@/types"
import { CreateSpeakerModal } from "@/components/CreateSpeakerModal"

interface RequiredMembersPanelProps {
    meetingGroup: MeetingGroup
    allSpeakers: Speaker[]
    onUpdate: (group: MeetingGroup) => void
    onSpeakerCreated: (speaker: Speaker) => void
}

export function RequiredMembersPanel({ meetingGroup, allSpeakers, onUpdate, onSpeakerCreated }: RequiredMembersPanelProps) {
    const [search, setSearch] = useState("")
    const [showDropdown, setShowDropdown] = useState(false)
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [saving, setSaving] = useState(false)

    const currentMemberIds = new Set((meetingGroup.requiredMembers || []).map(m => m.id))

    const filteredSpeakers = allSpeakers.filter(s =>
        !currentMemberIds.has(s.id) &&
        s.name.toLowerCase().includes(search.toLowerCase())
    )

    const updateMembers = async (newMemberIds: string[]) => {
        setSaving(true)
        try {
            const res = await fetch(`/api/meeting-groups/${meetingGroup.id}/members`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ memberIds: newMemberIds })
            })
            if (res.ok) {
                const updated = await res.json()
                onUpdate(updated)
            }
        } catch (e) {
            console.error(e)
        } finally {
            setSaving(false)
        }
    }

    const handleAdd = (speakerId: string) => {
        const newIds = [...Array.from(currentMemberIds), speakerId]
        updateMembers(newIds)
        setSearch("")
        setShowDropdown(false)
    }

    const handleRemove = (speakerId: string) => {
        const newIds = Array.from(currentMemberIds).filter(id => id !== speakerId)
        updateMembers(newIds)
    }

    const handleNewSpeakerCreated = (speaker: Speaker) => {
        onSpeakerCreated(speaker)
        const newIds = [...Array.from(currentMemberIds), speaker.id]
        updateMembers(newIds)
    }

    return (
        <div className="bg-card border rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
                <div>
                    <h3 className="font-semibold text-sm">Required Members</h3>
                    <p className="text-xs text-muted-foreground">These people will be auto-added to new meetings for attendance tracking.</p>
                </div>
                {saving && <span className="text-xs text-muted-foreground">Saving...</span>}
            </div>

            {/* Add member */}
            <div className="relative mb-3">
                <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowDropdown(!showDropdown)}
                >
                    + Add Member
                </Button>

                {showDropdown && (
                    <>
                        <div className="fixed inset-0 z-40" onClick={() => setShowDropdown(false)} />
                        <div className="absolute left-0 top-full mt-1 z-50 w-72 rounded-md border bg-popover text-popover-foreground shadow-md">
                            <div className="p-2">
                                <input
                                    className="flex h-8 w-full rounded-md border bg-background px-3 py-1 text-sm outline-none placeholder:text-muted-foreground"
                                    placeholder="Search..."
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    autoFocus
                                />
                            </div>
                            <div className="max-h-48 overflow-y-auto p-1">
                                <div
                                    className="flex cursor-pointer items-center rounded-sm px-2 py-1.5 text-sm hover:bg-accent font-medium text-rose-600 border-b mb-1"
                                    onClick={() => {
                                        setShowDropdown(false)
                                        setShowCreateModal(true)
                                    }}
                                >
                                    + Create New Person...
                                </div>
                                {filteredSpeakers.length === 0 ? (
                                    <div className="py-2 text-center text-sm text-muted-foreground">No matches</div>
                                ) : (
                                    filteredSpeakers.map(s => (
                                        <div
                                            key={s.id}
                                            className="flex cursor-pointer items-center rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
                                            onClick={() => handleAdd(s.id)}
                                        >
                                            {s.name}
                                            <span className="ml-auto text-xs opacity-50">
                                                {s.groups.map(g => g.name).join(", ")}
                                            </span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Member list */}
            <div className="flex flex-wrap gap-2">
                {(meetingGroup.requiredMembers || []).length === 0 ? (
                    <p className="text-xs text-muted-foreground italic py-2">No required members set. Add members to auto-populate attendance when creating new meetings.</p>
                ) : (
                    (meetingGroup.requiredMembers || []).map(member => (
                        <div
                            key={member.id}
                            className="flex items-center gap-1.5 bg-secondary rounded-full px-3 py-1 text-sm border"
                        >
                            <span>{member.name}</span>
                            <button
                                onClick={() => handleRemove(member.id)}
                                className="text-muted-foreground hover:text-destructive ml-0.5 text-xs"
                            >
                                x
                            </button>
                        </div>
                    ))
                )}
            </div>

            <CreateSpeakerModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onCreated={handleNewSpeakerCreated}
            />
        </div>
    )
}
