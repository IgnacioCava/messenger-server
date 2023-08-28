const typeDefs = `#graphql
    type Message {
        id: String!
        sender: User!
        body: String!
        createdAt: Date!
        conversationId: String!
    }

    type Query {
        messages(conversationId: String!): [Message!]!
    }

    type Mutation {
        sendMessage(conversationId: String!, senderId: String!, body: String!): String
    }

    type Subscription {
        messageSent(conversationId: String!): Message!
    }
`

export default typeDefs
