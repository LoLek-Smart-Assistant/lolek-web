export type LiveGameSummaryParams = {
  platform: string
  gameName: string
  tagLine: string
}

export type LiveGameSummaryMessage =
  | {
      type: 'connected'
      message?: string
    }
  | {
      type: 'summary'
      data: LiveGameSummary
    }
  | {
      type: 'live-game-summary'
      status: 'live' | string
      data: LiveGameSummary
    }
  | {
      type: 'not-in-game'
      message: string
    }
  | {
      type: 'error'
      message: string
    }

export type LiveGameSummary = {
  game?: {
    gameMode?: string
    gameType?: string
    gameLengthSeconds?: number
    platformId?: string
    participants?: LiveGameParticipant[]
  }
  status?: string
  platform?: string
  gameDuration?: number
  gameStartTime?: number
  playerPuuid?: string
  playerSummonerName?: string
  myTeam?: LiveGameParticipant[]
  enemyTeam?: LiveGameParticipant[]
  participants?: LiveGameParticipant[]
  connectedParticipant?: LiveGameParticipant
  [key: string]: unknown
}

export type LiveGameParticipant = {
  summonerName?: string
  riotId?: string
  championName?: string
  championKey?: string
  championId?: number
  teamId?: number | string
  currentItems?: unknown[]
  predictedItems?: unknown[]
  items?: unknown[]
  itemIds?: unknown[]
  recommendedItems?: unknown[]
  level?: number
  champLevel?: number | string
  role?: string
  kda?: string
  kills?: number | string
  deaths?: number | string
  assists?: number | string
  [key: string]: unknown
}

type LiveGameSummaryHandlers = {
  onMessage: (message: LiveGameSummaryMessage) => void
  onOpen?: () => void
  onClose?: (event: CloseEvent) => void
  onError?: (event: Event) => void
}

export function connectLiveGameSummary(
  params: LiveGameSummaryParams,
  handlers: LiveGameSummaryHandlers,
) {
  const socket = new WebSocket(getLiveGameSummaryUrl(params))

  socket.addEventListener('open', () => handlers.onOpen?.())
  socket.addEventListener('close', (event) => handlers.onClose?.(event))
  socket.addEventListener('error', (event) => handlers.onError?.(event))
  socket.addEventListener('message', (event) => {
    handlers.onMessage(JSON.parse(event.data) as LiveGameSummaryMessage)
  })

  return socket
}

function getLiveGameSummaryUrl({
  platform,
  gameName,
  tagLine,
}: LiveGameSummaryParams) {
  const viteEnv = (import.meta as unknown as {
    env?: { VITE_API_URL?: string }
  }).env
  const apiUrl = viteEnv?.VITE_API_URL || 'http://localhost:3000'
  const url = new URL('/live-game-summary', apiUrl)

  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
  url.searchParams.set('platform', platform)
  url.searchParams.set('gameName', gameName)
  url.searchParams.set('tagLine', tagLine)

  return url
}
