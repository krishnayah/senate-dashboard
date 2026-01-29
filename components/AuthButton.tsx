"use client"

import { signIn, signOut, useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"

export function AuthButton() {
    const { data: session, status } = useSession()

    if (status === "loading") {
        return (
            <Button variant="outline" disabled>
                Loading...
            </Button>
        )
    }

    if (session) {
        return (
            <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground">
                    {session.user?.name}
                </span>
                <Button variant="outline" onClick={() => signOut()}>
                    Sign Out
                </Button>
            </div>
        )
    }

    return (
        <Button onClick={() => signIn("discord")}>
            Sign in with Discord
        </Button>
    )
}
