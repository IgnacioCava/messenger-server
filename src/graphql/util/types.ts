import { PrismaClient, User } from '@prisma/client'

export interface GraphQLContext {
	session: {
		name: string
		email: string
		id: string
		username: string
	}
	prisma: PrismaClient
}

export type CreateUsernameResponse = { success: boolean } | { error: string }

export type CreateConversationResponse = { participantIds: string[] }

export type SearchUsersResponse = User[]
