import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET() {
    const session = await auth()
    if (!session) {
        return new NextResponse("Unauthorized", { status: 401 })
    }

    try {
        const groups = await prisma.meetingGroup.findMany({
            orderBy: { name: "asc" },
            include: {
                requiredMembers: {
                    include: { groups: true },
                    orderBy: { name: "asc" },
                },
            },
        })
        return NextResponse.json(groups)
    } catch (error) {
        return new NextResponse("Internal Server Error", { status: 500 })
    }
}

export async function POST(req: Request) {
    const session = await auth()
    if (!session) {
        return new NextResponse("Unauthorized", { status: 401 })
    }

    try {
        const body = await req.json()
        const { name } = body

        if (!name) {
            return new NextResponse("Name is required", { status: 400 })
        }

        const group = await prisma.meetingGroup.create({
            data: { name },
            include: {
                requiredMembers: {
                    include: { groups: true },
                },
            },
        })

        return NextResponse.json(group)
    } catch (error) {
        return new NextResponse("Internal Server Error", { status: 500 })
    }
}
