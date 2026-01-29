import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { CommitteeView } from "@/components/committees/CommitteeView"

export default async function CommitteesPage() {
    const session = await auth()

    if (!session) {
        redirect("/login")
    }

    return (
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-6">
                <h1 className="text-3xl font-bold tracking-tight">Committees</h1>
                <p className="text-muted-foreground mt-2">
                    Manage committee meetings and attendance.
                </p>
            </div>
            <CommitteeView />
        </div>
    )
}
