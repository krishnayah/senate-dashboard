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
                        speaker: {
                            include: { groups: true },
                        },
                    },
                },
            },
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
                    ...(title !== undefined && { title }),
                    ...(notes !== undefined && { notes }),
                },
            })
        }

        // Handle attendance changes
        if (attendance) {
            const { add, remove, updateStatus } = attendance

            // Add new attendees (default status PRESENT)
            if (add && Array.isArray(add)) {
                await Promise.all(
                    add.map((speakerId: string) =>
                        prisma.meetingAttendance.upsert({
                            where: {
                                meetingId_speakerId: {
                                    meetingId: id,
                                    speakerId,
                                },
                            },
                            create: {
                                meetingId: id,
                                speakerId,
                                status: "PRESENT",
                            },
                            update: {
                                status: "PRESENT",
                            },
                        })
                    )
                )
            }

            // Remove attendees
            if (remove && Array.isArray(remove)) {
                await prisma.meetingAttendance.deleteMany({
                    where: {
                        meetingId: id,
                        speakerId: { in: remove },
                    },
                })
            }

            // Update attendance status for specific attendees
            if (updateStatus && Array.isArray(updateStatus)) {
                await Promise.all(
                    updateStatus.map(
                        (item: {
                            speakerId: string
                            status: string
                            note?: string
                        }) =>
                            prisma.meetingAttendance.update({
                                where: {
                                    meetingId_speakerId: {
                                        meetingId: id,
                                        speakerId: item.speakerId,
                                    },
                                },
                                data: {
                                    status: item.status as any,
                                    ...(item.note !== undefined && {
                                        note: item.note,
                                    }),
                                },
                            })
                    )
                )
            }
        }

        // Return updated meeting
        const updatedMeeting = await prisma.meeting.findUnique({
            where: { id },
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
            where: { id },
        })
        return new NextResponse(null, { status: 204 })
    } catch (error) {
        return new NextResponse("Internal Server Error", { status: 500 })
    }
}
