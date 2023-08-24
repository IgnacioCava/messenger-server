import userResolvers from './user.js'
import conversationResolvers from './conversation.js'
import messageResolvers from './messages.js'
import merge from 'lodash.merge'

const resolvers = merge({}, userResolvers, conversationResolvers, messageResolvers)

export default resolvers
