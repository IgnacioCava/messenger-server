const typeDefs = `#graphql
    type User {
        id: String
        username: String
    }

    type Query {
        searchUsers(username: String): [User]
    }

    type Mutation {
        createUsername(username: String): CreateUsernameResponse
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
