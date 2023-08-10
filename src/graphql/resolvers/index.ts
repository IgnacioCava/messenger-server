import userResolvers from './user.js'
import merge from 'lodash.merge'

const resolvers = merge({}, userResolvers)

export default resolvers
