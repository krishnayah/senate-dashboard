import { NextResponse } from "next/server"
import { removeBroadcast } from "@/lib/broadcast-store"

// Used by sendBeacon on tab close — no auth check since
// the token itself is the secret and this only deactivates broadcasts
export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { token } = body
        if (token) {
            await removeBroadcast(token)
        }
    } catch {
        // sendBeacon payloads can be malformed, ignore
    }
    return NextResponse.json({ ok: true })
}
