"use client"

import Link from "next/link"
import { AuthButton } from "@/components/AuthButton"

export function Navbar() {
    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-14 items-center justify-between mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="mr-4 flex">
                    <Link className="mr-6 flex items-center space-x-2" href="/">
                        <span className="hidden font-bold sm:inline-block">
                            RPI Student Senate
                        </span>
                    </Link>
                    <nav className="flex items-center space-x-6 text-sm font-medium">
                        <Link
                            href="/"
                            className="text-muted-foreground transition-colors hover:text-foreground"
                        >
                            Home
                        </Link>
                        <Link
                            href="/queue"
                            className="text-muted-foreground transition-colors hover:text-foreground"
                        >
                            Queue
                        </Link>
                        <Link
                            href="/committees"
                            className="text-muted-foreground transition-colors hover:text-foreground"
                        >
                            Committees
                        </Link>
                        <Link
                            href="/people"
                            className="text-muted-foreground transition-colors hover:text-foreground"
                        >
                            People
                        </Link>
                    </nav>
                </div>
                <AuthButton />
            </div>
        </header>
    )
}
