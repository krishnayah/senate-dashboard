import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"

// POST: Increment speak count for a speaker
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth()
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
        const { id } = await params

        const speaker = await prisma.speaker.update({
            where: { id },
            data: { speakCount: { increment: 1 } },
        })

        return NextResponse.json(speaker)
    } catch (error) {
        console.error("Error incrementing speaker count:", error)
        return NextResponse.json({ error: "Failed to increment speak count" }, { status: 500 })
    }
}
