import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { QueuePageClient } from "@/components/queue/QueuePageClient"

export default async function QueuePage() {
    const session = await auth()

    if (!session) {
        redirect("/login")
    }

    return (
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight">Speaker Queue</h1>

            </div>
            <QueuePageClient />
        </div>
    )
}
