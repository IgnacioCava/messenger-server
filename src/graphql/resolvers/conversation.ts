import { Prisma } from '@prisma/client'
import { GraphQLError } from 'graphql'
import { ConversationDeletedSubscriptionPayload, ConversationUpdatedSubscriptionPayload, GraphQLContext, PopulatedConversation } from '../util/types'
import { withFilter } from 'graphql-subscriptions'
import { userIsConversationParticipant } from '../util/functions.js'

const resolvers = {
	Query: {
		conversations: async (_: unknown, args: unknown, context: GraphQLContext): Promise<PopulatedConversation[]> => {
			try {
				const { session, prisma } = context

				if (!session) {
					throw { message: 'Not authorized' }
				}
				const { id: userId } = session

				const conversations = await prisma.conversation.findMany({
					where: {
						users: {
							some: {
								userId: {
									equals: userId
								}
							}
						}
					},
					orderBy: { updatedAt: 'desc' },
					include: populatedConversation
				})

				return conversations
			} catch (error) {
				throw new GraphQLError(error?.message)
			}
		}
	},
	Mutation: {
		createConversation: async (_: unknown, args: { participantIds: string[] }, context: GraphQLContext): Promise<{ conversationId: string }> => {
			try {
				const { session, prisma, pubsub } = context
				const { participantIds } = args

				if (!session) throw new GraphQLError('Not authorized')

				const { id: userId } = session

				const conversation = await prisma.conversation.create({
					data: {
						users: {
							createMany: {
								data: participantIds.map((id) => ({
									userId: id,
									hasSeenLatestMessage: id === userId
								}))
							}
						}
					},
					include: populatedConversation
				})

				pubsub.publish('CONVERSATION_CREATED', {
					conversationCreated: conversation
				})

				return { conversationId: conversation.id }
			} catch (error) {
				throw new GraphQLError(error?.message)
			}
		},
		deleteConversation: async (_: unknown, args: { conversationId: string }, context: GraphQLContext): Promise<boolean> => {
			const { session, prisma, pubsub } = context
			const { conversationId } = args

			if (!session) throw new GraphQLError('Not authorized')

			try {
				const conversation = await prisma.conversation.update({
					where: { id: conversationId },
					data: { lastMessage: { disconnect: true } },
					include: populatedConversation
				})

				await prisma.$transaction([
					prisma.message.deleteMany({
						where: {
							conversationId
						}
					}),
					prisma.conversationParticipant.deleteMany({
						where: {
							conversationId
						}
					}),
					prisma.conversation.delete({
						where: {
							id: conversationId
						},
						include: populatedConversation
					})
				])

				pubsub.publish('CONVERSATION_DELETED', {
					conversationDeleted: conversation
				})
			} catch (error) {
				console.log('deleteConversation error', error)
				throw new GraphQLError('Failed to delete conversation')
			}
			return true
		},
		markAsRead: async (_: unknown, args: { userId: string; conversationId: string }, context: GraphQLContext): Promise<boolean> => {
			const { session, prisma } = context
			const { conversationId, userId } = args

			if (!session) throw new GraphQLError('Not authorized')

			try {
				const participant = await prisma.conversationParticipant.findFirst({
					where: { userId, conversationId }
				})

				if (!participant) throw new GraphQLError('Participant not found')

				await prisma.conversationParticipant.update({
					where: {
						id: participant.id
					},
					data: {
						hasSeenLatestMessage: true
					}
				})

				return true
			} catch (error) {
				console.log('markAsRead error', error)
				throw new GraphQLError(error?.message)
			}
		}
	},
	Subscription: {
		conversationCreated: {
			subscribe: withFilter(
				(_: unknown, args: unknown, context: GraphQLContext) => {
					const { pubsub } = context
					return pubsub.asyncIterator(['CONVERSATION_CREATED'])
				},
				(payload: conversationCreatedSubscriptionPayload, _: unknown, context: GraphQLContext) => {
					const { session } = context
					if (!session) throw new GraphQLError('Not authorized')
					const { users } = payload.conversationCreated
					return userIsConversationParticipant(users, session.id)
				}
			)
		},
		conversationUpdated: {
			subscribe: withFilter(
				(_: unknown, args: unknown, context: GraphQLContext) => {
					const { pubsub } = context
					return pubsub.asyncIterator(['CONVERSATION_UPDATED'])
				},
				(payload: ConversationUpdatedSubscriptionPayload, _: unknown, context: GraphQLContext) => {
					const { session } = context
					if (!session) throw new GraphQLError('Not authorized')

					const { conversation } = payload.conversationUpdated
					return userIsConversationParticipant(conversation.users, session.id)
				}
			)
		},
		conversationDeleted: {
			subscribe: withFilter(
				(_: unknown, __: unknown, context: GraphQLContext) => {
					const { pubsub } = context
					return pubsub.asyncIterator(['CONVERSATION_DELETED'])
				},
				(payload: ConversationDeletedSubscriptionPayload, _: unknown, context: GraphQLContext) => {
					const { session } = context
					if (!session) throw new GraphQLError('Not authorized')
					const { conversationDeleted } = payload
					return userIsConversationParticipant(conversationDeleted.users, session.id)
				}
			)
		}
	}
}

export interface conversationCreatedSubscriptionPayload {
	conversationCreated: PopulatedConversation
}

export const populatedParticipant = Prisma.validator<Prisma.ConversationParticipantInclude>()({
	user: {
		select: {
			id: true,
			username: true,
			image: true
		}
	}
})

export const populatedConversation = Prisma.validator<Prisma.ConversationInclude>()({
	users: {
		include: populatedParticipant
	},
	lastMessage: {
		include: {
			sender: {
				select: {
					id: true,
					username: true,
					image: true
				}
			}
		}
	}
})

export default resolvers
