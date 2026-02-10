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
        const meetings = await prisma.meeting.findMany({
            where: { meetingGroupId: id },
            orderBy: { date: "desc" },
            include: {
                attendance: {
                    include: {
                        speaker: {
                            include: { groups: true },
                        },
                    },
                },
            },
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

        const meetingGroup = await prisma.meetingGroup.findUnique({
            where: { id },
            include: {
                requiredMembers: true,
            },
        })

        if (!meetingGroup) {
            return new NextResponse("Meeting group not found", { status: 404 })
        }

        const defaultTitle = `${meetingGroup.name} ${new Date().toLocaleDateString()}`

        // Create the meeting and auto-populate attendance from required members
        const meeting = await prisma.meeting.create({
            data: {
                title: title || defaultTitle,
                meetingGroupId: id,
                attendance: {
                    create: meetingGroup.requiredMembers.map((member) => ({
                        speakerId: member.id,
                        status: "ABSENT",
                    })),
                },
            },
            include: {
                attendance: {
                    include: {
                        speaker: {
                            include: { groups: true },
                        },
                    },
                },
            },
        })

        return NextResponse.json(meeting)
    } catch (error) {
        console.error(error)
        return new NextResponse("Internal Server Error", { status: 500 })
    }
}
