const typeDefs = `#graphql
    scalar Date

    type CreateConversationResponse {
        conversationId: String!
    }

    type Mutation {
        createConversation(participantIds: [String]): CreateConversationResponse
    }

    type Conversation {
        id: String!
        lastMessage: Message
        users: [ConversationParticipant!]!
        createdAt: Date!
        updatedAt: Date!
    }

    type ConversationParticipant {
        id: String!
        user: User!
        hasSeenLatestMessage: Boolean!
    }

    type Query {
        conversations: [Conversation!]
    }
`

export default typeDefs
