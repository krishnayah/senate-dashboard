const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    try {
        console.log("Starting Migration...")

        // 1. Ensure Groups exist
        const groups = ["Senate", "EBoard", "Committee Member", "Faculty", "Guest"]

        for (const name of groups) {
            await prisma.group.upsert({
                where: { name },
                create: { name },
                update: {}
            })
            console.log(`Ensured group: ${name}`)
        }

        // 2. Migrate existing Speakers
        const speakers = await prisma.speaker.findMany({
            include: { groups: true }
        })

        console.log(`Found ${speakers.length} speakers to check.`)
        let migratedCount = 0

        for (const speaker of speakers) {
            let targetGroup = "Guest"
            if (speaker.type && speaker.type.toLowerCase() === "senate") targetGroup = "Senate"
            if (speaker.type && speaker.type.toLowerCase() === "faculty") targetGroup = "Faculty"
            if (speaker.type && speaker.type.toLowerCase() === "guest") targetGroup = "Guest"

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

        console.log(`Migration Complete. Migrated ${migratedCount} speakers.`)

    } catch (e) {
        console.error("Error:", e)
    } finally {
        await prisma.$disconnect()
    }
}

main()
