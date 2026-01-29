import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET() {
    const session = await auth()
    if (!session) return new NextResponse("Unauthorized", { status: 401 })

    try {
        const groups = await prisma.group.findMany({
            orderBy: { name: 'asc' }
        })
        return NextResponse.json(groups)
    } catch (error) {
        return new NextResponse("Internal Server Error", { status: 500 })
    }
}
