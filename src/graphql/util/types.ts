import { Prisma, PrismaClient, User } from '@prisma/client'
import { populatedConversation, populatedParticipant } from '../resolvers/conversation'

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

export type PopulatedConversation = Prisma.ConversationGetPayload<{ include: typeof populatedConversation }>

export type PopulatedParticipant = Prisma.ConversationParticipantGetPayload<{ include: typeof populatedParticipant }>
