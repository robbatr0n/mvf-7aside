export interface Award {
    emoji: string
    title: string
    description: string
    winners: string[]
    value: string
    noWinner?: boolean
    runnerUp?: { names: string[]; value: string }
}

export interface PartnershipAward {
    emoji: string
    title: string
    description: string
    players: string[]
    value: string
    noWinner?: boolean
    runnerUp?: { names: string[]; value: string }
}