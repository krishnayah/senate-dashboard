import { getRedisClient } from "@/lib/redis"

const BROADCAST_PREFIX = "broadcast:"
const BROADCAST_TTL = 2 * 60 * 60 // 2 hours in seconds
const BROADCAST_CHANNEL_PREFIX = "broadcast-channel:"

function broadcastKey(token: string) {
    return `${BROADCAST_PREFIX}${token}`
}

export function broadcastChannel(token: string) {
    return `${BROADCAST_CHANNEL_PREFIX}${token}`
}

export async function createBroadcast(): Promise<string> {
    const redis = getRedisClient()
    try {
        const token = crypto.randomUUID()
        await redis.set(broadcastKey(token), JSON.stringify([]), "EX", BROADCAST_TTL)
        return token
    } finally {
        await redis.quit()
    }
}

export async function updateBroadcast(token: string, queues: any[]): Promise<boolean> {
    const redis = getRedisClient()
    try {
        const key = broadcastKey(token)
        const exists = await redis.exists(key)
        if (!exists) return false

        const data = JSON.stringify(queues)
        await redis.set(key, data, "EX", BROADCAST_TTL)
        // Publish to the channel so SSE subscribers on any instance get the update
        await redis.publish(broadcastChannel(token), data)
        return true
    } finally {
        await redis.quit()
    }
}

export async function getBroadcastState(token: string): Promise<any[] | null> {
    const redis = getRedisClient()
    try {
        const data = await redis.get(broadcastKey(token))
        if (data === null) return null
        return JSON.parse(data)
    } finally {
        await redis.quit()
    }
}

export async function removeBroadcast(token: string): Promise<boolean> {
    const redis = getRedisClient()
    try {
        const deleted = await redis.del(broadcastKey(token))
        if (deleted > 0) {
            // Publish a "closed" message so SSE clients know to disconnect
            await redis.publish(broadcastChannel(token), "__CLOSED__")
        }
        return deleted > 0
    } finally {
        await redis.quit()
    }
}

export async function hasBroadcast(token: string): Promise<boolean> {
    const redis = getRedisClient()
    try {
        return (await redis.exists(broadcastKey(token))) === 1
    } finally {
        await redis.quit()
    }
}
