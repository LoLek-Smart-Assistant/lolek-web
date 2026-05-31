import {type CSSProperties, useCallback, useEffect, useRef, useState} from 'react'

import { MatchHistoryPanel } from '../../components/dashboard/MatchHistoryPanel'
import { MiddleSkeleton } from '../../components/dashboard/MiddleSkeleton'
import { NoLiveGamePanel } from '../../components/dashboard/NoLiveGamePanel'
import { NoRiotAccountPanel } from '../../components/dashboard/NoRiotAccountPanel'
import { WelcomePanel } from '../../components/dashboard/WelcomePanel'
import { MatchStatusCard } from '../../components/MatchStatusCard'
import { RecommendedBuild } from '../../components/RecommendedBuild'
import PushToTalkButton from '../../components/PushToTalkButton'
import { Sidebar } from '../../components/Sidebar'
import { TeamPanel } from '../../components/TeamPanel'
import { mockHistory } from '../../data/mockHistory'
import {
  formatGameDuration,
  getEnemyChampionNames,
  getLiveGameDataFromMessage,
  getRecommendationFromLiveSummary,
  getTeamsFromLiveSummary,
} from '../../helpers/dashboardLiveGameHelpers'
import { getRecommendationFromEngine } from '../../helpers/dashboardRecommendationHelpers'
import {
    liveMatch,
    recommendation,
} from '../../data/mockRiot'
import { recommendItems } from '../../engine/recommender'
import authService from '../../services/authService'
import axiosInstance from '../../config/axiosConfig'
import mayhemService, { type MayhemChampionResult } from '../../services/mayhemService'
import itemService, { precacheImageUrls } from '../../services/itemService'
import {
  connectLiveGameSummary,
  type LiveGameSummary,
} from '../../services/liveGameSummarySocket'
import userService from '../../services/userService'
import type { MayhemItemEntry as MayhemApiItemEntry } from '../../services/mayhemService'
import type { ParsedVoiceResponse } from '../../voice/types'


