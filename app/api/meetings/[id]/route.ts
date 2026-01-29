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
        const meeting = await prisma.meeting.findUnique({
            where: { id },
            include: {
                attendance: {
                    include: {
                        speaker: true
                    }
                }
            }
        })

        if (!meeting) {
            return new NextResponse("Meeting not found", { status: 404 })
        }

        return NextResponse.json(meeting)
    } catch (error) {
        return new NextResponse("Internal Server Error", { status: 500 })
    }
}

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
        const { title, notes, attendance } = body

        // Update basic fields
        if (title !== undefined || notes !== undefined) {
            await prisma.meeting.update({
                where: { id },
                data: {
                    title,
                    notes
                }
            })
        }

        // Handle attendance if provided
        // Expecting attendance: { add: [speakerId], remove: [speakerId] }
        if (attendance) {
            const { add, remove } = attendance

            if (add && Array.isArray(add)) {
                await Promise.all(add.map((speakerId: string) =>
                    prisma.meetingAttendance.upsert({
                        where: {
                            meetingId_speakerId: {
                                meetingId: id,
                                speakerId
                            }
                        },
                        create: {
                            meetingId: id,
                            speakerId,
                            isPresent: true
                        },
                        update: {
                            isPresent: true
                        }
                    })
                ))
            }

            if (remove && Array.isArray(remove)) {
                await prisma.meetingAttendance.deleteMany({
                    where: {
                        meetingId: id,
                        speakerId: { in: remove }
                    }
                })
            }
        }

        // Return updated meeting
        const updatedMeeting = await prisma.meeting.findUnique({
            where: { id },
            include: {
                attendance: {
                    include: {
                        speaker: true
                    }
                }
            }
        })

        return NextResponse.json(updatedMeeting)

    } catch (error) {
        console.error(error)
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
        await prisma.meeting.delete({
            where: { id }
        })
        return new NextResponse(null, { status: 204 })
    } catch (error) {
        return new NextResponse("Internal Server Error", { status: 500 })
    }
}
