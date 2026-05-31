import axiosInstance from '../config/axiosConfig'

export type PlayedMatchSource = 'live' | 'manual'

export type PlayedMatchItem = {
  itemId: string
  itemName: string
  image?: string | null
  customTags?: string[] | null
  slot?: number
}

export type PlayedMatchPlayer = {
  summonerName: string
  riotId?: string | null
  championName: string
  championImage?: string | null
  championId?: string | number | null
  role?: string | null
  teamPosition?: string | null
  items: PlayedMatchItem[]
  kills?: number | null
  deaths?: number | null
  assists?: number | null
  level?: number | null
}

export type PlayedMatchTeam = {
  teamId: string
  name?: string | null
  won: boolean
  players: PlayedMatchPlayer[]
}

export type PlayedMatchRecord = {
  _id: string
  matchId: string
  userId: string
  source: PlayedMatchSource
  gameMode: string
  queue?: string | null
  durationSeconds: number
  startedAt?: string | null
  endedAt?: string | null
  winnerTeamId: string
  teams: PlayedMatchTeam[]
  createdAt?: string
  updatedAt?: string
}

export type SavePlayedMatchRequest = {
  matchId?: string
  source: PlayedMatchSource
  gameMode: string
  queue?: string | null
  durationSeconds: number
  startedAt?: string | null
  endedAt?: string | null
  winnerTeamId: string
  teams: PlayedMatchTeam[]
}

export type PlayedMatchesResponse = {
  matches: PlayedMatchRecord[]
}

export type SavePlayedMatchResponse = {
  match: PlayedMatchRecord
}

const playedMatchService = {
  syncPlayedMatches: () => {
    return axiosInstance.post('/played-matches')
  },

  savePlayedMatch: (payload: SavePlayedMatchRequest) => {
    return axiosInstance.post<SavePlayedMatchResponse>('/played-matches', payload)
  },

  saveCustomPlayedMatch: (payload: SavePlayedMatchRequest) => {
    return axiosInstance.post<SavePlayedMatchResponse>('/played-matches/custom', payload)
  },

  getPlayedMatches: () => {
    return axiosInstance.get<PlayedMatchesResponse>('/played-matches')
  },

  getPlayedMatch: (matchId: string) => {
    return axiosInstance.get<{ match: PlayedMatchRecord }>(`/played-matches/${matchId}`)
  },
}

export default playedMatchService
