import { Prisma, PrismaClient, User } from '@prisma/client'
import { populatedConversation, populatedParticipant } from '../resolvers/conversation'
import { Context } from 'graphql-ws'
import { PubSub } from 'graphql-subscriptions'
import { populatedMessage } from '../resolvers/messages'

interface Session {
	id: string
	name?: string | null
	email?: string | null
	emailVerified: unknown
	image?: string | null
	username: string
}

export interface GraphQLContext {
	session: Session
	prisma: PrismaClient
	pubsub: PubSub
}

export interface SubscriptionContext extends Context {
	connectionParams: {
		session?: Session
	}
}

export type CreateUsernameResponse = { success: boolean } | { error: string }

export type CreateConversationResponse = { participantIds: string[] }

export type SearchUsersResponse = User[]

export type PopulatedConversation = Prisma.ConversationGetPayload<{ include: typeof populatedConversation }>

export type PopulatedParticipant = Prisma.ConversationParticipantGetPayload<{ include: typeof populatedParticipant }>

export interface SendMessageArguments {
	id: string
	conversationId: string
	senderId: string
	body: string
}

export interface MessageSentSubscriptionPayload {
	messageSent: PopulatedMessage
}

export type PopulatedMessage = Prisma.MessageGetPayload<{ include: typeof populatedMessage }>