export function DashboardScreen() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'history' | 'items'>(
    'dashboard',
  )
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [riotId, setRiotId] = useState('')
  const [tagline, setTagline] = useState('')
  const [platform, setPlatform] = useState('EUW1')
  const [connectedRiotId, setConnectedRiotId] = useState('')
  const [connectedTagline, setConnectedTagline] = useState('')
  const [connectedPlatform, setConnectedPlatform] = useState('EUW1')
  const [isConnecting, setIsConnecting] = useState(false)
  const [isRemovingRiotProfile, setIsRemovingRiotProfile] = useState(false)
  const [isRiotConnected, setIsRiotConnected] = useState(false)
  const [isEditingRiotProfile, setIsEditingRiotProfile] = useState(false)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [voiceTranscript, setVoiceTranscript] = useState<string | null>(null)
  const [voiceParsedResponse, setVoiceParsedResponse] = useState<ParsedVoiceResponse | null>(null)
  const [username, setUsername] = useState<string | null>(null)
  const [, setIsInitializing] = useState(true)
  const [liveGameSummary, setLiveGameSummary] = useState<LiveGameSummary | null>(
    null,
  )
  const [liveGameMessage, setLiveGameMessage] = useState<string | null>(null)
  const [durationSeconds, setDurationSeconds] = useState<number | undefined>(
    undefined,
  )
  const [playerCurrentItems, setPlayerCurrentItems] = useState<string[]>([
    'Luden', 'Sorcerer', 'Amplifying',
  ])
  const [allChampionItems, setAllChampionItems] = useState<Record<string, (string | null)[]>>({})
  const [suggestedItemImageMap, setSuggestedItemImageMap] = useState<Record<string, string>>({})
  const [mayhemResultsByChampion, setMayhemResultsByChampion] = useState<Record<string, MayhemChampionResult>>({})
  const lastProcessedResponseRef = useRef<string | null>(null)
  const mayhemFetchedGameKeyRef = useRef<string | null>(null)
  const timeoutRef = useRef<number | null>(null)
  const syncProfileFromApi = async () => {
    try {
      const profileResponse = await userService.getProfile()
      const profile = profileResponse.data

      if (profile?.riotName && profile?.riotTag) {
        setRiotId(profile.riotName)
        setTagline(profile.riotTag)
        if (profile.platform) {
          setPlatform(profile.platform)
          setConnectedPlatform(profile.platform)
        }
        setConnectedRiotId(profile.riotName)
        setConnectedTagline(profile.riotTag)
        setIsRiotConnected(true)
        setIsEditingRiotProfile(false)
        return
      }

      setConnectedRiotId('')
      setConnectedTagline('')
      setIsEditingRiotProfile(true)
      setIsRiotConnected(false)
    } catch (error) {
      console.error('Profile fetch error:', error)
    }
  }

  // Initialize authentication on app load
  useEffect(() => {
    const initAuth = async () => {
      try {
        const user = await authService.initializeAuth()
        if (user) {
          setUsername(user.username)
          await syncProfileFromApi()
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
    if (!isRiotConnected || !connectedPlatform || !connectedRiotId || !connectedTagline) {
      return
    }

    const socket = connectLiveGameSummary(
      {
        platform: connectedPlatform,
        gameName: connectedRiotId,
        tagLine: connectedTagline,
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
  }, [isRiotConnected, connectedPlatform, connectedRiotId, connectedTagline])

  useEffect(() => {
    const baseDuration =
      liveGameSummary?.gameDuration ??
      liveGameSummary?.game?.gameLengthSeconds

    if (typeof baseDuration !== 'number') {
      const resetId = window.setTimeout(() => {
        setDurationSeconds(undefined)
      }, 0)

      return () => {
        window.clearTimeout(resetId)
      }
    }

    const initializeId = window.setTimeout(() => {
      setDurationSeconds(baseDuration)
    }, 0)

    const intervalId = window.setInterval(() => {
      setDurationSeconds((current) =>
        typeof current === 'number' ? current + 1 : baseDuration + 1,
      )
    }, 1000)

    return () => {
      window.clearTimeout(initializeId)
      window.clearInterval(intervalId)
    }
  }, [liveGameSummary?.gameDuration, liveGameSummary?.game?.gameLengthSeconds])

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

      setConnectedRiotId(riotId)
      setConnectedTagline(tagline)
      setConnectedPlatform(platform)
      setIsRiotConnected(true)
      setIsEditingRiotProfile(false)
    } catch (error) {
      console.error('Riot link error:', error)
      setIsRiotConnected(false)
    } finally {
      setIsConnecting(false)
    }
  }

  const handleAuthSuccess = async (userData: {
    username: string
    email: string
  }) => {
    setUsername(userData.username)
    setEmail(userData.email)
    // Clear sensitive data after successful auth
    setPassword('')

    await syncProfileFromApi()
  }

  const handleLogout = () => {
    setUsername(null)
    setEmail('')
    setPassword('')
    setAuthMode('login')
    setIsRiotConnected(false)
    setConnectedRiotId('')
    setConnectedTagline('')
    setConnectedPlatform('EUW1')
    setLiveGameSummary(null)
    setLiveGameMessage(null)
    setIsEditingRiotProfile(false)
  }

  const handleRiotIdChange = (value: string) => {
    setRiotId(value)
  }

  const handleTaglineChange = (value: string) => {
    setTagline(value)
  }

  const handlePlatformChange = (value: string) => {
    setPlatform(value)
  }

  const handleRemoveRiotProfile = async () => {
    setIsRemovingRiotProfile(true)
    try {
      await userService.removeRiotProfile()
      setIsRiotConnected(false)
      setIsEditingRiotProfile(true)
      setLiveGameSummary(null)
      setLiveGameMessage(null)
      setConnectedRiotId('')
      setConnectedTagline('')
      setConnectedPlatform('EUW1')
      setRiotId('')
      setTagline('')
    } catch (error) {
      console.error('Riot disconnect error:', error)
    } finally {
      setIsRemovingRiotProfile(false)
    }
  }

  const handleEditRiotProfile = () => {
    setIsEditingRiotProfile((current) => !current)
  }

  // Calculate visible teams and mock data flag early
  const shouldUseMockData = !isRiotConnected
  const visibleTeams = getTeamsFromLiveSummary(liveGameSummary, shouldUseMockData)

  const toItemNameList = (value: unknown): string[] => {
    if (!Array.isArray(value)) return []
    return value
      .map((item) => {
        if (typeof item === 'string' || typeof item === 'number') {
          return String(item)
        }
        if (item && typeof item === 'object') {
          const itemRecord = item as Record<string, unknown>
          const byName = itemRecord.itemName
          const byId = itemRecord.itemId
          const byGeneric = itemRecord.name
          if (typeof byName === 'string') return byName
          if (typeof byId === 'string' || typeof byId === 'number') return String(byId)
          if (typeof byGeneric === 'string') return byGeneric
        }
        return null
      })
      .filter((itemName): itemName is string => Boolean(itemName && itemName.trim()))
  }

  const toEngineMayhemItems = (items: MayhemApiItemEntry[] | undefined) => {
    if (!items?.length) return []

    return items
      .map((entry) => ({
        item: entry.itemName && entry.itemName.trim() ? entry.itemName : String(entry.itemId),
        customTags: entry.customTags ?? null,
        image: entry.image ?? null,
      }))
      .filter((entry) => Boolean(entry.item && entry.item.trim()))
  }

  const toItemNames = (items: MayhemApiItemEntry[] | undefined) => {
    if (!items?.length) return []

    return items
      .map((entry) => entry.itemName?.trim() || String(entry.itemId))
      .filter((itemName): itemName is string => Boolean(itemName && itemName.trim()))
  }

  const livePlayerCurrentItems = toItemNameList(
    liveGameSummary?.connectedParticipant?.currentItems ??
      liveGameSummary?.connectedParticipant?.items ??
      liveGameSummary?.connectedParticipant?.itemIds,
  )
  const displayedPlayerCurrentItems = Array.from(
    new Set([...livePlayerCurrentItems, ...playerCurrentItems]),
  )

  const enemyCurrentItems = visibleTeams[1]?.players.flatMap((player) => player.currentItems ?? []) ?? []
  const myTeamCurrentItems = [
    ...(visibleTeams[0]?.players.flatMap((player) => player.currentItems ?? []) ?? []),
    ...displayedPlayerCurrentItems,
  ]
  const normalizeChampionKey = (value: string) =>
    value.replace(/[^a-z0-9]/gi, '').toLowerCase()
  const connectedChampionName =
    (typeof liveGameSummary?.connectedParticipant?.championName === 'string' &&
      liveGameSummary.connectedParticipant.championName.trim()) ||
    (typeof liveGameSummary?.connectedParticipant?.champion === 'string' &&
      liveGameSummary.connectedParticipant.champion.trim()) ||
    null
  const liveParticipantChampions: string[] = [
    ...(liveGameSummary?.game?.participants ?? []),
    ...(liveGameSummary?.participants ?? []),
    ...(liveGameSummary?.myTeam ?? []),
    ...(liveGameSummary?.enemyTeam ?? []),
    ...(liveGameSummary?.connectedParticipant ? [liveGameSummary.connectedParticipant] : []),
  ]
    .map((participant) => {
      if (typeof participant.championName === 'string' && participant.championName.trim()) {
        return participant.championName.trim()
      }

      if (typeof participant.champion === 'string' && participant.champion.trim()) {
        return participant.champion.trim()
      }

      return null
    })
    .filter((champion): champion is string => Boolean(champion && champion.trim()))
  const championsInGameCandidates: string[] = [
    ...liveParticipantChampions,
    connectedChampionName ?? '',
  ]
  const championsInGame = Array.from(
    new Set(
      championsInGameCandidates.filter(
        (champion): champion is string => Boolean(champion && champion.trim()),
      ),
    ),
  )
  const championsInGameKey = championsInGame
    .map((champion) => champion.toLowerCase())
    .sort((left, right) => left.localeCompare(right))
    .join('|')
  const liveGameStartKey = String(liveGameSummary?.gameStartTime ?? '')

  useEffect(() => {
    if (!championsInGame.length || shouldUseMockData || !liveGameStartKey) {
      return
    }

    if (mayhemFetchedGameKeyRef.current === liveGameStartKey) {
      return
    }

    mayhemFetchedGameKeyRef.current = liveGameStartKey
    let cancelled = false

    const loadMayhemRecommendations = async () => {
      try {
        if (!itemService.getCachedItems()) {
          await itemService.fetchItems()
        }

        const response = await mayhemService.getSuggestedItemsByChampions(championsInGame)
        if (cancelled) return
        setMayhemResultsByChampion(
          Object.fromEntries(
            (response.results ?? []).map((result) => [
              normalizeChampionKey(result.championName),
              result,
            ]),
          ),
        )
        console.log(
          '[Mayhem suggested items payload]',
          (response.results ?? []).map((result) => ({
            championName: result.championName,
            coreItems: (result.coreItems ?? []).map((entry) => ({
              itemId: entry.itemId,
              itemName: entry.itemName,
              image: entry.image ?? null,
              customTags: entry.customTags ?? null,
            })),
            suggestedItems: (result.suggestedItems?.allItems ?? []).map((entry) => ({
              itemId: entry.itemId,
              itemName: entry.itemName,
              image: entry.image ?? null,
              customTags: entry.customTags ?? null,
            })),
          })),
        )

        const recommendedMap: Record<string, (string | null)[]> = {}
        const imageMap: Record<string, string> = {}
        const resultByChampionKey = new Map(
          (response.results ?? []).map((result) => [
            normalizeChampionKey(result.championName),
            result,
          ]),
        )
        const toAbsoluteImage = (image?: string | null) => {
          if (!image) return null
          if (image.startsWith('http')) return image
          const base = (axiosInstance.defaults.baseURL as string) || ''
          return image.startsWith('/') ? `${base}${image}` : `${base}/${image}`
        }
        const registerImage = (itemKey: string, image?: string | null) => {
          const absoluteImage = toAbsoluteImage(image)
          if (!itemKey || !absoluteImage) return
          imageMap[itemKey] = absoluteImage
          imageMap[itemKey.replace(/[^a-z0-9]/gi, '').toLowerCase()] = absoluteImage
        }
        const isNumericOnly = (value: string) => /^\d+$/.test(value.trim())
        const resolveMayhemItemName = (entry: { itemId: number; itemName: string | null; image?: string | null }) => {
          if (entry.itemName && entry.itemName.trim() && !isNumericOnly(entry.itemName)) {
            registerImage(entry.itemName, null)
            return entry.itemName
          }
          const fromCatalog = itemService.getItemByKey(String(entry.itemId))
          if (fromCatalog?.itemName && !isNumericOnly(fromCatalog.itemName)) return fromCatalog.itemName
          if (entry.image) return `itemid:${entry.itemId}`
          return null
        }

        for (const team of visibleTeams) {
          for (const player of team.players) {
            const result = resultByChampionKey.get(
              normalizeChampionKey(player.champion),
            )
            if (!result) continue

          const coreNames = (result.coreItems ?? [])
            .map((entry) => {
              const resolved = resolveMayhemItemName(entry)
              registerImage(String(entry.itemId), entry.image)
              registerImage(`itemid:${entry.itemId}`, entry.image)
              if (resolved) {
                registerImage(resolved, entry.image)
              }
              return resolved
            })
            .filter((itemName): itemName is string => Boolean(itemName && itemName.trim()))
          const suggestedNames = (result.suggestedItems?.allItems ?? [])
            .map((entry) => {
              const resolved = resolveMayhemItemName(entry)
              registerImage(String(entry.itemId), entry.image)
              registerImage(`itemid:${entry.itemId}`, entry.image)
              if (resolved) {
                registerImage(resolved, entry.image)
              }
              return resolved
            })
            .filter((itemName): itemName is string => Boolean(itemName && itemName.trim()))

            // Core first, then Mayhem suggestions, capped to the 6 in-game item slots.
            const unique = Array.from(new Set([...coreNames, ...suggestedNames])).slice(0, 6)
            if (unique.length === 0) continue
            recommendedMap[player.champion] = [
              ...unique,
              ...Array(Math.max(0, 6 - unique.length)).fill(null),
            ]
          }
        }

        const championKeysInGame = visibleTeams
          .flatMap((team) => team.players.map((player) => player.champion))
        setAllChampionItems((current) => {
          const next = { ...current }
          for (const champion of championKeysInGame) {
            delete next[champion]
          }
          for (const [champion, items] of Object.entries(recommendedMap)) {
            next[champion] = items
          }
          return next
        })
        setSuggestedItemImageMap((current) => ({ ...current, ...imageMap }))
      } catch (error) {
        console.error('Failed to load Mayhem suggestions for champions in game:', error)
      }
    }

    void loadMayhemRecommendations()

    return () => {
      cancelled = true
    }
  }, [championsInGameKey, shouldUseMockData, liveGameStartKey])

  const handleVoiceResult = useCallback(
    (transcript: string | null, parsed: ParsedVoiceResponse | null) => {
      setVoiceTranscript(transcript)
      setVoiceParsedResponse(parsed)

      // Create a unique ID for this response to prevent duplicate processing
      const responseId = `${transcript}|${parsed?.champion}|${parsed?.items?.join(',')}`

      // Skip if we've already processed this exact response
      if (lastProcessedResponseRef.current === responseId) {
        return
      }

      // Reset if both transcript and parsed are null (user cleared the response)
      if (!transcript && !parsed) {
        lastProcessedResponseRef.current = null
        return
      }

      lastProcessedResponseRef.current = responseId

      // If voice response contains a champion and items, add items only if champion is recognized in the game
      if (parsed?.champion && parsed?.items && parsed.items.length > 0) {
        const champName = parsed.champion.trim()

        // Get current teams to validate champion
        const currentTeams = getTeamsFromLiveSummary(liveGameSummary, shouldUseMockData)
        const currentChampNames = currentTeams.flatMap((team) =>
          team.players.map((player) => player.champion),
        )

        // Only add items if the champion is recognized in the current game
        if (currentChampNames.some((name) => name.toLowerCase() === champName.toLowerCase())) {
          setAllChampionItems((current) => {
            const champSlots = current[champName] ?? Array(6).fill(null)

            // Add ONLY the first item from the response to the first available slot
            if (parsed.items && parsed.items.length > 0) {
              const item = parsed.items[0]
              const emptySlotIndex = champSlots.findIndex((slot) => slot === null)
              if (emptySlotIndex !== -1) {
                champSlots[emptySlotIndex] = item
              }
            }

            return {
              ...current,
              [champName]: champSlots,
            }
          })
        }
      }
    },
    [liveGameSummary, shouldUseMockData],
  )

   const handleAddItemToPlayer = (itemName: string) => {
     setPlayerCurrentItems((current) => {
       // Prevent adding duplicate items
       if (current.includes(itemName)) {
         return current
       }
       return [...current, itemName]
     })
   }

  const handleRemoveChampionItem = (champName: string, slotIndex: number) => {
    setAllChampionItems((current) => {
      const champSlots = [...(current[champName] ?? Array(6).fill(null))]
      champSlots[slotIndex] = null
      return {
        ...current,
        [champName]: champSlots,
      }
    })
  }


  const noLiveGameMessage =
    liveGameMessage ||
    (isRiotConnected && !liveGameSummary ? 'Waiting for live game data.' : null)
  const isLoggedIn = Boolean(username)
  const shouldShowNoRiotPanel = isLoggedIn && !isRiotConnected
  const shouldShowMiddleSkeleton =
    isLoggedIn && isRiotConnected && (isConnecting || isRemovingRiotProfile)
  const activeRecommendation = getRecommendationFromLiveSummary(
    liveGameSummary,
    recommendation,
  )

  useEffect(() => {
    const championImages = visibleTeams.flatMap((team) =>
      team.players.map((player) => player.championImage),
    )
    championImages.push(activeRecommendation.championImage)
    precacheImageUrls(championImages)
  }, [visibleTeams, activeRecommendation.championImage])

  const activeMayhemResult = mayhemResultsByChampion[normalizeChampionKey(activeRecommendation.champion)]
  const engineRecommendations = recommendItems(
    activeRecommendation.champion,
    getEnemyChampionNames(liveGameSummary, visibleTeams, shouldUseMockData),
    6,
    {
      myTeamCurrentItems,
      enemyCurrentItems,
      mayhemCoreItems: toEngineMayhemItems(activeMayhemResult?.coreItems),
      mayhemSuggestedItems: toEngineMayhemItems(activeMayhemResult?.suggestedItems?.allItems),
    },
  )
  const displayedRecommendation = getRecommendationFromEngine(
    activeRecommendation,
    engineRecommendations,
  )

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(8,145,178,0.16),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(168,85,247,0.14),_transparent_26%),linear-gradient(180deg,_#020617_0%,_#0f172a_45%,_#020617_100%)] px-4 py-4 text-white sm:px-6 lg:px-6">
      <div
        className="mx-auto grid max-w-[1840px] gap-6 xl:grid-cols-[var(--sidebar-width)_minmax(0,1fr)_260px]"
        style={
          {
            '--sidebar-width': isSidebarCollapsed ? '96px' : '300px',
          } as CSSProperties
        }
      >
        <Sidebar
          activeTab={activeTab}
          authMode={authMode}
          email={email}
          password={password}
          riotId={riotId}
          tagline={tagline}
          platform={platform}
          connectedRiotId={connectedRiotId}
          connectedTagline={connectedTagline}
          isConnecting={isConnecting}
          isRemovingRiotProfile={isRemovingRiotProfile}
          isRiotConnected={isRiotConnected}
          isEditingRiotProfile={isEditingRiotProfile}
          username={username}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed((current) => !current)}
          onAuthModeChange={setAuthMode}
          onTabChange={setActiveTab}
          onEmailChange={setEmail}
          onPasswordChange={setPassword}
          onRiotIdChange={handleRiotIdChange}
          onTaglineChange={handleTaglineChange}
          onPlatformChange={handlePlatformChange}
          onEditRiotProfile={handleEditRiotProfile}
          onRemoveRiotProfile={handleRemoveRiotProfile}
          onConnect={handleConnect}
          onAuthSuccess={handleAuthSuccess}
          onLogout={handleLogout}
        />

        <main className={`space-y-6 ${!isLoggedIn ? 'xl:col-span-2' : ''}`}>
          {!isLoggedIn ? (
            <WelcomePanel onGetStartedLabel="Log in to get started" />
          ) : activeTab === 'history' ? (
            <MatchHistoryPanel entries={mockHistory} />
          ) : shouldShowNoRiotPanel ? (
            <NoRiotAccountPanel />
          ) : shouldShowMiddleSkeleton ? (
            <MiddleSkeleton />
          ) : (
            <>
              {noLiveGameMessage ? (
                <NoLiveGamePanel message={noLiveGameMessage} />
              ) : (
                <>
                  <div className="grid gap-6 min-[1900px]:grid-cols-2">
                    <div className="space-y-6">
                      <MatchStatusCard
                        mode={liveGameSummary?.game?.gameMode ?? liveMatch.mode}
                        duration={formatGameDuration(
                          durationSeconds ??
                            liveGameSummary?.gameDuration ??
                            liveGameSummary?.game?.gameLengthSeconds,
                        )}
                      />
                      {visibleTeams[0] && <TeamPanel team={visibleTeams[0]} champItemsMap={allChampionItems} itemImageMap={suggestedItemImageMap} onRemoveItem={handleRemoveChampionItem} />}
                    </div>
                    {visibleTeams[1] && <TeamPanel team={visibleTeams[1]} champItemsMap={allChampionItems} itemImageMap={suggestedItemImageMap} onRemoveItem={handleRemoveChampionItem} />}
                  </div>
                </>
              )}
              {!noLiveGameMessage && (
                <RecommendedBuild
                  recommendation={displayedRecommendation}
                  coreItems={toItemNames(activeMayhemResult?.coreItems)}
                  playerCurrentItems={displayedPlayerCurrentItems}
                  onAddItem={handleAddItemToPlayer}
                />
              )}
            </>
          )}
        </main>

        {isLoggedIn ? (
          <aside className="relative overflow-hidden rounded-[28px] border border-white/10 bg-slate-950/75 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.03),0_30px_80px_rgba(3,7,18,0.7)] backdrop-blur-xl xl:sticky xl:top-6 xl:h-[calc(100vh-3rem)]">
            <div className="absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.24),_transparent_65%)]" />
            <div className="absolute -left-10 top-24 h-28 w-28 rounded-full bg-fuchsia-500/20 blur-3xl" />

          <div className="relative">
            <div className="rounded-[28px] border border-white/8 bg-white/[0.04] p-4">
              <div className="mb-3 text-xs uppercase tracking-[0.18em] text-slate-400">
                Voice input
              </div>
              <PushToTalkButton onResult={handleVoiceResult} />
              {(voiceTranscript || voiceParsedResponse) && (
                <div className="mt-4 space-y-2 rounded-2xl border border-white/8 bg-slate-950/60 p-3 text-sm text-slate-200">
                  {voiceTranscript ? (
                    <div>
                      <span className="text-slate-400">Transcript: </span>
                      {voiceTranscript}
                    </div>
                  ) : null}
                  {voiceParsedResponse ? (
                    <div className="text-slate-300">
                      <span className="text-slate-400">Intent: </span>
                      {voiceParsedResponse.intent}
                      {voiceParsedResponse.champion ? (
                        <span className="ml-2 text-cyan-300">• {voiceParsedResponse.champion}</span>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          </div>
        </aside> ) : null }
      </div>
    </div>
  )
}
