import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import {
    updateBroadcast,
    subscribeToBroadcast,
    unsubscribeFromBroadcast,
    hasBroadcast,
} from "@/lib/broadcast-store"

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ token: string }> }
) {
    const session = await auth()
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { token } = await params
    const { queues } = await request.json()

    const updated = updateBroadcast(token, queues)
    if (!updated) {
        return NextResponse.json({ error: "Broadcast not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
}

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ token: string }> }
) {
    const { token } = await params

    if (!hasBroadcast(token)) {
        return NextResponse.json({ error: "Broadcast not found" }, { status: 404 })
    }

    const stream = new ReadableStream({
        start(controller) {
            const encoder = new TextEncoder()

            const currentState = subscribeToBroadcast(token, controller)

            // Send initial state
            if (currentState) {
                controller.enqueue(
                    encoder.encode(`data: ${JSON.stringify(currentState)}\n\n`)
                )
            }

            // Send keepalive every 30s to prevent connection timeout
            const keepalive = setInterval(() => {
                try {
                    controller.enqueue(encoder.encode(`: keepalive\n\n`))
                } catch {
                    clearInterval(keepalive)
                }
            }, 30000)

            // Cleanup when client disconnects
            _request.signal.addEventListener("abort", () => {
                clearInterval(keepalive)
                unsubscribeFromBroadcast(token, controller)
            })
        },
    })

    return new Response(stream, {
        headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache, no-transform",
            Connection: "keep-alive",
        },
    })
}
