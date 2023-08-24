import { GraphQLError } from 'graphql'
import { GraphQLContext, MessageSentSubscriptionPayload, PopulatedMessage, SendMessageArguments } from '../util/types'
import { Prisma } from '@prisma/client'
import { withFilter } from 'graphql-subscriptions'
import { userIsConversationParticipant } from '../util/functions.js'
import { populatedConversation } from './conversation.js'

const resolvers = {
	Query: {
		messages: async (_: unknown, args: { conversationId: string }, context: GraphQLContext): Promise<PopulatedMessage[]> => {
			const { session, prisma } = context

			const { conversationId } = args

			if (!session) throw new GraphQLError('Not authorized')

			const { id: userId } = session
			console.log({ conversationId })

			const conversation = await prisma.conversation.findUnique({
				where: {
					id: conversationId
				},
				include: populatedConversation
			})

			if (!conversation) throw new GraphQLError('Conversation not found')
			if (!userIsConversationParticipant(conversation.users, userId)) throw new GraphQLError('Not Authorized')

			try {
				const messages = await prisma.message.findMany({
					where: {
						conversationId
					},
					include: populatedMessage,
					orderBy: {
						createdAt: 'asc'
					}
				})

				return messages
			} catch (error) {
				console.log(error)
				throw new GraphQLError(error?.message)
			}
		}
	},
	Mutation: {
		sendMessage: async (_: unknown, args: SendMessageArguments, context: GraphQLContext): Promise<boolean> => {
			const { session, prisma, pubsub } = context

			if (!session) throw new GraphQLError('Not authorized')

			const { id: userId } = session
			const { id: messageId, senderId, conversationId, body } = args

			if (userId !== senderId) throw new GraphQLError('Not authorized')

			try {
				const newMessage = await prisma.message.create({
					data: {
						id: messageId,
						senderId,
						conversationId,
						body
					},
					include: populatedMessage
				})

				const participant = await prisma.conversationParticipant.findFirst({
					where: {
						userId,
						conversationId
					}
				})

				if (!participant) throw new GraphQLError('Participant not found')

				const conversation = await prisma.conversation.update({
					where: {
						id: conversationId
					},
					data: {
						lastMessageId: newMessage.id,
						users: {
							update: {
								where: {
									id: participant.id
								},
								data: {
									hasSeenLatestMessage: true
								}
							},
							updateMany: {
								where: {
									NOT: {
										userId: senderId
									}
								},
								data: {
									hasSeenLatestMessage: false
								}
							}
						}
					},
					include: populatedConversation
				})

				console.log({ newMessage })
				pubsub.publish('MESSAGE_SENT', {
					messageSent: newMessage
				})
			} catch (error) {
				console.log('sendMessage error')
				throw new GraphQLError(error?.message)
			}
			return true
		}
	},
	Subscription: {
		messageSent: {
			subscribe: withFilter(
				(_: unknown, args: SendMessageArguments, context: GraphQLContext) => {
					const { pubsub } = context
					return pubsub.asyncIterator(['MESSAGE_SENT'])
				},
				(payload: MessageSentSubscriptionPayload, args: { conversationId: string }, context: GraphQLContext) => {
					console.log(payload.messageSent.conversationId === args.conversationId)
					return payload.messageSent.conversationId === args.conversationId
				}
			)
		}
	}
}

export const populatedMessage = Prisma.validator<Prisma.MessageInclude>()({
	sender: {
		select: {
			id: true,
			username: true
		}
	}
})

export default resolvers
