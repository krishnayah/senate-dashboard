import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET() {
    try {
        // 1. Ensure Groups exist
        const groups = ["Senate", "EBoard", "Committee Member", "Faculty", "Guest"]

        for (const name of groups) {
            await prisma.group.upsert({
                where: { name },
                create: { name },
                update: {}
            })
        }

        // 2. Migrate existing Speakers
        const speakers = await prisma.speaker.findMany({
            include: { groups: true }
        })

        let migratedCount = 0

        for (const speaker of speakers) {
            // map old type string to Group name (capitalize first letter usually)
            // our types were: "senate", "guest", "faculty"

            let targetGroup = "Guest"
            if (speaker.type.toLowerCase() === "senate") targetGroup = "Senate"
            if (speaker.type.toLowerCase() === "faculty") targetGroup = "Faculty"
            if (speaker.type.toLowerCase() === "guest") targetGroup = "Guest"

            // Check if already in group
            const inGroup = speaker.groups.some(g => g.name === targetGroup)

            if (!inGroup) {
                await prisma.speaker.update({
                    where: { id: speaker.id },
                    data: {
                        groups: {
                            connect: { name: targetGroup }
                        }
                    }
                })
                migratedCount++
            }
        }

        return NextResponse.json({
            success: true,
            migrated: migratedCount,
            totalSpeakers: speakers.length
        })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: String(error) }, { status: 500 })
    }
}
