import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import {
    updateBroadcast,
    getBroadcastState,
    hasBroadcast,
    broadcastChannel,
} from "@/lib/broadcast-store"
import { getRedisPubSubClient } from "@/lib/redis"

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

    const updated = await updateBroadcast(token, queues)
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

    const exists = await hasBroadcast(token)
    if (!exists) {
        return NextResponse.json({ error: "Broadcast not found" }, { status: 404 })
    }

    const encoder = new TextEncoder()
    const subscriber = getRedisPubSubClient()
    const channel = broadcastChannel(token)

    const stream = new ReadableStream({
        async start(controller) {
            // Send initial state from Redis
            const currentState = await getBroadcastState(token)
            if (currentState) {
                controller.enqueue(
                    encoder.encode(`data: ${JSON.stringify(currentState)}\n\n`)
                )
            }

            // Subscribe to Redis pub/sub channel for live updates
            await subscriber.subscribe(channel)

            subscriber.on("message", (_ch: string, message: string) => {
                try {
                    if (message === "__CLOSED__") {
                        controller.enqueue(
                            encoder.encode(`event: closed\ndata: {}\n\n`)
                        )
                        controller.close()
                        subscriber.unsubscribe(channel)
                        subscriber.quit()
                        return
                    }
                    controller.enqueue(
                        encoder.encode(`data: ${message}\n\n`)
                    )
                } catch {
                    subscriber.unsubscribe(channel)
                    subscriber.quit()
                }
            })

            // Keepalive every 30s
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
                subscriber.unsubscribe(channel)
                subscriber.quit()
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
