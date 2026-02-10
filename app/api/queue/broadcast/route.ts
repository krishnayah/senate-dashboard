import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { createBroadcast, removeBroadcast } from "@/lib/broadcast-store"

export async function POST() {
    const session = await auth()
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = createBroadcast()
    return NextResponse.json({ token })
}

export async function DELETE(request: Request) {
    const session = await auth()
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { token } = await request.json()
    const removed = removeBroadcast(token)

    if (!removed) {
        return NextResponse.json({ error: "Broadcast not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
}
