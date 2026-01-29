const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    try {
        console.log("Checking Groups...")
        const groups = await prisma.group.findMany()
        console.log("Groups found:", groups.length)
        console.log("Success")
    } catch (e) {
        console.error("Error:", e)
    } finally {
        await prisma.$disconnect()
    }
}

main()
