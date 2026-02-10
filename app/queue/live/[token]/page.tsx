import { BroadcastViewer } from "@/components/queue/BroadcastViewer"

export default async function LiveQueuePage({
    params,
}: {
    params: Promise<{ token: string }>
}) {
    const { token } = await params

    return (
        <div className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight">Speaker Queue</h1>
                <p className="text-sm text-muted-foreground mt-1">Live view</p>
            </div>
            <BroadcastViewer token={token} />
        </div>
    )
}
