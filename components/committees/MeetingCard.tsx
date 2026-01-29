"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Meeting, Speaker } from "@/types"
import { AttendanceList } from "./AttendanceList"
import { MeetingNotes } from "./MeetingNotes"

interface MeetingCardProps {
    meeting: Meeting
    allSpeakers: Speaker[]
    isExpanded: boolean
    onToggleExpand: () => void
    onUpdate: (updatedMeeting: Meeting) => void
    onDelete: (id: string) => void
    onSpeakerCreated: (speaker: Speaker) => void
}

export function MeetingCard({ meeting, allSpeakers, isExpanded, onToggleExpand, onUpdate, onDelete, onSpeakerCreated }: MeetingCardProps) {
    const [title, setTitle] = useState(meeting.title)
    const [saving, setSaving] = useState(false)

    const handleUpdate = async (data: Partial<{ title: string, notes: string, attendance: { add?: string[], remove?: string[] } }>) => {
        setSaving(true)
        try {
            const res = await fetch(`/api/meetings/${meeting.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data)
            })
            if (res.ok) {
                const updated = await res.json()
                onUpdate(updated)
            }
        } catch (e) {
            console.error("Failed to update meeting", e)
        } finally {
            setSaving(false)
        }
    }

    const handleTitleBlur = () => {
        if (title !== meeting.title) {
            handleUpdate({ title })
        }
    }

    const handleAddAttendee = (speakerId: string) => {
        if ((meeting.attendance || []).some(a => a.speakerId === speakerId)) return
        handleUpdate({ attendance: { add: [speakerId] } })
    }

    const handleRemoveAttendee = (speakerId: string) => {
        handleUpdate({ attendance: { remove: [speakerId] } })
    }

    const handleDelete = () => {
        if (confirm("Are you sure you want to delete this meeting? This cannot be undone.")) {
            onDelete(meeting.id)
        }
    }

    return (
        <div className="border rounded-lg bg-card text-card-foreground shadow-sm mb-4 overflow-hidden">
            {/* Header / Summary */}
            <div
                className="flex items-center justify-between p-4 bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={onToggleExpand}
            >
                <div className="flex flex-col">
                    <span className="font-semibold text-lg">{meeting.title}</span>
                    <span className="text-xs text-muted-foreground">
                        {new Date(meeting.date).toLocaleDateString()} • {(meeting.attendance || []).length} Attendees
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded bg-secondary/50 transition-opacity ${saving ? 'opacity-100' : 'opacity-0'}`}>
                        Saving...
                    </span>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        {isExpanded ? "▲" : "▼"}
                    </Button>
                </div>
            </div>

            {/* Expanded Content */}
            {isExpanded && (
                <div className="p-4 border-t space-y-6">

                    {/* Title Edit */}
                    <div className="space-y-1">
                        <label className="text-sm font-medium leading-none">Meeting Title</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            onBlur={handleTitleBlur}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        />
                    </div>

                    {/* Content Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                        {/* Attendance Column */}
                        <AttendanceList
                            attendance={meeting.attendance}
                            allSpeakers={allSpeakers}
                            onAddAttendee={handleAddAttendee}
                            onRemoveAttendee={handleRemoveAttendee}
                            onSpeakerCreated={onSpeakerCreated}
                        />

                        {/* Notes Column */}
                        <MeetingNotes
                            initialNotes={meeting.notes}
                            onSave={(newNotes) => handleUpdate({ notes: newNotes })}
                        />

                    </div>

                    {/* Footer Actions */}
                    <div className="flex justify-end pt-4 border-t">
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={handleDelete}
                        >
                            Delete Meeting
                        </Button>
                    </div>

                </div>
            )}
        </div>
    )
}
