const typeDefs = `#graphql
    type User {
        id: String!
        username: String!
        email: String!
        emailVerified: Boolean!
        image: String!
    }

    type SearchedUser {
        id: String!
        username: String!
    }

    type Query {
        searchUsers(username: String): [SearchedUser!]
    }

    type Mutation {
        createUsername(username: String!): CreateUsernameResponse
    }

    type CreateUsernameResponse {
        success: Boolean
        error: String
    }

    type Subscription {
        userCreated: User
    }
`

export default typeDefs
