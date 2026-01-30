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

        // Find all meetings this person attended
        const attendance = await prisma.meetingAttendance.findMany({
            where: {
                speakerId: id,
                isPresent: true
            },
            include: {
                meeting: {
                    include: {
                        committee: true
                    }
                }
            },
            orderBy: {
                meeting: {
                    date: 'desc'
                }
            }
        })

        // Group by committee and get the latest attendance info
        const committeeMap = new Map()

        attendance.forEach(record => {
            const committee = record.meeting.committee
            if (!committeeMap.has(committee.id)) {
                committeeMap.set(committee.id, {
                    id: committee.id,
                    name: committee.name,
                    lastAttended: record.meeting.date,
                    attendanceCount: 1
                })
            } else {
                const existing = committeeMap.get(committee.id)
                existing.attendanceCount += 1
            }
        })

        const result = Array.from(committeeMap.values())

        return NextResponse.json(result)
    } catch (error) {
        console.error("Failed to fetch committee attendance:", error)
        return new NextResponse("Internal Server Error", { status: 500 })
    }
}
