"use client"

import { useState, useEffect } from "react"

interface MeetingNotesProps {
    initialNotes: string | null
    onSave: (notes: string) => void
}

export function MeetingNotes({ initialNotes, onSave }: MeetingNotesProps) {
    const [notes, setNotes] = useState(initialNotes || "")

    // Debounce save notes
    useEffect(() => {
        const timer = setTimeout(() => {
            if (notes !== (initialNotes || "")) {
                onSave(notes)
            }
        }, 1000)
        return () => clearTimeout(timer)
    }, [notes, initialNotes, onSave])

    // Update local state if initialNotes changes externally (e.g. refresh)
    useEffect(() => {
        if (initialNotes !== null && initialNotes !== undefined) {
            setNotes(initialNotes)
        }
    }, [initialNotes])

    return (
        <div className="space-y-3">
            <h3 className="font-semibold">Notes & Recap</h3>
            <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Type meeting notes here..."
                className="flex min-h-[300px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-y"
            />
        </div>
    )
}
