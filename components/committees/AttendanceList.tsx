"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Speaker, Attendance, AttendanceStatus } from "@/types"
import { CreateSpeakerModal } from "@/components/CreateSpeakerModal"

const STATUS_CONFIG: Record<AttendanceStatus, { label: string; color: string; bg: string }> = {
    PRESENT: { label: "Present", color: "text-green-700 dark:text-green-400", bg: "bg-green-100 dark:bg-green-900/30" },
    LATE: { label: "Late", color: "text-yellow-700 dark:text-yellow-400", bg: "bg-yellow-100 dark:bg-yellow-900/30" },
    EXCUSED: { label: "Excused", color: "text-blue-700 dark:text-blue-400", bg: "bg-blue-100 dark:bg-blue-900/30" },
    ABSENT: { label: "Absent", color: "text-red-700 dark:text-red-400", bg: "bg-red-100 dark:bg-red-900/30" },
    OTHER: { label: "Other", color: "text-gray-700 dark:text-gray-400", bg: "bg-gray-100 dark:bg-gray-800/30" },
}

const STATUS_OPTIONS: AttendanceStatus[] = ["PRESENT", "LATE", "EXCUSED", "ABSENT", "OTHER"]

interface AttendanceListProps {
    attendance: Attendance[]
    allSpeakers: Speaker[]
    onAddAttendee: (speakerId: string) => void
    onRemoveAttendee: (speakerId: string) => void
    onUpdateStatus: (speakerId: string, status: AttendanceStatus, note?: string) => void
    onSpeakerCreated: (speaker: Speaker) => void
}

