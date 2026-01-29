import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth()
    if (!session) return new NextResponse("Unauthorized", { status: 401 })

    try {
        const { id } = await params
        const body = await req.json()
        const { name, groups } = body

        const data: any = {}
        if (name) data.name = name

        if (groups && Array.isArray(groups)) {
            data.groups = {
                set: groups.map((gid: string) => ({ id: gid }))
            }
        }

        const updated = await prisma.speaker.update({
            where: { id },
            data,
            include: { groups: true }
        })

        return NextResponse.json(updated)
    } catch (error) {
        return new NextResponse("Internal Server Error", { status: 500 })
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth()
    if (!session) return new NextResponse("Unauthorized", { status: 401 })

    try {
        const { id } = await params
        await prisma.speaker.delete({ where: { id } })
        return new NextResponse(null, { status: 204 })
    } catch (error) {
        return new NextResponse("Internal Server Error", { status: 500 })
    }
}
