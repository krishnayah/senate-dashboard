import NextAuth from "next-auth"
import Discord from "next-auth/providers/discord"
import { PrismaAdapter } from "@auth/prisma-adapter"
import prisma from "./prisma"

const REQUIRED_GUILD_ID = process.env.DISCORD_GUILD_ID!
const REQUIRED_ROLE_ID = process.env.DISCORD_ROLE_ID!

async function checkDiscordRole(accessToken: string, userId: string): Promise<boolean> {
    try {
        if (!REQUIRED_GUILD_ID || !REQUIRED_ROLE_ID) {
            console.error("Missing Discord Guild or Role ID in environment variables")
            return false
        }

        // First, check if user is in the guild
        const memberResponse = await fetch(
            `https://discord.com/api/v10/users/@me/guilds/${REQUIRED_GUILD_ID}/member`,
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            }
        )

        if (!memberResponse.ok) {
            console.log("User is not in the required guild or cannot access member info")
            return false
        }

        const memberData = await memberResponse.json()

        // Check if user has the required role
        const hasRole = memberData.roles?.includes(REQUIRED_ROLE_ID) ?? false

        return hasRole
    } catch (error) {
        console.error("Error checking Discord role:", error)
        return false
    }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
    adapter: PrismaAdapter(prisma),
    providers: [
        Discord({
            clientId: process.env.DISCORD_CLIENT_ID!,
            clientSecret: process.env.DISCORD_CLIENT_SECRET!,
            authorization: {
                params: {
                    scope: "identify email guilds guilds.members.read",
                },
            },
        }),
    ],
    callbacks: {
        async signIn({ user, account }) {
            if (account?.provider === "discord" && account.access_token) {
                const hasRole = await checkDiscordRole(account.access_token, user.id!)

                // Update the user's role status in the database
                await prisma.user.upsert({
                    where: { discordId: account.providerAccountId },
                    create: {
                        id: user.id,
                        hasRequiredRole: hasRole,
                        discordId: account.providerAccountId,
                    },
                    update: {
                        hasRequiredRole: hasRole,
                    },
                });


                // If user doesn't have the required role, deny sign in
                if (!hasRole) {
                    return "/unauthorized"
                }
            }
            return true
        },
        async session({ session, user }) {
            if (session.user) {
                session.user.id = user.id
                // Fetch the latest role status
                const dbUser = await prisma.user.findUnique({
                    where: { id: user.id },
                    select: { hasRequiredRole: true },
                })
                    ; (session.user as any).hasRequiredRole = dbUser?.hasRequiredRole ?? false
            }
            return session
        },
    },
    pages: {
        signIn: "/login",
        error: "/auth/error",
    },
})
