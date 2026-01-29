import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth()
    if (!session) {
        return new NextResponse("Unauthorized", { status: 401 })
    }

    try {
        const { id } = await params
        // Fetch meetings for committee, ordered by date descending (most recent first)
        const meetings = await prisma.meeting.findMany({
            where: { committeeId: id },
            orderBy: { date: 'desc' },
            include: {
                attendance: {
                    include: {
                        speaker: true
                    }
                }
            }
        })
        return NextResponse.json(meetings)
    } catch (error) {
        return new NextResponse("Internal Server Error", { status: 500 })
    }
}

export async function POST(
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
        const { title } = body

        const committee = await prisma.committee.findUnique({
            where: { id }
        })

        if (!committee) {
            return new NextResponse("Committee not found", { status: 404 })
        }

        // Default title format if not provided
        const defaultTitle = `${committee.name} ${new Date().toLocaleDateString()}`

        const meeting = await prisma.meeting.create({
            data: {
                title: title || defaultTitle,
                committeeId: id,
            },
            include: {
                attendance: {
                    include: {
                        speaker: true
                    }
                }
            }
        })

        return NextResponse.json(meeting)
    } catch (error) {
        return new NextResponse("Internal Server Error", { status: 500 })
    }
}
