import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET() {
    const session = await auth()
    if (!session) {
        return new NextResponse("Unauthorized", { status: 401 })
    }

    try {
        const committees = await prisma.committee.findMany({
            orderBy: { name: 'asc' }
        })
        return NextResponse.json(committees)
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

        const committee = await prisma.committee.create({
            data: { name }
        })

        return NextResponse.json(committee)
    } catch (error) {
        return new NextResponse("Internal Server Error", { status: 500 })
    }
}
