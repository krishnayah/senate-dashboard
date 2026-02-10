import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth()
    if (!session) {
        return new NextResponse("Unauthorized", { status: 401 })
    }

    try {
        const { id } = await params
        const body = await req.json()
        const { memberIds } = body as { memberIds: string[] }

        const group = await prisma.meetingGroup.update({
            where: { id },
            data: {
                requiredMembers: {
                    set: memberIds.map((mid) => ({ id: mid })),
                },
            },
            include: {
                requiredMembers: {
                    include: { groups: true },
                    orderBy: { name: "asc" },
                },
            },
        })

        return NextResponse.json(group)
    } catch (error) {
        return new NextResponse("Internal Server Error", { status: 500 })
    }
}
