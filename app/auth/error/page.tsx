"use client"

import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Suspense } from "react"

function ErrorContent() {
    const searchParams = useSearchParams()
    const error = searchParams.get("error")

    const errorMessages: Record<string, string> = {
        Configuration: "There is a problem with the server configuration.",
        AccessDenied: "You do not have permission to sign in.",
        Verification: "The sign in link is no longer valid.",
        Default: "An error occurred during authentication.",
    }

    const message = errorMessages[error || "Default"] || errorMessages.Default

    return (
        <div className="mx-auto flex max-w-md flex-col items-center space-y-6 text-center">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter">Authentication Error</h1>
                <p className="text-muted-foreground">{message}</p>
                {error && (
                    <p className="text-xs text-muted-foreground">Error code: {error}</p>
                )}
            </div>
            <Button asChild>
                <Link href="/">Return Home</Link>
            </Button>
        </div>
    )
}

export default function AuthErrorPage() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background">
            <Suspense fallback={<div>Loading...</div>}>
                <ErrorContent />
            </Suspense>
        </div>
    )
}
