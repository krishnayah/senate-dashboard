import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"

// GET: Fetch all speakers
export async function GET() {
    const session = await auth()
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
        const speakers = await prisma.speaker.findMany({
            include: { groups: true },
            orderBy: { name: 'asc' }
        })

        return NextResponse.json(speakers)
    } catch (error) {
        console.error("Error fetching speakers:", error)
        return NextResponse.json({ error: "Failed to fetch speakers" }, { status: 500 })
    }
}

// POST: Create new speaker
export async function POST(request: NextRequest) {
    const session = await auth()
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
        const body = await request.json()
        const { name, type, groupIds } = body

        if (!name || typeof name !== "string") {
            return NextResponse.json({ error: "Name is required" }, { status: 400 })
        }

        const validTypes = ["senate", "guest", "faculty"]
        const speakerType = validTypes.includes(type) ? type : "guest"

        const speaker = await prisma.speaker.create({
            data: {
                name: name.trim(),
                type: speakerType,
                groups: groupIds ? {
                    connect: groupIds.map((id: string) => ({ id }))
                } : undefined
            },
            include: { groups: true }
        })

        return NextResponse.json(speaker)
    } catch (error) {
        console.error("Error creating speaker:", error)
        return NextResponse.json({ error: "Failed to create speaker" }, { status: 500 })
    }
}
