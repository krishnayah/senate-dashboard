import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { createBroadcast, removeBroadcast } from "@/lib/broadcast-store"
import { sendDiscordBroadcastNotification } from "@/lib/discord"

export async function POST(request: Request) {
    const session = await auth()
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = await createBroadcast()

    // Build the broadcast URL from the request origin
    const origin = request.headers.get("origin") || request.headers.get("referer")?.replace(/\/[^/]*$/, "") || ""
    const broadcastUrl = `${origin}/queue/live/${token}`

    // Fire-and-forget Discord notification
    sendDiscordBroadcastNotification(broadcastUrl)

    return NextResponse.json({ token })
}

export async function DELETE(request: Request) {
    const session = await auth()
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { token } = await request.json()
    const removed = await removeBroadcast(token)

    if (!removed) {
        return NextResponse.json({ error: "Broadcast not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
}
