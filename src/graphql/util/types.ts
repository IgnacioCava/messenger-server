import { PrismaClient } from '@prisma/client'

export interface GraphQLContext {
	user: {
		name: string
		email: string
		id: string
	}
	prisma: PrismaClient
}

export type CreateUsernameResponse = { success: boolean } | { error: string }
