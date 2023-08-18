const typeDefs = `#graphql
    type Message {
        id: String!
        sender: User!
        body: String!
        createdAt: Date!
    }
`

export default typeDefs
