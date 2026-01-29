import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function UnauthorizedPage() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background">
            <div className="mx-auto flex max-w-md flex-col items-center space-y-6 text-center">
                <div className="space-y-2">
                    <h1 className="text-3xl font-bold tracking-tighter">Access Denied</h1>
                    <p className="text-muted-foreground">
                        You do not have the required role to access this dashboard.
                        Please contact a Student Senate administrator if you believe this is an error.
                    </p>
                </div>
                <Button asChild>
                    <Link href="/">Return Home</Link>
                </Button>
            </div>
        </div>
    )
}
