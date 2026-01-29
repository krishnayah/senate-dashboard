import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"

// PATCH: Update speaker name/type
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth()
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
        const { id } = await params
        const body = await request.json()
        const { name, type } = body

        const updateData: { name?: string; type?: string } = {}

        if (name && typeof name === "string") {
            updateData.name = name.trim()
        }

        const validTypes = ["senate", "guest", "faculty"]
        if (type && validTypes.includes(type)) {
            updateData.type = type
        }

        if (Object.keys(updateData).length === 0) {
            return NextResponse.json({ error: "No valid fields to update" }, { status: 400 })
        }

        const speaker = await prisma.speaker.update({
            where: { id },
            data: updateData,
        })

        return NextResponse.json(speaker)
    } catch (error) {
        console.error("Error updating speaker:", error)
        return NextResponse.json({ error: "Failed to update speaker" }, { status: 500 })
    }
}

// DELETE: Remove speaker
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth()
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
        const { id } = await params

        await prisma.speaker.delete({
            where: { id }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Error deleting speaker:", error)
        return NextResponse.json({ error: "Failed to delete speaker" }, { status: 500 })
    }
}
