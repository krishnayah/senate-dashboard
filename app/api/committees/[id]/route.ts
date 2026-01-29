import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"

export async function PATCH(
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
        const { name } = body

        if (!name) {
            return new NextResponse("Name is required", { status: 400 })
        }

        const committee = await prisma.committee.update({
            where: { id },
            data: { name }
        })

        return NextResponse.json(committee)
    } catch (error) {
        return new NextResponse("Internal Server Error", { status: 500 })
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth()
    if (!session) {
        return new NextResponse("Unauthorized", { status: 401 })
    }

    try {
        const { id } = await params
        await prisma.committee.delete({
            where: { id }
        })
        return new NextResponse(null, { status: 204 })
    } catch (error) {
        return new NextResponse("Internal Server Error", { status: 500 })
    }
}
