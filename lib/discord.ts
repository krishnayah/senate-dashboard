const DISCORD_WEBHOOK_URL = "https://discord.com/api/webhooks/1470909004585635901/QiEKrA9QHIBIzlwWxO7GETAjxG-uccstkGZZPw0VuPnBXLHCPReyFa2f9_k_0pmx5l0O"

export async function sendDiscordBroadcastNotification(broadcastUrl: string) {

    const now = new Date()
    const time = now.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
    })

    try {
        await fetch(DISCORD_WEBHOOK_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                content: `**Queue broadcast started at ${time}**\n${broadcastUrl}`,
            }),
        })
    } catch (error) {
        console.error("Failed to send Discord broadcast notification:", error)
    }
}
