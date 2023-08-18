import { Prisma } from '@prisma/client'
import { GraphQLError } from 'graphql'
import { GraphQLContext, PopulatedConversation } from '../util/types'

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
					orderBy: { updatedAt: 'asc' },
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
				const { session, prisma } = context
				const { participantIds } = args

				if (!session) {
					throw { message: 'Not authorized' }
				}

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

				return { conversationId: conversation.id }
			} catch (error) {
				throw new GraphQLError(error?.message)
			}
		}
	},
	Subscription: {}
}

export const populatedParticipant = Prisma.validator<Prisma.ConversationParticipantInclude>()({
	user: {
		select: {
			id: true,
			username: true
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
					username: true
				}
			}
		}
	}
})

export default resolvers