import { useEffect, useRef, useState } from 'react'

import { ChatSection } from '../../components/ChatSection'
import { MatchStatusCard } from '../../components/MatchStatusCard'
import { RecommendedBuild } from '../../components/RecommendedBuild'
import { Sidebar } from '../../components/Sidebar'
import { TeamPanel } from '../../components/TeamPanel'
import {
  initialChat,
  liveMatch,
  recommendation,
  teams,
  type Player,
  type Recommendation,
  type Team,
} from '../../data/mockRiot'
import { recommendItems } from '../../engine/recommender'
import type { ItemRecommendation } from '../../engine/types'
import authService from '../../services/authService'
import {
  connectLiveGameSummary,
  type LiveGameSummary,
  type LiveGameParticipant,
} from '../../services/liveGameSummarySocket'
import userService from '../../services/userService'

export function DashboardScreen() {
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('jasna@smartassist.gg')
  const [password, setPassword] = useState('hunter2')
  const [riotId, setRiotId] = useState('NeonFox')
  const [tagline, setTagline] = useState('EUW')
  const [platform, setPlatform] = useState('EUW1')
  const [isConnecting, setIsConnecting] = useState(false)
  const [isRiotConnected, setIsRiotConnected] = useState(false)
  const [messages, setMessages] = useState(initialChat)
  const [pendingMessage, setPendingMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [username, setUsername] = useState<string | null>(null)
  const [, setIsInitializing] = useState(true)
  const [liveGameSummary, setLiveGameSummary] = useState<LiveGameSummary | null>(
    null,
  )
  const [liveGameMessage, setLiveGameMessage] = useState<string | null>(null)
  const timeoutRef = useRef<number | null>(null)

  // Initialize authentication on app load
  useEffect(() => {
    const initAuth = async () => {
      try {
        const user = await authService.initializeAuth()
        if (user) {
          setUsername(user.username)
          if (user.riotName && user.riotTag) {
            setRiotId(user.riotName)
            setTagline(user.riotTag)
            if (user.platform) {
              setPlatform(user.platform)
            }
            setIsRiotConnected(true)
          }
        }
      } finally {
        setIsInitializing(false)
      }
    }

    initAuth()
  }, [])

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (!isRiotConnected || !platform || !riotId || !tagline) {
      return
    }

    const socket = connectLiveGameSummary(
      {
        platform,
        gameName: riotId,
        tagLine: tagline,
      },
      {
        onMessage: (message) => {
          console.log('Live game websocket message:', message)

          if (
            message.type === 'live-game-summary' &&
            message.status === 'waiting'
          ) {
            setLiveGameSummary(null)
            setLiveGameMessage(message.message || 'No active game found yet.')
            return
          }

          const liveData = getLiveGameDataFromMessage(message)

          if (liveData) {
            console.log('Live game websocket summary data:', liveData)
            setLiveGameMessage(null)
            setLiveGameSummary(liveData)
          }

          if (message.type === 'not-in-game' || message.type === 'error') {
            setLiveGameSummary(null)
            setLiveGameMessage(message.message)
          }
        },
        onError: (event) => {
          console.error('Live game websocket error:', event)
        },
      },
    )

    return () => {
      socket.close()
    }
  }, [isRiotConnected, platform, riotId, tagline])

  const handleConnect = async () => {
    if (!riotId || !tagline || !platform) {
      return
    }

    setIsConnecting(true)

    try {
      const response = await userService.linkRiotProfile({
        riotName: riotId,
        riotTag: tagline,
        platform,
      })
      const linkedUser = response.data?.user

      if (linkedUser?.username) {
        setUsername(linkedUser.username)
      }

      setIsRiotConnected(true)
    } catch (error) {
      console.error('Riot link error:', error)
      setIsRiotConnected(false)
    } finally {
      setIsConnecting(false)
    }
  }

  const handleAuthSuccess = (userData: { username: string; email: string }) => {
    setUsername(userData.username)
    setEmail(userData.email)
    // Clear sensitive data after successful auth
    setPassword('')
  }

  const handleLogout = () => {
    setUsername(null)
    setEmail('')
    setPassword('')
    setAuthMode('login')
    setIsRiotConnected(false)
    setLiveGameSummary(null)
    setLiveGameMessage(null)
  }

  const handleRiotIdChange = (value: string) => {
    setRiotId(value)
    if (isRiotConnected) {
      setIsRiotConnected(false)
      setLiveGameSummary(null)
      setLiveGameMessage(null)
    }
  }

  const handleTaglineChange = (value: string) => {
    setTagline(value)
    if (isRiotConnected) {
      setIsRiotConnected(false)
      setLiveGameSummary(null)
      setLiveGameMessage(null)
    }
  }

  const handlePlatformChange = (value: string) => {
    setPlatform(value)
    if (isRiotConnected) {
      setIsRiotConnected(false)
      setLiveGameSummary(null)
      setLiveGameMessage(null)
    }
  }

  const handleSendMessage = () => {
    const trimmed = pendingMessage.trim()

    if (!trimmed) {
      return
    }

    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current)
    }

    const timestamp = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    })

    const userEntry = {
      id: Date.now(),
      role: 'user' as const,
      author: 'You',
      message: trimmed,
      time: timestamp,
    }

    setMessages((current) => [...current, userEntry])
    setPendingMessage('')
    setIsTyping(true)

    timeoutRef.current = window.setTimeout(() => {
      setMessages((current) => [
        ...current,
        {
          id: Date.now() + 1,
          role: 'assistant',
          author: 'LoL AI',
          message:
            'Based on this board state, prioritize your burst spike before dragon. Keep defensive pivot options for the next purchase if their assassin gets flank access.',
          time: new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          }),
        },
      ])
      setIsTyping(false)
    }, 1100)
  }

  const noLiveGameMessage =
    liveGameMessage ||
    (isRiotConnected && !liveGameSummary ? 'Waiting for live game data.' : null)
  const shouldUseMockData = !isRiotConnected
  const activeRecommendation = getRecommendationFromLiveSummary(
    liveGameSummary,
    recommendation,
  )
  const visibleTeams = getTeamsFromLiveSummary(liveGameSummary, shouldUseMockData)
  const engineRecommendations = recommendItems(
    activeRecommendation.champion,
    getEnemyChampionNames(liveGameSummary, visibleTeams, shouldUseMockData),
    6,
  )
  const displayedRecommendation = getRecommendationFromEngine(
    activeRecommendation,
    engineRecommendations,
  )

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(8,145,178,0.16),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(168,85,247,0.14),_transparent_26%),linear-gradient(180deg,_#020617_0%,_#0f172a_45%,_#020617_100%)] px-4 py-4 text-white sm:px-6 lg:px-6">
      <div className="mx-auto grid max-w-[1840px] gap-6 xl:grid-cols-[300px_minmax(0,1fr)_440px]">
        <Sidebar
          authMode={authMode}
          email={email}
          password={password}
          riotId={riotId}
          tagline={tagline}
          platform={platform}
          isConnecting={isConnecting}
          isRiotConnected={isRiotConnected}
          username={username}
          onAuthModeChange={setAuthMode}
          onEmailChange={setEmail}
          onPasswordChange={setPassword}
          onRiotIdChange={handleRiotIdChange}
          onTaglineChange={handleTaglineChange}
          onPlatformChange={handlePlatformChange}
          onConnect={handleConnect}
          onAuthSuccess={handleAuthSuccess}
          onLogout={handleLogout}
        />

        <main className="space-y-6">
          <div className="grid gap-6 xl:grid-cols-2">
            <div className="space-y-6">
              <MatchStatusCard
                mode={
                  noLiveGameMessage
                    ? 'No active game'
                    : liveGameSummary?.game?.gameMode ?? liveMatch.mode
                }
                duration={
                  noLiveGameMessage
                    ? '--:--'
                    : formatGameDuration(
                        liveGameSummary?.gameDuration ??
                          liveGameSummary?.game?.gameLengthSeconds,
                      )
                }
                region={
                  liveGameSummary?.platform ??
                  liveGameSummary?.game?.platformId ??
                  platform
                }
              />
              {noLiveGameMessage ? (
                <NoLiveGamePanel message={noLiveGameMessage} />
              ) : (
                visibleTeams[0] && <TeamPanel team={visibleTeams[0]} />
              )}
            </div>
            {!noLiveGameMessage && visibleTeams[1] && (
              <TeamPanel team={visibleTeams[1]} />
            )}
          </div>

          {!noLiveGameMessage && (
            <RecommendedBuild recommendation={displayedRecommendation} />
          )}
        </main>

        <aside className="relative overflow-hidden rounded-[28px] border border-white/10 bg-slate-950/75 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.03),0_30px_80px_rgba(3,7,18,0.7)] backdrop-blur-xl xl:sticky xl:top-6 xl:h-[calc(100vh-3rem)]">
          <div className="absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.24),_transparent_65%)]" />
          <div className="absolute -left-10 top-24 h-28 w-28 rounded-full bg-fuchsia-500/20 blur-3xl" />

          <div className="relative">
            <ChatSection
              messages={messages}
              pendingMessage={pendingMessage}
              isTyping={isTyping}
              compact
              onPendingMessageChange={setPendingMessage}
              onSendMessage={handleSendMessage}
            />
          </div>
        </aside>
      </div>
    </div>
  )
}

