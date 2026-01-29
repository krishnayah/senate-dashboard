"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"

import { Group, Speaker } from "@/types"

interface CreateSpeakerModalProps {
    isOpen: boolean
    onClose: () => void
    onCreated: (speaker: Speaker) => void
}

export function CreateSpeakerModal({ isOpen, onClose, onCreated }: CreateSpeakerModalProps) {
    const [name, setName] = useState("")
    const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([])
    const [groups, setGroups] = useState<Group[]>([])
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (isOpen) {
            fetchGroups()
        }
    }, [isOpen])

    const fetchGroups = async () => {
        try {
            const res = await fetch("/api/groups")
            if (res.ok) {
                const data = await res.json()
                setGroups(data)

                if (selectedGroupIds.length === 0) {
                    const guest = data.find((g: Group) => g.name.toLowerCase() === "guest")
                    if (guest) setSelectedGroupIds([guest.id])
                }
            }
        } catch (error) {
            console.error("Failed to fetch groups", error)
        }
    }

    if (!isOpen) return null

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!name.trim()) return

        setLoading(true)
        try {
            const res = await fetch("/api/speakers", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: name.trim(),
                    groupIds: selectedGroupIds
                })
            })
            if (res.ok) {
                const speaker = await res.json()
                onCreated(speaker)
                onClose()
                setName("")
                setSelectedGroupIds([])
            }
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const toggleGroup = (groupId: string) => {
        setSelectedGroupIds(prev =>
            prev.includes(groupId)
                ? prev.filter(id => id !== groupId)
                : [...prev, groupId]
        )
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-[2px] animate-in fade-in duration-200">
            <div className="w-full max-w-sm bg-background rounded-xl shadow-2xl border p-5 animate-in zoom-in-95 duration-200">
                <h3 className="text-lg font-bold mb-4 tracking-tight">Create Person</h3>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-0.5">Full Name</label>
                        <input
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 transition-all shadow-sm"
                            placeholder="e.g. Jane Doe"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            autoFocus
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-0.5">Groups / Roles</label>
                        <div className="grid grid-cols-2 gap-1.5 p-2 bg-muted/20 rounded-lg border border-dashed">
                            {groups.length === 0 ? (
                                <div className="col-span-2 py-4 text-center text-[11px] text-muted-foreground italic">Loading...</div>
                            ) : (
                                groups.map(group => (
                                    <label
                                        key={group.id}
                                        className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer transition-all border ${selectedGroupIds.includes(group.id)
                                            ? 'bg-emerald-50/50 text-emerald-800 border-emerald-100'
                                            : 'hover:bg-muted/50 border-transparent'
                                            }`}
                                    >
                                        <input
                                            type="checkbox"
                                            className="h-3.5 w-3.5 rounded border-muted text-emerald-600 focus:ring-emerald-500"
                                            checked={selectedGroupIds.includes(group.id)}
                                            onChange={() => toggleGroup(group.id)}
                                        />
                                        <span className="text-[11px] font-semibold">{group.name}</span>
                                    </label>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <Button type="button" variant="ghost" className="h-9 px-4 text-xs font-medium" onClick={onClose} disabled={loading}>
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            className="h-9 px-6 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
                            disabled={loading || !name.trim() || selectedGroupIds.length === 0}
                        >
                            {loading ? "Creating..." : "Create"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    )
}
