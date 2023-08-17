import { GraphQLContext } from '../util/types'

const resolvers = {
	Query: {},
	Mutation: {
		createConversation: async (_: unknown, args: { participantIds: string[] }, context: GraphQLContext) => {
			console.log(args.participantIds)
		}
	},
	Subscription: {}
}

export default resolvers
