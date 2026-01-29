"use client"

import { useState, useEffect } from "react"
import { Group } from "@/types"
import { useToast } from "@/components/ui/use-toast"

export function useGroups() {
    const [groups, setGroups] = useState<Group[]>([])
    const [loading, setLoading] = useState(true)
    const { toast } = useToast()

    const fetchGroups = async () => {
        try {
            const res = await fetch("/api/groups")
            if (res.ok) {
                const data = await res.json()
                setGroups(data)
            }
        } catch (error) {
            console.error(error)
            toast({
                title: "Error",
                description: "Failed to load groups.",
                variant: "destructive"
            })
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchGroups()
    }, [])

    return {
        groups,
        loading,
        fetchGroups
    }
}
