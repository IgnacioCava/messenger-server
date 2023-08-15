import { GraphQLContext } from '../util/types'
import { CreateUsernameResponse } from '../util/types'

const resolvers = {
	Query: {
		searchUsers: () => {
			return []
		}
	},
	Mutation: {
		createUsername: async (_: unknown, args: { username: string }, context: GraphQLContext): Promise<CreateUsernameResponse> => {
			const { prisma, user } = context

			if (!user) throw { message: 'Not authorized' }

			try {
				/**
				 * Check that user is not taken
				 */
				const { username } = args
				const existingUser = await prisma.user.findUnique({ where: { username } })

				if (existingUser) throw { message: 'This username is taken' }

				const { id } = user

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
