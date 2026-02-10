import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth()
    if (!session) return new NextResponse("Unauthorized", { status: 401 })

    try {
        const { id } = await params

        const attendance = await prisma.meetingAttendance.findMany({
            where: {
                speakerId: id,
            },
            include: {
                meeting: {
                    include: {
                        meetingGroup: true,
                    },
                },
            },
            orderBy: {
                meeting: {
                    date: "desc",
                },
            },
        })

        // Group by meeting group
        const groupMap = new Map<
            string,
            {
                id: string
                name: string
                lastAttended: Date
                presentCount: number
                lateCount: number
                excusedCount: number
                absentCount: number
                totalMeetings: number
            }
        >()

        attendance.forEach((record) => {
            const mg = record.meeting.meetingGroup
            if (!mg) return

            if (!groupMap.has(mg.id)) {
                groupMap.set(mg.id, {
                    id: mg.id,
                    name: mg.name,
                    lastAttended: record.meeting.date,
                    presentCount: 0,
                    lateCount: 0,
                    excusedCount: 0,
                    absentCount: 0,
                    totalMeetings: 0,
                })
            }

            const entry = groupMap.get(mg.id)!
            entry.totalMeetings += 1
            if (record.status === "PRESENT") entry.presentCount += 1
            else if (record.status === "LATE") entry.lateCount += 1
            else if (record.status === "EXCUSED") entry.excusedCount += 1
            else if (record.status === "ABSENT") entry.absentCount += 1
        })

        const result = Array.from(groupMap.values())

        return NextResponse.json(result)
    } catch (error) {
        console.error("Failed to fetch attendance:", error)
        return new NextResponse("Internal Server Error", { status: 500 })
    }
}
