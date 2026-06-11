import {
  liveMatch,
  teams,
  type Player,
  type Recommendation,
  type Team,
} from '../data/mockRiot'
import type {
  LiveGameSummary,
  LiveGameParticipant,
} from '../services/liveGameSummarySocket'

export function getEnemyChampionNames(
  summary: LiveGameSummary | null,
  visibleTeams: Team[],
  useMockFallback: boolean,
) {
  if (summary?.enemyTeam?.length) {
    return summary.enemyTeam.map(getParticipantChampionName)
  }

  const participants = getLiveParticipants(summary)
  const connectedTeamId = getConnectedTeamId(summary)

  if (participants.length && connectedTeamId) {
    return participants
      .filter((participant) => getTeamId(participant) !== connectedTeamId)
      .map(getParticipantChampionName)
  }

  if (useMockFallback) {
    return teams[1]?.players.map((player) => player.champion) ?? []
  }

  return visibleTeams[1]?.players.map((player) => player.champion) ?? []
}

export function formatGameDuration(gameLengthSeconds?: number) {
  if (typeof gameLengthSeconds !== 'number') {
    return liveMatch.duration
  }

  const minutes = Math.floor(gameLengthSeconds / 60)
  const seconds = gameLengthSeconds % 60

  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

export function getTeamsFromLiveSummary(
  summary: LiveGameSummary | null,
  useMockFallback: boolean,
): Team[] {
  const participants = getLiveParticipants(summary)

  if (!participants.length) {
    return useMockFallback ? teams : []
  }

  const connectedParticipant = getConnectedParticipant(summary, participants)
  const connectedTeamId = normalizeTeamId(connectedParticipant?.teamId)

  let myTeamParticipants = summary?.myTeam ?? []
  let enemyTeamParticipants = summary?.enemyTeam ?? []

  if (!myTeamParticipants.length && !enemyTeamParticipants.length) {
    if (connectedTeamId) {
      myTeamParticipants = participants.filter(
        (participant) => normalizeTeamId(participant.teamId) === connectedTeamId,
      )
      enemyTeamParticipants = participants.filter(
        (participant) =>
          normalizeTeamId(participant.teamId) &&
          normalizeTeamId(participant.teamId) !== connectedTeamId,
      )
    } else {
      myTeamParticipants = participants.slice(0, 5)
      enemyTeamParticipants = participants.slice(5, 10)
    }
  } else if (connectedTeamId) {
    const myTeamId = normalizeTeamId(myTeamParticipants[0]?.teamId)
    const enemyTeamId = normalizeTeamId(enemyTeamParticipants[0]?.teamId)

    if (myTeamId !== connectedTeamId && enemyTeamId === connectedTeamId) {
      const temp = myTeamParticipants
      myTeamParticipants = enemyTeamParticipants
      enemyTeamParticipants = temp
    }
  }

  const myTeamId =
    connectedTeamId ?? normalizeTeamId(myTeamParticipants[0]?.teamId)
  const enemyTeamId = normalizeTeamId(enemyTeamParticipants[0]?.teamId)

  const myTeamSide = teamSideFromId(myTeamId)
  const enemyTeamSide = teamSideFromId(enemyTeamId)

  const myTeamCandidates = myTeamParticipants.filter(
    (participant) =>
      !matchesConnectedParticipant(participant, connectedParticipant, summary),
  )

  const myTeamPlayers = (myTeamCandidates.length
    ? myTeamCandidates
    : myTeamParticipants
  )
    .slice(0, 4)
    .map((participant, index) =>
      mapParticipantToPlayer(
        participant,
        index,
        myTeamSide === 'red'
          ? 'from-rose-500 to-red-500'
          : 'from-cyan-400 to-blue-500',
      ),
    )

  const enemyTeamPlayers = (enemyTeamParticipants.length
    ? enemyTeamParticipants
    : participants
        .filter(
          (participant) => normalizeTeamId(participant.teamId) !== myTeamId,
        )
        .slice(0, 5)
  ).map((participant, index) =>
    mapParticipantToPlayer(
      participant,
      index,
      enemyTeamSide === 'red'
        ? 'from-rose-500 to-red-500'
        : 'from-cyan-400 to-blue-500',
    ),
  )

  return [
    {
      name: teamNameFromId(myTeamId) || 'Blue Team',
      side: myTeamSide,
      players: myTeamPlayers,
    },
    {
      name: teamNameFromId(enemyTeamId) || 'Red Team',
      side: enemyTeamSide,
      players: enemyTeamPlayers,
    },
  ]
}

export function getLiveGameDataFromMessage(message: {
  type: string
  data?: unknown
}) {
  if (!message.data || typeof message.data !== 'object') {
    return undefined
  }

  const data = message.data as LiveGameSummary

  if (
    message.type === 'summary' ||
    message.type === 'live-game-summary' ||
    Array.isArray(data.myTeam) ||
    Array.isArray(data.enemyTeam) ||
    Array.isArray(data.participants)
  ) {
    return data
  }

  return undefined
}

export function getRecommendationFromLiveSummary(
  summary: LiveGameSummary | null,
  fallback: Recommendation,
): Recommendation {
  const connectedParticipant = summary?.connectedParticipant
  const playerSummonerName = summary?.playerSummonerName

  if (playerSummonerName) {
    const connectedFromTeams = [
      ...(summary?.myTeam ?? []),
      ...(summary?.enemyTeam ?? []),
    ].find(
      (participant) =>
        participant.puuid === summary?.playerPuuid ||
        participant.summonerName === playerSummonerName,
    )

    return {
      ...fallback,
      champion: connectedFromTeams
        ? connectedFromTeams.championName ||
          formatChampionId(
            connectedFromTeams.championId ?? getChampionKey(connectedFromTeams),
          )
        : fallback.champion,
      championImage: connectedFromTeams
        ? getChampionImageUrl(
            connectedFromTeams.championImage ||
              getStringField(connectedFromTeams, 'image'),
          )
        : fallback.championImage,
      summonerName: playerSummonerName,
    }
  }

  if (!connectedParticipant) {
    return fallback
  }

  return {
    ...fallback,
    champion:
      connectedParticipant.championName ||
      getStringField(connectedParticipant, 'champion') ||
      formatChampionId(connectedParticipant.championId),
    championImage: getChampionImageUrl(
      connectedParticipant.championImage ||
        getStringField(connectedParticipant, 'image'),
    ),
    summonerName:
      connectedParticipant.riotId ||
      connectedParticipant.summonerName ||
      fallback.summonerName,
  }
}

function getConnectedTeamId(summary: LiveGameSummary | null) {
  const connectedParticipant = summary?.connectedParticipant

  if (connectedParticipant) {
    return getTeamId(connectedParticipant)
  }

  const playerPuuid = summary?.playerPuuid
  const playerSummonerName = summary?.playerSummonerName

  return getLiveParticipants(summary)
    .filter(
      (participant) =>
        participant.puuid === playerPuuid ||
        participant.summonerName === playerSummonerName,
    )
    .map(getTeamId)
    .find((teamId): teamId is number => typeof teamId === 'number')
}

function getParticipantChampionName(participant: LiveGameParticipant) {
  return (
    participant.championName ||
    getStringField(participant, 'champion') ||
    formatChampionId(participant.championId ?? getChampionKey(participant))
  )
}

function mapParticipantToPlayer(
  participant: LiveGameParticipant,
  index: number,
  accent: string,
): Player {
  const summonerName =
    participant.riotId ||
    participant.summonerName ||
    getStringField(participant, 'gameName') ||
    `Player ${index + 1}`
  const champion =
    participant.championName ||
    getStringField(participant, 'champion') ||
    formatChampionId(participant.championId ?? getChampionKey(participant))
  const currentItems =
    getStringArrayField(participant, 'currentItems') ||
    getStringArrayField(participant, 'items') ||
    getStringArrayField(participant, 'itemIds') ||
    []
  const predictedItems =
    getStringArrayField(participant, 'predictedItems') ||
    getStringArrayField(participant, 'recommendedItems') ||
    []

  return {
    champion,
    championImage: getChampionImageUrl(
      participant.championImage || getStringField(participant, 'image'),
    ),
    summonerName,
    currentItems,
    predictedItems,
    level: participant.level ?? getNumberField(participant, 'champLevel') ?? 0,
    role: participant.role ?? 'Unknown',
    kda: participant.kda ?? formatKda(participant),
    accent,
  }
}

function getStringField(source: Record<string, unknown>, key: string) {
  const value = source[key]

  return typeof value === 'string' ? value : undefined
}

function getStringArrayField(source: Record<string, unknown>, key: string) {
  const value = source[key]

  if (!Array.isArray(value)) {
    return undefined
  }

  return value
    .map((item) => {
      if (typeof item === 'string' || typeof item === 'number') {
        return String(item)
      }

      if (item && typeof item === 'object') {
        const itemRecord = item as Record<string, unknown>

        return (
          getStringField(itemRecord, 'name') ||
          getStringField(itemRecord, 'itemName') ||
          getStringField(itemRecord, 'itemId')
        )
      }

      return undefined
    })
    .filter((item): item is string => Boolean(item))
}

function formatChampionId(championId?: number) {
  return typeof championId === 'number' ? `Champion ${championId}` : 'Unknown'
}

function getChampionKey(participant: LiveGameParticipant) {
  if (!participant.championKey) {
    return undefined
  }

  const championKey = Number(participant.championKey)

  return Number.isNaN(championKey) ? undefined : championKey
}

function getLiveParticipants(summary: LiveGameSummary | null) {
  if (summary?.participants?.length) {
    return summary.participants
  }

  const teamParticipants = [
    ...(summary?.myTeam ?? []),
    ...(summary?.enemyTeam ?? []),
  ]

  if (teamParticipants.length) {
    return teamParticipants
  }

  const game = summary?.game as Record<string, unknown> | undefined
  const gameParticipants = game?.participants

  return Array.isArray(gameParticipants)
    ? (gameParticipants as LiveGameParticipant[])
    : []
}

function getTeamId(participant: LiveGameParticipant) {
  const teamId = participant.teamId

  if (typeof teamId === 'number') {
    return teamId
  }

  if (typeof teamId === 'string') {
    return Number(teamId)
  }

  return undefined
}

function normalizeTeamId(teamId: LiveGameParticipant['teamId']) {
  if (typeof teamId === 'number') {
    return teamId
  }

  if (typeof teamId === 'string') {
    const parsed = Number(teamId)

    return Number.isNaN(parsed) ? undefined : parsed
  }

  return undefined
}

function teamSideFromId(teamId?: number): Team['side'] {
  return teamId === 200 ? 'red' : 'blue'
}

function teamNameFromId(teamId?: number) {
  if (teamId === 100) {
    return 'Blue Team'
  }

  if (teamId === 200) {
    return 'Red Team'
  }

  return undefined
}

function getConnectedParticipant(
  summary: LiveGameSummary | null,
  participants: LiveGameParticipant[],
) {
  if (summary?.connectedParticipant) {
    return summary.connectedParticipant
  }

  const playerSummonerName = summary?.playerSummonerName
  const playerPuuid = summary?.playerPuuid

  return participants.find((participant) => {
    if (playerPuuid && getStringField(participant, 'puuid') === playerPuuid) {
      return true
    }

    if (!playerSummonerName) {
      return false
    }

    const participantName =
      participant.riotId ||
      participant.summonerName ||
      getStringField(participant, 'gameName')

    return participantName === playerSummonerName
  })
}

function matchesConnectedParticipant(
  participant: LiveGameParticipant,
  connectedParticipant: LiveGameParticipant | undefined,
  summary: LiveGameSummary | null,
) {
  if (!connectedParticipant && !summary?.playerSummonerName) {
    return false
  }

  const participantName =
    participant.riotId ||
    participant.summonerName ||
    getStringField(participant, 'gameName')

  const connectedName = connectedParticipant
    ? connectedParticipant.riotId || connectedParticipant.summonerName
    : summary?.playerSummonerName

  if (connectedName && participantName && connectedName === participantName) {
    return true
  }

  const connectedPuuid =
    getStringField(connectedParticipant as LiveGameParticipant, 'puuid') ||
    summary?.playerPuuid

  if (connectedPuuid && getStringField(participant, 'puuid') === connectedPuuid) {
    return true
  }

  return false
}

function getNumberField(source: Record<string, unknown>, key: string) {
  const value = source[key]

  if (typeof value === 'number') {
    return value
  }

  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value)

    return Number.isNaN(parsed) ? undefined : parsed
  }

  return undefined
}

function formatKda(participant: LiveGameParticipant) {
  const kills = getNumberField(participant, 'kills')
  const deaths = getNumberField(participant, 'deaths')
  const assists = getNumberField(participant, 'assists')

  if (
    typeof kills === 'number' &&
    typeof deaths === 'number' &&
    typeof assists === 'number'
  ) {
    return `${kills} / ${deaths} / ${assists}`
  }

  return '- / - / -'
}

function getChampionImageUrl(championImage?: string) {
  if (!championImage) {
    return undefined
  }

  if (/^https?:\/\//i.test(championImage)) {
    return championImage
  }

  if (championImage.startsWith('/')) {
    const viteEnv = (import.meta as unknown as {
      env?: { VITE_API_URL?: string }
    }).env
    const apiUrl = viteEnv?.VITE_API_URL || 'http://localhost:3000'

    return new URL(championImage, apiUrl).toString()
  }

  return championImage
}
