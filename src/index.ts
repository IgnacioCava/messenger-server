import { ApolloServer } from '@apollo/server'
import resolvers from './graphql/resolvers/index.js'
import typeDefs from './graphql/typeDefs/index.js'

// npm install @apollo/server express graphql cors body-parser
import { expressMiddleware } from '@apollo/server/express4'
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer'
import bodyParser from 'body-parser'
import cors from 'cors'
import express from 'express'
import http from 'http'
import * as dotenv from 'dotenv'
import { PrismaClient } from '@prisma/client'
import { GraphQLContext } from './graphql/util/types.js'

dotenv.config()

const prisma = new PrismaClient()

const app = express()

const httpServer = http.createServer(app)

const server = new ApolloServer({
	typeDefs,
	resolvers,
	introspection: true,
	cache: 'bounded',
	plugins: [ApolloServerPluginDrainHttpServer({ httpServer })]
})

await server.start()

const corsOptions: cors.CorsOptions = {
	origin: process.env.CLIENT_ORIGIN,
	credentials: true
}

app.use(
	'/graphql',
	cors<cors.CorsRequest>(corsOptions),
	bodyParser.json({ limit: '50mb' }),
	expressMiddleware(server, {
		context: async ({ req }): Promise<GraphQLContext> => {
			const { session } = req.headers
			return { prisma, session: JSON.parse(session as string) || '' }
		}
	})
)

// Modified server startup
await new Promise<void>((resolve) => httpServer.listen({ port: 4000 }, resolve))
console.log(`🚀 Server ready at http://localhost:4000/graphql`)
