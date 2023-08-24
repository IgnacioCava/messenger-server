import { PopulatedParticipant } from './types'

export const userIsConversationParticipant = (participants: PopulatedParticipant[], userId): boolean => {
	return participants.some((participant) => participant.userId === userId)
}