export function AttendanceList({ attendance, allSpeakers, onAddAttendee, onRemoveAttendee, onUpdateStatus, onSpeakerCreated }: AttendanceListProps) {
    const [searchMember, setSearchMember] = useState("")
    const [showMemberMenu, setShowMemberMenu] = useState(false)
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [editingNoteId, setEditingNoteId] = useState<string | null>(null)
    const [noteText, setNoteText] = useState("")

    const availableSpeakers = allSpeakers.filter(s =>
        !(attendance || []).some(a => a.speakerId === s.id) &&
        s.name.toLowerCase().includes(searchMember.toLowerCase())
    )

    const handleNewSpeakerCreated = (speaker: Speaker) => {
        onSpeakerCreated(speaker)
        onAddAttendee(speaker.id)
    }

    const handleStatusChange = (speakerId: string, newStatus: AttendanceStatus) => {
        if (newStatus === "OTHER") {
            setEditingNoteId(speakerId)
            const record = (attendance || []).find(a => a.speakerId === speakerId)
            setNoteText(record?.note || "")
            onUpdateStatus(speakerId, "OTHER")
        } else {
            onUpdateStatus(speakerId, newStatus)
            if (editingNoteId === speakerId) {
                setEditingNoteId(null)
            }
        }
    }

    const handleNoteSave = (speakerId: string) => {
        onUpdateStatus(speakerId, "OTHER", noteText)
        setEditingNoteId(null)
        setNoteText("")
    }

    const sortedAttendance = [...(attendance || [])].sort((a, b) =>
        a.speaker.name.localeCompare(b.speaker.name)
    )

    // Mark all as present/absent
    const handleMarkAll = (status: AttendanceStatus) => {
        (attendance || []).forEach(record => {
            if (record.status !== status) {
                onUpdateStatus(record.speakerId, status)
            }
        })
    }

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <h3 className="font-semibold">Attendance</h3>
                <div className="flex items-center gap-1.5">
                    {(attendance || []).length > 0 && (
                        <div className="flex gap-1">
                            <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs text-green-700 border-green-300 hover:bg-green-50 dark:text-green-400 dark:border-green-800 dark:hover:bg-green-950"
                                onClick={() => handleMarkAll("PRESENT")}
                            >
                                All Present
                            </Button>
                        </div>
                    )}
                    <div className="relative">
                        <Button
                            size="sm"
                            onClick={(e) => { e.stopPropagation(); setShowMemberMenu(!showMemberMenu); }}
                            variant="outline"
                        >
                            + Add
                        </Button>

                        {showMemberMenu && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setShowMemberMenu(false)} />
                                <div className="absolute right-0 top-full mt-1 z-50 w-64 rounded-md border bg-popover text-popover-foreground shadow-md">
                                    <div className="p-2">
                                        <input
                                            className="flex h-8 w-full rounded-md border bg-background px-3 py-1 text-sm outline-none placeholder:text-muted-foreground"
                                            placeholder="Search..."
                                            value={searchMember}
                                            onChange={e => setSearchMember(e.target.value)}
                                            autoFocus
                                        />
                                    </div>
                                    <div className="max-h-60 overflow-y-auto p-1">
                                        <div
                                            className="flex cursor-pointer items-center rounded-sm px-2 py-1.5 text-sm hover:bg-accent font-medium text-rose-600 border-b mb-1"
                                            onClick={() => {
                                                setShowMemberMenu(false)
                                                setShowCreateModal(true)
                                            }}
                                        >
                                            + Create New Person...
                                        </div>
                                        {availableSpeakers.length === 0 ? (
                                            <div className="py-2 text-center text-sm text-muted-foreground">No matching speakers</div>
                                        ) : (
                                            availableSpeakers.map(speaker => (
                                                <div
                                                    key={speaker.id}
                                                    className="flex cursor-pointer items-center rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
                                                    onClick={() => {
                                                        onAddAttendee(speaker.id)
                                                        setSearchMember("")
                                                        setShowMemberMenu(false)
                                                    }}
                                                >
                                                    {speaker.name}
                                                    <span className="ml-auto text-xs opacity-50">
                                                        {speaker.groups?.map(g => g.name).join(", ")}
                                                    </span>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            <div className="border rounded-md divide-y max-h-[400px] overflow-y-auto">
                {sortedAttendance.length === 0 ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                        No attendance recorded.
                    </div>
                ) : (
                    sortedAttendance.map((record) => {
                        const config = STATUS_CONFIG[record.status]
                        return (
                            <div key={record.speakerId} className="p-2 text-sm hover:bg-muted/30">
                                <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                        <span className={`shrink-0 w-2 h-2 rounded-full ${config.bg.replace('bg-', 'bg-').replace('/30', '')} ${record.status === 'PRESENT' ? 'bg-green-500' : record.status === 'LATE' ? 'bg-yellow-500' : record.status === 'EXCUSED' ? 'bg-blue-500' : record.status === 'ABSENT' ? 'bg-red-500' : 'bg-gray-500'}`} />
                                        <span className="truncate font-medium">{record.speaker.name}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 shrink-0">
                                        <select
                                            value={record.status}
                                            onChange={(e) => handleStatusChange(record.speakerId, e.target.value as AttendanceStatus)}
                                            className={`h-7 rounded border text-xs font-medium px-1.5 ${config.bg} ${config.color} bg-background cursor-pointer focus:outline-none focus:ring-1 focus:ring-ring`}
                                        >
                                            {STATUS_OPTIONS.map(s => (
                                                <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
                                            ))}
                                        </select>
                                        <button
                                            onClick={() => {
                                                if (confirm("Remove from attendance?")) {
                                                    onRemoveAttendee(record.speakerId)
                                                }
                                            }}
                                            className="text-muted-foreground hover:text-destructive p-0.5 rounded text-xs"
                                        >
                                            x
                                        </button>
                                    </div>
                                </div>
                                {/* Note input for OTHER status */}
                                {record.status === "OTHER" && (
                                    <div className="mt-1.5 ml-4">
                                        {editingNoteId === record.speakerId ? (
                                            <div className="flex gap-1">
                                                <input
                                                    type="text"
                                                    value={noteText}
                                                    onChange={(e) => setNoteText(e.target.value)}
                                                    placeholder="Add a note..."
                                                    className="flex-1 h-6 rounded border bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                                                    autoFocus
                                                    onKeyDown={(e) => {
                                                        if (e.key === "Enter") handleNoteSave(record.speakerId)
                                                        if (e.key === "Escape") setEditingNoteId(null)
                                                    }}
                                                />
                                                <Button size="sm" variant="ghost" className="h-6 px-2 text-[10px]" onClick={() => handleNoteSave(record.speakerId)}>
                                                    Save
                                                </Button>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => {
                                                    setEditingNoteId(record.speakerId)
                                                    setNoteText(record.note || "")
                                                }}
                                                className="text-xs text-muted-foreground hover:text-foreground italic"
                                            >
                                                {record.note || "Click to add note..."}
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        )
                    })
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
