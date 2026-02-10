interface BroadcastSession {
    queues: any[]
    clients: Set<ReadableStreamDefaultController>
    lastUpdated: number
}

const broadcasts = new Map<string, BroadcastSession>()

export function createBroadcast(): string {
    const token = crypto.randomUUID()
    broadcasts.set(token, {
        queues: [],
        clients: new Set(),
        lastUpdated: Date.now(),
    })
    return token
}

export function updateBroadcast(token: string, queues: any[]): boolean {
    const session = broadcasts.get(token)
    if (!session) return false

    session.queues = queues
    session.lastUpdated = Date.now()

    const message = `data: ${JSON.stringify(queues)}\n\n`
    const encoder = new TextEncoder()

    for (const controller of session.clients) {
        try {
            controller.enqueue(encoder.encode(message))
        } catch {
            session.clients.delete(controller)
        }
    }

    return true
}

export function subscribeToBroadcast(
    token: string,
    controller: ReadableStreamDefaultController
): any[] | null {
    const session = broadcasts.get(token)
    if (!session) return null

    session.clients.add(controller)
    return session.queues
}

export function unsubscribeFromBroadcast(
    token: string,
    controller: ReadableStreamDefaultController
): void {
    const session = broadcasts.get(token)
    if (session) {
        session.clients.delete(controller)
    }
}

export function removeBroadcast(token: string): boolean {
    const session = broadcasts.get(token)
    if (!session) return false

    for (const controller of session.clients) {
        try {
            controller.close()
        } catch {
            // already closed
        }
    }

    broadcasts.delete(token)
    return true
}

export function hasBroadcast(token: string): boolean {
    return broadcasts.has(token)
}
