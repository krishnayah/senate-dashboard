import Redis from "ioredis"

const REDIS_URL = process.env.REDIS_URL!

// Main client for get/set/del operations
export function getRedisClient() {
    return new Redis(REDIS_URL, {
        maxRetriesPerRequest: 3,
        lazyConnect: true,
    })
}

// Separate client for pub/sub (Redis requires dedicated connections for subscriptions)
export function getRedisPubSubClient() {
    return new Redis(REDIS_URL, {
        maxRetriesPerRequest: 3,
        lazyConnect: true,
    })
}
