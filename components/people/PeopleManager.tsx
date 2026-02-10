"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { CreateSpeakerModal } from "@/components/CreateSpeakerModal" // We might need to upgrade this or create a new one

interface Group {
    id: string
    name: string
}

interface Person {
    id: string
    name: string
    groups: Group[]
}

export function PeopleManager() {
    const [people, setPeople] = useState<Person[]>([])
    const [groups, setGroups] = useState<Group[]>([])
    const [filterGroup, setFilterGroup] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingPerson, setEditingPerson] = useState<Person | null>(null)
    const [viewingPerson, setViewingPerson] = useState<Person | null>(null)
    const [membershipData, setMembershipData] = useState<any[]>([])
    const [isMembershipModalOpen, setIsMembershipModalOpen] = useState(false)
    const [membershipLoading, setMembershipLoading] = useState(false)

    // Form State
    const [formData, setFormData] = useState({ name: "", groupIds: [] as string[] })

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        setLoading(true)
        try {
            const [pRes, gRes] = await Promise.all([
                fetch("/api/people"),
                fetch("/api/groups")
            ])
            if (pRes.ok && gRes.ok) {
                setPeople(await pRes.json())
                setGroups(await gRes.json())
            }
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async () => {
        if (!formData.name.trim()) return

        const url = editingPerson ? `/api/people/${editingPerson.id}` : "/api/people"
        const method = editingPerson ? "PATCH" : "POST"

        try {
            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: formData.name,
                    groups: formData.groupIds
                })
            })
            if (res.ok) {
                await fetchData()
                setIsModalOpen(false)
                setEditingPerson(null)
                setFormData({ name: "", groupIds: [] })
            }
        } catch (e) {
            console.error(e)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure?")) return
        try {
            await fetch(`/api/people/${id}`, { method: "DELETE" })
            setPeople(people.filter(p => p.id !== id))
        } catch (e) {
            console.error(e)
        }
    }

    const openCreate = () => {
        setEditingPerson(null)
        setFormData({ name: "", groupIds: [] })
        setIsModalOpen(true)
    }

    const openEdit = (person: Person) => {
        setEditingPerson(person)
        setFormData({
            name: person.name,
            groupIds: person.groups.map(g => g.id)
        })
        setIsModalOpen(true)
    }

    const openMembership = async (person: Person) => {
        setViewingPerson(person)
        setIsMembershipModalOpen(true)
        setMembershipLoading(true)
        setMembershipData([])
        try {
            const res = await fetch(`/api/people/${person.id}/attendance`)
            if (res.ok) {
                setMembershipData(await res.json())
            }
        } catch (e) {
            console.error(e)
        } finally {
            setMembershipLoading(false)
        }
    }

    const toggleGroupSelection = (groupId: string) => {
        setFormData(prev => {
            const exists = prev.groupIds.includes(groupId)
            return {
                ...prev,
                groupIds: exists
                    ? prev.groupIds.filter(id => id !== groupId)
                    : [...prev.groupIds, groupId]
            }
        })
    }

    const filteredPeople = filterGroup
        ? people.filter(p => p.groups.some(g => g.id === filterGroup))
        : people

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center">
                <div className="flex gap-2 flex-wrap">
                    <Button
                        variant={filterGroup === null ? "default" : "outline"}
                        size="sm"
                        onClick={() => setFilterGroup(null)}
                    >
                        All
                    </Button>
                    {groups.map(g => (
                        <Button
                            key={g.id}
                            variant={filterGroup === g.id ? "default" : "outline"}
                            size="sm"
                            onClick={() => setFilterGroup(g.id)}
                        >
                            {g.name}
                        </Button>
                    ))}
                </div>
                <Button onClick={openCreate}>+ Add Person</Button>
            </div>

            <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-muted text-muted-foreground font-medium">
                        <tr>
                            <th className="p-4">Name</th>
                            <th className="p-4">Groups</th>
                            <th className="p-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {loading ? (
                            <tr><td colSpan={3} className="p-8 text-center">Loading...</td></tr>
                        ) : filteredPeople.length === 0 ? (
                            <tr><td colSpan={3} className="p-8 text-center text-muted-foreground">No people found.</td></tr>
                        ) : (
                            filteredPeople.map(person => (
                                <tr key={person.id} className="hover:bg-muted/50">
                                    <td className="p-4 font-medium">{person.name}</td>
                                    <td className="p-4">
                                        <div className="flex gap-1 flex-wrap">
                                            {person.groups.map(g => (
                                                <span key={g.id} className="px-2 py-0.5 rounded-full bg-secondary text-xs border">
                                                    {g.name}
                                                </span>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="p-4 text-right">
                                        <Button variant="ghost" size="sm" onClick={() => openMembership(person)}>View Membership</Button>
                                        <Button variant="ghost" size="sm" onClick={() => openEdit(person)}>Edit</Button>
                                        <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDelete(person.id)}>Delete</Button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in">
                    <div className="w-full max-w-md bg-background rounded-lg shadow-lg border p-6">
                        <h3 className="text-lg font-semibold mb-4">
                            {editingPerson ? "Edit Person" : "Add New Person"}
                        </h3>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Name</label>
                                <input
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Groups</label>
                                <div className="grid grid-cols-2 gap-2 border rounded-md p-3 max-h-40 overflow-y-auto">
                                    {groups.map(g => (
                                        <label key={g.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-muted p-1 rounded">
                                            <input
                                                type="checkbox"
                                                checked={formData.groupIds.includes(g.id)}
                                                onChange={() => toggleGroupSelection(g.id)}
                                                className="rounded border-gray-300"
                                            />
                                            {g.name}
                                        </label>
                                    ))}
                                </div>
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                                <Button onClick={handleSave}>Save</Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/* Membership Modal */}
            {isMembershipModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in">
                    <div className="w-full max-w-md bg-background rounded-lg shadow-lg border p-6 flex flex-col max-h-[80vh]">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="text-lg font-semibold">Meeting Attendance</h3>
                                <p className="text-xs text-muted-foreground">{viewingPerson?.name}</p>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => setIsMembershipModalOpen(false)}>x</Button>
                        </div>

                        <div className="flex-1 overflow-y-auto">
                            {membershipLoading ? (
                                <div className="py-8 text-center text-sm text-muted-foreground">Loading...</div>
                            ) : membershipData.length === 0 ? (
                                <div className="py-8 text-center text-sm text-muted-foreground italic">No meeting attendance recorded.</div>
                            ) : (
                                <div className="space-y-3">
                                    {membershipData.map((group: any) => (
                                        <div key={group.id} className="p-3 rounded-lg border bg-muted/30">
                                            <div className="flex items-center justify-between mb-1.5">
                                                <div className="font-medium text-sm">{group.name}</div>
                                                <div className="text-[10px] text-muted-foreground bg-background rounded px-1.5 py-0.5 border shadow-sm">
                                                    Last: {new Date(group.lastAttended).toLocaleDateString()}
                                                </div>
                                            </div>
                                            <div className="flex gap-2 flex-wrap text-[10px]">
                                                {group.presentCount > 0 && (
                                                    <span className="px-1.5 py-0.5 rounded bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                                        {group.presentCount} present
                                                    </span>
                                                )}
                                                {group.lateCount > 0 && (
                                                    <span className="px-1.5 py-0.5 rounded bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
                                                        {group.lateCount} late
                                                    </span>
                                                )}
                                                {group.excusedCount > 0 && (
                                                    <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                                                        {group.excusedCount} excused
                                                    </span>
                                                )}
                                                {group.absentCount > 0 && (
                                                    <span className="px-1.5 py-0.5 rounded bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                                                        {group.absentCount} absent
                                                    </span>
                                                )}
                                                <span className="px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">
                                                    {group.totalMeetings} total
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end pt-4 mt-auto">
                            <Button size="sm" onClick={() => setIsMembershipModalOpen(false)}>Close</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
