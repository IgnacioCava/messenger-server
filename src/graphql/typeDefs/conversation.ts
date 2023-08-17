const typeDefs = `#graphql
    type CreateConversationResponse {
        conversationId: String
    }

    type Mutation {
        createConversation(participantIds: [String]): CreateConversationResponse
    }
`

export default typeDefs
