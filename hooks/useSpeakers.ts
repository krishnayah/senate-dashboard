"use client"

import { useState, useEffect } from "react"
import { Speaker, Group } from "@/types"
import { useToast } from "@/components/ui/use-toast"

export function useSpeakers() {
    const [speakers, setSpeakers] = useState<Speaker[]>([])
    const [loading, setLoading] = useState(true)
    const { toast } = useToast()

    const fetchSpeakers = async () => {
        try {
            const res = await fetch("/api/speakers")
            if (res.ok) {
                const data = await res.json()
                setSpeakers(data)
            } else {
                throw new Error("Failed to fetch speakers")
            }
        } catch (error) {
            console.error(error)
            toast({
                title: "Error",
                description: "Failed to load speakers.",
                variant: "destructive"
            })
        } finally {
            setLoading(false)
        }
    }

    const createSpeaker = async (name: string, groupIds: string[]) => {
        try {
            const res = await fetch("/api/speakers", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, groupIds })
            })
            if (res.ok) {
                const newSpeaker = await res.json()
                await fetchSpeakers() // Refresh list
                return newSpeaker as Speaker
            } else {
                throw new Error("Failed to create speaker")
            }
        } catch (error) {
            console.error(error)
            toast({
                title: "Error",
                description: "Failed to create speaker.",
                variant: "destructive"
            })
            return null
        }
    }

    const updateSpeaker = async (id: string, data: Partial<Speaker>) => {
        try {
            const res = await fetch(`/api/speakers/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data)
            })
            if (res.ok) {
                await fetchSpeakers()
                return true
            }
        } catch (error) {
            console.error(error)
            toast({
                title: "Error",
                description: "Failed to update speaker.",
                variant: "destructive"
            })
        }
        return false
    }

    const deleteSpeaker = async (id: string) => {
        try {
            const res = await fetch(`/api/speakers/${id}`, {
                method: "DELETE",
            })
            if (res.ok) {
                await fetchSpeakers()
                return true
            }
        } catch (error) {
            console.error(error)
            toast({
                title: "Error",
                description: "Failed to delete speaker.",
                variant: "destructive"
            })
        }
        return false
    }

    useEffect(() => {
        fetchSpeakers()
    }, [])

    return {
        speakers,
        loading,
        fetchSpeakers,
        createSpeaker,
        updateSpeaker,
        deleteSpeaker
    }
}
