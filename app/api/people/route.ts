import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
    const session = await auth()
    if (!session) return new NextResponse("Unauthorized", { status: 401 })

    try {
        const people = await prisma.speaker.findMany({
            include: { groups: true },
            orderBy: { name: 'asc' }
        })
        return NextResponse.json(people)
    } catch (error) {
        return new NextResponse("Internal Server Error", { status: 500 })
    }
}

export async function POST(req: NextRequest) {
    const session = await auth()
    if (!session) return new NextResponse("Unauthorized", { status: 401 })

    try {
        const body = await req.json()
        const { name, groups } = body

        if (!name) return new NextResponse("Name is required", { status: 400 })

        const connectQuery = Array.isArray(groups) ? groups.map((id: string) => ({ id })) : []

        const person = await prisma.speaker.create({
            data: {
                name,
                type: "guest", // Default
                groups: {
                    connect: connectQuery
                }
            },
            include: { groups: true }
        })

        return NextResponse.json(person)
    } catch (error) {
        console.error(error)
        return new NextResponse("Internal Server Error", { status: 500 })
    }
}
