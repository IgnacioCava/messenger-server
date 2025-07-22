import { ApolloServer } from '@apollo/server'
import resolvers from './graphql/resolvers/index.js'
import typeDefs from './graphql/typeDefs/index.js'

// npm install @apollo/server express graphql cors body-parser
import { expressMiddleware } from '@apollo/server/express4'
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer'
import { makeExecutableSchema } from '@graphql-tools/schema'
import { PrismaClient } from '@prisma/client'
import bodyParser from 'body-parser'
import cors from 'cors'
import * as dotenv from 'dotenv'
import express from 'express'
import { PubSub } from 'graphql-subscriptions'
import { useServer } from 'graphql-ws/lib/use/ws'
import { createServer } from 'http'
import { WebSocketServer } from 'ws'
import { GraphQLContext, SubscriptionContext } from './graphql/util/types.js'

dotenv.config()

const prisma = new PrismaClient()
const pubsub = new PubSub()

const app = express()

const httpServer = createServer(app)

const schema = makeExecutableSchema({ typeDefs, resolvers })

const server = new ApolloServer({
	schema,
	introspection: true,
	cache: 'bounded',
	plugins: [
		ApolloServerPluginDrainHttpServer({ httpServer }),
		{
			async serverWillStart() {
				return {
					async drainServer() {
						await serverCleanup.dispose()
					}
				}
			}
		}
	]
})

const wsServer = new WebSocketServer({
	server: httpServer,
	path: '/graphql/subscriptions'
})

const serverCleanup = useServer(
	{
		schema,
		context: async (ctx: SubscriptionContext): Promise<GraphQLContext> => {
			const { session } = ctx.connectionParams
			return { session: session || null, prisma, pubsub }
		}
	},
	wsServer
)

await server.start()

const corsOptions: cors.CorsOptions = {
	origin: process.env.CLIENT_ORIGIN || 'http://localhost:3000',
	credentials: true
}

app.use(
	'/graphql',
	cors<cors.CorsRequest>(corsOptions),
	bodyParser.json({ limit: '50mb' }),
	expressMiddleware(server, {
		context: async ({ req }): Promise<GraphQLContext> => {
			const { session } = req.headers
			return { prisma, session: JSON.parse(session as string) || '', pubsub }
		}
	})
)

// Modified server startup
await new Promise<void>((resolve) => httpServer.listen({ port: 4000 }, resolve))
console.log(`🚀 Server ready at http://localhost:4000/graphql`)
