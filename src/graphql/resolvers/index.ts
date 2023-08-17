import userResolvers from './user.js'
import conversationResolvers from './conversation.js'
import merge from 'lodash.merge'

const resolvers = merge({}, userResolvers, conversationResolvers)

export default resolvers