function getRecommendationFromEngine(
  fallback: Recommendation,
  engineRecommendations: ItemRecommendation[],
): Recommendation {
  if (!engineRecommendations.length) {
    return fallback
  }

  const recommendedItems = engineRecommendations.map(
    (recommendationItem) => recommendationItem.item,
  )
  const reasons = engineRecommendations.flatMap(
    (recommendationItem) => recommendationItem.reasons,
  )

  return {
    ...fallback,
    nextItems: recommendedItems.slice(0, 3),
    buildPath: recommendedItems,
    alternatives: engineRecommendations
      .slice(3)
      .map(
        (recommendationItem) =>
          `${recommendationItem.item} (${recommendationItem.score})`,
      ),
    reasoning: [...new Set(reasons)].slice(0, 3),
    winRateNote: 'Offline semantic recommendation based on enemy champions',
  }
}

function getEnemyChampionNames(
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

function formatGameDuration(gameLengthSeconds?: number) {
  if (typeof gameLengthSeconds !== 'number') {
    return liveMatch.duration
  }

  const minutes = Math.floor(gameLengthSeconds / 60)
  const seconds = gameLengthSeconds % 60

  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

function NoLiveGamePanel({ message }: { message: string }) {
  return (
    <section className="rounded-[28px] border border-white/10 bg-slate-950/75 px-4 py-6 text-center">
      <p className="text-[10px] uppercase tracking-[0.22em] text-slate-500">
        Live game
      </p>
      <h3 className="mt-2 text-lg font-semibold text-white">
        No current game yet
      </h3>
      <p className="mt-2 text-sm text-slate-400">{message}</p>
    </section>
  )
}

function getTeamsFromLiveSummary(
  summary: LiveGameSummary | null,
  useMockFallback: boolean,
): Team[] {
  if (summary?.myTeam?.length || summary?.enemyTeam?.length) {
    const participants = [...(summary.myTeam ?? []), ...(summary.enemyTeam ?? [])]
    const blueParticipants = participants.filter(
      (participant) => getTeamId(participant) === 100,
    )
    const redParticipants = participants.filter(
      (participant) => getTeamId(participant) === 200,
    )

    const myTeamFallback = summary.myTeam ?? []
    const enemyTeamFallback = summary.enemyTeam ?? []

    return [
      {
        name: 'Blue Team',
        side: 'blue',
        players: (blueParticipants.length ? blueParticipants : myTeamFallback).map(
          (participant, index) =>
            mapParticipantToPlayer(
              participant,
              index,
              'from-cyan-400 to-blue-500',
            ),
        ),
      },
      {
        name: 'Red Team',
        side: 'red',
        players: (redParticipants.length ? redParticipants : enemyTeamFallback).map(
          (participant, index) =>
            mapParticipantToPlayer(
              participant,
              index,
              'from-rose-500 to-red-500',
            ),
        ),
      },
    ]
  }

  const participants = getLiveParticipants(summary)

  if (!participants.length) {
    return useMockFallback ? teams : []
  }

  let blueParticipants = participants.filter(
    (participant) => getTeamId(participant) === 100,
  )
  let redParticipants = participants.filter(
    (participant) => getTeamId(participant) === 200,
  )

  if (!blueParticipants.length && !redParticipants.length) {
    blueParticipants = participants.slice(0, 5)
    redParticipants = participants.slice(5, 10)
  }

  const bluePlayers = blueParticipants
    .map((participant, index) =>
      mapParticipantToPlayer(participant, index, 'from-cyan-400 to-blue-500'),
    )

  const redPlayers = redParticipants
    .map((participant, index) =>
      mapParticipantToPlayer(participant, index, 'from-rose-500 to-red-500'),
    )

  return [
    { name: 'Blue Team', side: 'blue', players: bluePlayers },
    { name: 'Red Team', side: 'red', players: redPlayers },
  ]
}

function getLiveGameDataFromMessage(message: { type: string; data?: unknown }) {
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

function getRecommendationFromLiveSummary(
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
