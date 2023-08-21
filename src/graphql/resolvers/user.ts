import { GraphQLContext } from '../util/types'
import { CreateUsernameResponse, SearchUsersResponse } from '../util/types'
import { GraphQLError } from 'graphql'

const resolvers = {
	Query: {
		searchUsers: async (_: unknown, args: { username: string }, context: GraphQLContext): Promise<SearchUsersResponse> => {
			try {
				const { username } = args
				const { session, prisma } = context
				if (!session) throw { message: 'Not authorized' }
				if (!username) throw { message: 'Missing username field' }
				console.log(session)
				const { username: currentUser } = session

				const users = await prisma.user.findMany({
					where: {
						username: {
							contains: username,
							not: currentUser,
							mode: 'insensitive'
						}
					}
				})

				return users
			} catch (error) {
				throw new GraphQLError(error?.message)
			}
		}
	},
	Mutation: {
		createUsername: async (_: unknown, args: { username: string }, context: GraphQLContext): Promise<CreateUsernameResponse> => {
			const { prisma, session } = context

			if (!session) throw { message: 'Not authorized' }

			try {
				/**
				 * Check that user is not taken
				 */
				const { username } = args
				const existingUser = await prisma.user.findUnique({ where: { username } })

				if (existingUser) throw { message: 'This username is taken' }

				const { id } = session

				await prisma.user.update({ where: { id }, data: { username } })

				return { success: true }
			} catch (error) {
				console.log('createUsername error', error)
				return {
					error: error?.message
				}
			}
		}
	},
	Subscription: {}
}

export default resolvers
