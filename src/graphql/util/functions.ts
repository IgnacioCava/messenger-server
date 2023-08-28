import { PopulatedParticipant } from './types'

export const userIsConversationParticipant = (participants: PopulatedParticipant[], userId: string): boolean => {
	return participants.some((participant) => participant.userId === userId)
}
