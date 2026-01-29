"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Speaker, Attendance } from "@/types"
import { CreateSpeakerModal } from "@/components/CreateSpeakerModal"

interface AttendanceListProps {
    attendance: Attendance[]
    allSpeakers: Speaker[]
    onAddAttendee: (speakerId: string) => void
    onRemoveAttendee: (speakerId: string) => void
    onSpeakerCreated: (speaker: Speaker) => void
}

export function AttendanceList({ attendance, allSpeakers, onAddAttendee, onRemoveAttendee, onSpeakerCreated }: AttendanceListProps) {
    const [searchMember, setSearchMember] = useState("")
    const [showMemberMenu, setShowMemberMenu] = useState(false)
    const [showCreateModal, setShowCreateModal] = useState(false)

    // Filter speakers for dropdown
    const availableSpeakers = allSpeakers.filter(s =>
        !(attendance || []).some(a => a.speakerId === s.id) &&
        s.name.toLowerCase().includes(searchMember.toLowerCase())
    ).slice(0, 10)

    const handleNewSpeakerCreated = (speaker: Speaker) => {
        onSpeakerCreated(speaker)
        onAddAttendee(speaker.id)
    }

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <h3 className="font-semibold">Attendance</h3>
                <div className="relative">
                    <Button
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); setShowMemberMenu(!showMemberMenu); }}
                        variant="outline"
                    >
                        + Add Member
                    </Button>

                    {showMemberMenu && (
                        <>
                            <div className="fixed inset-0 z-40" onClick={() => setShowMemberMenu(false)} />
                            <div className="absolute right-0 top-full mt-1 z-50 w-64 rounded-md border bg-popover text-popover-foreground shadow-md outline-none animate-in fade-in-0 zoom-in-95">
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
                                        className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground font-medium text-blue-600 border-b mb-1"
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
                                                className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                                                onClick={() => {
                                                    onAddAttendee(speaker.id)
                                                    setSearchMember("")
                                                    // Don't close menu to allow multiple adds? Or close? User usually adds multiple. Keep open for now, or existing behavior was close? Existing logic closed menu effectively? No, `handleAddAttendee` in existing code sets `setSearchMember("")` and `setShowMemberMenu(false)`.
                                                    // I will stick to existing behavior: close on add.
                                                    setShowMemberMenu(false)
                                                    setSearchMember("")
                                                }}
                                            >
                                                {speaker.name}
                                                <span className="ml-auto text-xs opacity-50 capitalize">
                                                    {speaker.groups && speaker.groups.length > 0
                                                        ? speaker.groups.map(g => g.name).join(", ")
                                                        : speaker.type}
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

            <div className="border rounded-md divide-y max-h-[300px] overflow-y-auto">
                {(attendance || []).length === 0 ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                        No attendance recorded.
                    </div>
                ) : (
                    (attendance || []).map((record) => (
                        <div key={record.speakerId} className="flex items-center justify-between p-2 text-sm hover:bg-muted/50">
                            <span>{record.speaker.name}</span>
                            <button
                                onClick={() => {
                                    if (confirm("Remove this member from attendance?")) {
                                        onRemoveAttendee(record.speakerId)
                                    }
                                }}
                                className="text-muted-foreground hover:text-destructive p-1 rounded"
                            >
                                ×
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
