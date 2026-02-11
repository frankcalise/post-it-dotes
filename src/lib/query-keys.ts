export const queryKeys = {
  matches: {
    all: ['matches'] as const,
    detail: (dotaMatchId: string) => ['matches', dotaMatchId] as const,
  },
  players: {
    all: ['players'] as const,
    detail: (id: string) => ['players', id] as const,
  },
  tags: {
    all: ['tags'] as const,
    byPlayer: (playerId: string) => ['tags', 'player', playerId] as const,
  },
  notes: {
    byPlayer: (playerId: string) => ['notes', 'player', playerId] as const,
  },
}
