const typeDefs = `#graphql
    scalar Date

    type CreateConversationResponse {
        conversationId: String!
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

    type ConversationUpdatedSubscriptionPayload {
        conversation: Conversation!
    }

    type ConversationDeletedSubscriptionPayload {
        id: String!
    }

    type Query {
        conversations: [Conversation!]!
    }

    type Mutation {
        createConversation(participantIds: [String]): CreateConversationResponse
        deleteConversation(conversationId: String!): Boolean
        markAsRead(userId: String!, conversationId: String!): Boolean
    }

    type Subscription {
        conversationCreated: Conversation!
        conversationUpdated: ConversationUpdatedSubscriptionPayload!
        conversationDeleted: ConversationDeletedSubscriptionPayload!
    }
`

export default typeDefs
