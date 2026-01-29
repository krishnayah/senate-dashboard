"use client"

import { AuthButton } from "@/components/AuthButton";

export default function Home() {
  return (
    <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-col items-center justify-center space-y-8 text-center sm:py-20">
        <h1 className="text-4xl font-bold tracking-tighter sm:text-6xl text-blue-900 dark:text-blue-100">
          Senate Dashboard
        </h1>
        <p className="max-w-[600px] text-muted-foreground md:text-xl">
          developed by jordan uhhh guys its like a cool queue. login trust
        </p>
        <div className="flex gap-4">
          <AuthButton />
        </div>
      </div>
    </div>
  );
}
