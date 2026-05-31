import { useEffect, useMemo, useState } from 'react'
import { isAxiosError } from 'axios'
import { LoaderCircle, Plus, Save } from 'lucide-react'

import { MatchStatusCard } from '../../components/MatchStatusCard'
import type { Team } from '../../data/mockRiot'
import itemService from '../../services/itemService'
import type { Item } from '../../services/syncService'
import playedMatchService, {
  type PlayedMatchRecord,
  type PlayedMatchTeam,
  type SavePlayedMatchRequest,
  type PlayedMatchSource,
} from '../../services/playedMatchService'
import {
  createStoredDraft,
  deletePlayedMatchDraft,
  loadPlayedMatchDraft,
  savePlayedMatchDraft,
} from '../../services/matchDraftStorage'
import {
  queuePlayedMatchSaveForSync,
  requestPlayedMatchQueueFlush,
} from '../../services/playedMatchSync'

// Helpers to convert between the UI draft shape and the backend SavePlayedMatchRequest
function convertDraftToSaveRequest(draft: ManualMatchDraft): SavePlayedMatchRequest {
  return {
    matchId: draft.matchId,
    source: 'manual',
    gameMode: draft.gameMode,
    queue: draft.queue || null,
    durationSeconds: draft.durationSeconds ?? 0,
    startedAt: draft.startedAt ?? null,
    endedAt: draft.endedAt ?? null,
    winnerTeamId: draft.winnerTeamId,
    teams: draft.teams.map((team) => ({
      teamId: team.teamId,
      name: team.name,
      won: !!team.won,
      players: team.players.map((player) => ({
        summonerName: player.summonerName || 'Unknown',
        riotId: player.riotId || null,
        championName: player.championName || 'Unknown',
        championId: player.championId || null,
        role: player.role || null,
        teamPosition: player.teamPosition || null,
        items: player.items.map((itemName, slot) => {
          const resolved = itemService.getItemByName?.(itemName)
          return {
            itemId: resolved?.itemId || itemName,
            itemName: resolved?.itemName || itemName,
            image: resolved?.image ?? null,
            customTags: resolved?.customTags ?? null,
            slot,
          }
        }),
      })),
    })),
  }
}

function convertSavedToDraft(saved: SavePlayedMatchRequest): ManualMatchDraft {
  return {
    matchId: saved.matchId ?? `manual-${Date.now()}`,
    source: saved.source ?? 'manual',
    gameMode: saved.gameMode,
    queue: saved.queue ?? '',
    durationSeconds: saved.durationSeconds ?? 0,
    startedAt: saved.startedAt ?? null,
    endedAt: saved.endedAt ?? null,
    winnerTeamId: saved.winnerTeamId,
    teams: (saved.teams || []).map((team) => ({
      teamId: team.teamId,
      side: (team.teamId === 'red' ? 'red' : 'blue') as 'blue' | 'red',
      name: team.name ?? (team.teamId === 'red' ? 'Red Team' : 'Blue Team'),
      won: !!team.won,
      players: (team.players || []).map((player) => ({
        summonerName: player.summonerName || '',
        riotId: player.riotId || '',
        championName: player.championName || '',
        role: player.role || '',
        teamPosition: player.teamPosition || player.role || '',
        championId: typeof player.championId === 'string' ? player.championId : String(player.championId ?? ''),
        items: (player.items || []).map((it) => it?.itemName || it?.itemId || ''),
      })),
    })),
  }
}

const DRAFT_KEY = 'manual-match-editor'

type ManualPlayerDraft = {
  summonerName: string
  riotId: string
  championName: string
  role: string
  teamPosition: string
  championId: string
  items: string[]
}

type ManualTeamDraft = {
  teamId: string
  side: 'blue' | 'red'
  name: string
  won: boolean
  players: ManualPlayerDraft[]
}

type ManualMatchDraft = {
  matchId: string
  source: PlayedMatchSource
  gameMode: string
  queue: string
  durationSeconds: number
  startedAt: string | null
  endedAt: string | null
  winnerTeamId: string
  teams: ManualTeamDraft[]
}

type ManualMatchEditorProps = {
  onSaved?: (match: PlayedMatchRecord) => void
  canSyncToBackend?: boolean
  teamTemplates?: Team[]
}

function createDefaultPlayers(start: number, end: number): ManualPlayerDraft[] {
  return Array.from({ length: end - start + 1 }).map((_, index) => {
    const playerNumber = start + index
    return {
      summonerName: `Player ${playerNumber}`,
      riotId: '',
      championName: '',
      role: '',
      teamPosition: '',
      championId: '',
      items: [],
    }
  })
}

function createInitialDraft(): ManualMatchDraft {
  const matchId = globalThis.crypto?.randomUUID?.() ?? `manual-${Date.now()}`

  return {
    matchId,
    source: 'manual',
    gameMode: 'Ranked Solo / Duo',
    queue: 'Ranked Solo / Duo',
    durationSeconds: 0,
    startedAt: null,
    endedAt: null,
    winnerTeamId: 'blue',
    teams: [
      {
        teamId: 'blue',
        side: 'blue',
        name: 'Blue Team',
        won: true,
        players: createDefaultPlayers(1, 5),
      },
      {
        teamId: 'red',
        side: 'red',
        name: 'Red Team',
        won: false,
        players: createDefaultPlayers(6, 10),
      },
    ],
  }
}

function formatDurationLabel(seconds: number) {
  const safeSeconds = Math.max(0, Math.floor(seconds))
  const minutes = Math.floor(safeSeconds / 60)
  const remainder = safeSeconds % 60
  return `${minutes}:${remainder.toString().padStart(2, '0')}`
}

function normalizeText(value: string) {
  return value.trim()
}

type ChampionOption = {
  name: string
  image: string
}

async function fetchChampionsFromDDragon(): Promise<ChampionOption[]> {
  try {
    const versionsResponse = await fetch('https://ddragon.leagueoflegends.com/api/versions.json')
    if (!versionsResponse.ok) return []
    const versions = (await versionsResponse.json()) as string[]
    const version = versions?.[0]
    if (!version) return []

    const championResponse = await fetch(
        `https://ddragon.leagueoflegends.com/cdn/${version}/data/en_US/champion.json`,
    )
    if (!championResponse.ok) return []

    const championPayload = await championResponse.json()
    const values = Object.values(championPayload?.data ?? {}) as Array<{ id?: string; name?: string; image?: { full?: string } }>
    return values
      .map((entry) => {
        const name = typeof entry?.name === 'string' ? entry.name.trim() : ''
        const imageFile = typeof entry?.image?.full === 'string' ? entry.image.full : ''
        const image = imageFile
          ? `https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${imageFile}`
          : ''
        return { name, image }
      })
      .filter((entry) => Boolean(entry.name))
      .sort((a, b) => a.name.localeCompare(b.name))
  } catch {
    return []
  }
}

export function ManualMatchEditor({ onSaved, canSyncToBackend = true, teamTemplates = [] }: ManualMatchEditorProps) {
  const createDraft = () => createInitialDraft(teamTemplates)
  const [draft, setDraft] = useState<ManualMatchDraft>(createDraft)
  const [items, setItems] = useState<Item[]>([])
  const [champions, setChampions] = useState<ChampionOption[]>([])
  const [itemSearch, setItemSearch] = useState('')
  const [championSearch, setChampionSearch] = useState('')
  const [selectedTeamIndex, setSelectedTeamIndex] = useState(0)
  const [selectedPlayerIndex, setSelectedPlayerIndex] = useState(0)
  const [isLoadingDraft, setIsLoadingDraft] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [addItemModalTarget, setAddItemModalTarget] = useState<{
    teamIndex: number
    playerIndex: number
    slotIndex: number
  } | null>(null)
  const [addChampionModalTarget, setAddChampionModalTarget] = useState<{
    teamIndex: number
    playerIndex: number
  } | null>(null)

  useEffect(() => {
    let active = true

    const load = async () => {
      try {
        const [cachedDraft, loadedItems, loadedChampions] = await Promise.all([
          loadPlayedMatchDraft(DRAFT_KEY).catch(() => null),
          itemService.fetchItems().catch(() => []),
          fetchChampionsFromDDragon(),
        ])

        if (!active) return

        if (loadedItems?.length) {
          setItems(loadedItems)
        }

        if (loadedChampions?.length) {
          setChampions(loadedChampions)
        }

        if (cachedDraft) {
          // cachedDraft is StoredDraft (SavePlayedMatchRequest + metadata), convert to UI draft
          const uiDraft = convertSavedToDraft(cachedDraft as SavePlayedMatchRequest)
          setDraft({ ...createDraft(), ...uiDraft })
        }
      } finally {
        if (active) {
          setIsLoadingDraft(false)
        }
      }
    }

    void load()

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (isLoadingDraft) return

    const timer = window.setTimeout(() => {
      try {
        const payload = convertDraftToSaveRequest(draft)
        void savePlayedMatchDraft(createStoredDraft(payload, DRAFT_KEY)).catch((error) => {
          console.error('Failed to persist manual draft:', error)
        })
      } catch (err) {
        console.error('Failed to convert draft for persistence:', err)
      }
    }, 250)

    return () => window.clearTimeout(timer)
  }, [draft, isLoadingDraft])

  const filteredItems = useMemo(() => {
    const query = itemSearch.trim().toLowerCase()
    if (!query) {
      return items.slice(0, 18)
    }

    return items.filter((item) => {
      const haystacks = [
        item.itemName,
        item.itemId,
        ...(item.tags ?? []),
        ...(item.customTags ?? []),
      ]
          .filter(Boolean)
          .map((value) => String(value).toLowerCase())

      return haystacks.some((value) => value.includes(query))
    })
  }, [itemSearch, items])

  const filteredChampions = useMemo(() => {
    const query = championSearch.trim().toLowerCase()
    if (!query) return champions.slice(0, 30)
    return champions.filter((champion) => champion.name.toLowerCase().includes(query)).slice(0, 30)
  }, [championSearch, champions])

  const championImageByName = useMemo(() => {
    const map: Record<string, string> = {}
    for (const champion of champions) {
      if (!champion.name || !champion.image) continue
      map[champion.name.toLowerCase()] = champion.image
    }
    return map
  }, [champions])

  const updateDraft = (updater: (current: ManualMatchDraft) => ManualMatchDraft) => {
    setDraft((current) => updater(current))
  }

  const updateTeam = (teamIndex: number, updater: (team: ManualTeamDraft) => ManualTeamDraft) => {
    updateDraft((current) => ({
      ...current,
      teams: current.teams.map((team, index) => (index === teamIndex ? updater(team) : team)),
    }))
  }

  const updatePlayer = (
      teamIndex: number,
      playerIndex: number,
      updater: (player: ManualPlayerDraft) => ManualPlayerDraft,
  ) => {
    updateTeam(teamIndex, (team) => ({
      ...team,
      players: team.players.map((player, index) => (index === playerIndex ? updater(player) : player)),
    }))
  }

  const handleRemoveItem = (teamIndex: number, playerIndex: number, itemIndex: number) => {
    updatePlayer(teamIndex, playerIndex, (player) => ({
      ...player,
      items: player.items.filter((_, index) => index !== itemIndex),
    }))
  }

  const insertItemAtSlot = (teamIndex: number, playerIndex: number, slotIndex: number, item: Item) => {
    const itemName = item.itemName || item.itemId
    updatePlayer(teamIndex, playerIndex, (player) => {
      const newItems = [...player.items]
      // ensure length
      while (newItems.length < 6) newItems.push('')
      newItems[slotIndex] = itemName
      return { ...player, items: newItems.slice(0, 6) }
    })
  }

  const openAddItemModal = (teamIndex: number, playerIndex: number, slotIndex: number) => {
    setSelectedTeamIndex(teamIndex)
    setSelectedPlayerIndex(playerIndex)
    setAddItemModalTarget({ teamIndex, playerIndex, slotIndex })
    setItemSearch('')
  }

  const closeAddItemModal = () => setAddItemModalTarget(null)

  const openAddChampionModal = (teamIndex: number, playerIndex: number) => {
    setSelectedTeamIndex(teamIndex)
    setSelectedPlayerIndex(playerIndex)
    setAddChampionModalTarget({ teamIndex, playerIndex })
    setChampionSearch('')
  }

  const closeAddChampionModal = () => setAddChampionModalTarget(null)

  const handleSelectItemFromModal = (item: Item) => {
    if (!addItemModalTarget) return
    insertItemAtSlot(addItemModalTarget.teamIndex, addItemModalTarget.playerIndex, addItemModalTarget.slotIndex, item)
    closeAddItemModal()
  }

  const handleSelectChampionFromModal = (championName: string) => {
    if (!addChampionModalTarget) return
    const championImage = championImageByName[championName.toLowerCase()] || undefined
    updatePlayer(addChampionModalTarget.teamIndex, addChampionModalTarget.playerIndex, (player) => ({
      ...player,
      championName,
      championImage,
      championId: '',
    }))
    closeAddChampionModal()
  }

  const handleSave = async () => {
    setIsSaving(true)
    setStatusMessage(null)

    const matchId = draft.matchId
    const payload: SavePlayedMatchRequest = {
      ...draft,
      matchId,
      queue: normalizeText(draft.queue),
      gameMode: normalizeText(draft.gameMode),
      durationSeconds: Math.max(0, Math.floor(draft.durationSeconds)),
      endedAt: new Date().toISOString(),
      teams: draft.teams.map((team): PlayedMatchTeam => ({
        teamId: team.teamId,
        name: team.name,
        won: draft.winnerTeamId === team.teamId,
        players: team.players.map((player) => ({
          summonerName: normalizeText(player.summonerName) || 'Unknown',
          riotId: normalizeText(player.riotId) || null,
          championName: normalizeText(player.championName) || 'Unknown',
          championId: normalizeText(player.championId) || null,
          role: normalizeText(player.role) || null,
          teamPosition: normalizeText(player.teamPosition) || null,
          items: player.items.map((itemName, slot) => {
            const resolvedItem =
                items.find((candidate) => {
                  const candidateNames = [candidate.itemName, candidate.itemId]
                      .filter(Boolean)
                      .map((value) => String(value).toLowerCase())

                  return candidateNames.includes(itemName.toLowerCase())
                }) ?? itemService.getItemByName?.(itemName)

            return {
              itemId: resolvedItem?.itemId || itemName,
              itemName: resolvedItem?.itemName || itemName,
              image: resolvedItem?.image ?? null,
              customTags: resolvedItem?.customTags ?? null,
              slot,
            }
          }),
        })),
      })),
    }

    try {
      if (!canSyncToBackend) {
        await savePlayedMatchDraft(createStoredDraft(payload, DRAFT_KEY))
        setStatusMessage('Draft saved locally. Log in later to sync it to your account.')
        return
      }

      const response = await playedMatchService.savePlayedMatch(payload)

      await deletePlayedMatchDraft(DRAFT_KEY)
      await requestPlayedMatchQueueFlush().catch((error) => {
        console.warn('Could not flush queued played matches after save:', error)
      })
      setStatusMessage('Match saved to history.')
      onSaved?.(response.data.match)
      setDraft(createDraft())
      setSelectedTeamIndex(0)
      setSelectedPlayerIndex(0)
    } catch (error) {
      console.error('Failed to save played match:', error)

      const shouldQueueForBackgroundSync = !navigator.onLine || (isAxiosError(error) && !error.response)

      if (shouldQueueForBackgroundSync) {
        await queuePlayedMatchSaveForSync(payload)
        await deletePlayedMatchDraft(DRAFT_KEY)
        setStatusMessage('Offline right now. Match queued for background sync.')
        setDraft(createDraft())
        setSelectedTeamIndex(0)
        setSelectedPlayerIndex(0)
        return
      }

      setStatusMessage('Could not save the match to the backend.')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoadingDraft) {
    return (
        <section className="flex min-h-[32rem] items-center justify-center rounded-[30px] border border-white/10 bg-slate-950/75 p-6">
          <div className="flex items-center gap-3 text-slate-300">
            <LoaderCircle className="h-5 w-5 animate-spin text-cyan-300" />
            Loading manual draft...
          </div>
        </section>
    )
  }

  return (
      <section className="rounded-[30px] border border-white/10 bg-slate-950/75 p-5 shadow-[0_20px_70px_rgba(8,15,35,0.35)]">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-cyan-300/80">Manual match</p>
            <h3 className="mt-1 text-2xl font-semibold text-white">Build and save a finished game</h3>
            <p className="mt-2 max-w-2xl text-sm text-slate-400">
              Same live-style layout, but editable. Draft changes are stored locally in IndexedDB as you type.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
                type="button"
                onClick={() => setDraft(createDraft())}
                className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-200 transition hover:bg-white/[0.08]"
            >
              Reset draft
            </button>
            <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="inline-flex items-center gap-2 rounded-full bg-cyan-400/15 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200 transition hover:bg-cyan-400/25 disabled:cursor-wait disabled:opacity-70"
            >
              {isSaving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save match
            </button>
          </div>
        </div>

        <div className="mt-5 space-y-5">
          <MatchStatusCard mode={draft.gameMode} duration={formatDurationLabel(draft.durationSeconds)} />

          <div className="grid gap-3 rounded-[24px] border border-white/10 bg-white/[0.03] p-4 lg:grid-cols-3">
            <label className="grid gap-2">
              <span className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Game mode</span>
              <input
                  value={draft.gameMode}
                  onChange={(event) => updateDraft((current) => ({ ...current, gameMode: event.target.value }))}
                  className="rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 text-sm text-white outline-none transition focus:border-cyan-400/40"
              />
            </label>
            <label className="grid gap-2">
              <span className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Queue</span>
              <input
                  value={draft.queue}
                  onChange={(event) => updateDraft((current) => ({ ...current, queue: event.target.value }))}
                  className="rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 text-sm text-white outline-none transition focus:border-cyan-400/40"
              />
            </label>
            <label className="grid gap-2">
              <span className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Winner</span>
              <select
                  value={draft.winnerTeamId}
                  onChange={(event) =>
                      updateDraft((current) => ({
                        ...current,
                        winnerTeamId: event.target.value,
                        teams: current.teams.map((team) => ({
                          ...team,
                          won: team.teamId === event.target.value,
                        })),
                      }))
                  }
                  className="rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 text-sm text-white outline-none transition focus:border-cyan-400/40"
              >
                {draft.teams.map((team) => (
                    <option key={team.teamId} value={team.teamId}>
                      {team.name}
                    </option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid gap-5 min-[1900px]:grid-cols-2">
            {draft.teams.map((team, teamIndex) => (
                <ManualTeamPanel
                    key={team.teamId}
                    team={team}
                    teamIndex={teamIndex}
                    selectedTeamIndex={selectedTeamIndex}
                    selectedPlayerIndex={selectedPlayerIndex}
                    onSelectPlayer={(playerIndex) => {
                      setSelectedTeamIndex(teamIndex)
                      setSelectedPlayerIndex(playerIndex)
                    }}
                    onSetWinner={() =>
                        updateDraft((current) => ({
                          ...current,
                          winnerTeamId: team.teamId,
                          teams: current.teams.map((entry) => ({
                            ...entry,
                            won: entry.teamId === team.teamId,
                          })),
                        }))
                    }
                    onUpdatePlayer={(playerIndex, updater) => updatePlayer(teamIndex, playerIndex, updater)}
                    onRemoveItem={(playerIndex, itemIndex) => handleRemoveItem(teamIndex, playerIndex, itemIndex)}
                    onOpenChampionAdd={openAddChampionModal}
                    onOpenAdd={openAddItemModal}
                />
            ))}
          </div>

          {statusMessage ? (
              <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-3 py-2 text-sm text-cyan-100">
                {statusMessage}
              </div>
          ) : null}

          <div className="grid gap-3 rounded-[24px] border border-white/10 bg-white/[0.03] p-4 md:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-3 text-sm text-slate-300">
              Teams: {draft.teams.length}
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-3 text-sm text-slate-300">
              Players: {draft.teams.reduce((count, team) => count + team.players.length, 0)}
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-3 text-sm text-slate-300">
              Items catalog: {items.length}
            </div>
          </div>
          {addItemModalTarget ? (
              <div className="fixed inset-0 z-50 flex items-start justify-center p-6">
                <div className="absolute inset-0 bg-black/60" onClick={closeAddItemModal} />
                <div className="relative z-10 w-full max-w-2xl rounded-2xl bg-slate-900/95 p-4 shadow-2xl">
                  <div className="mb-3 flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-white">Add item</h4>
                    <button type="button" onClick={closeAddItemModal} className="text-slate-400 hover:text-slate-200">Close</button>
                  </div>
                  <div className="mb-2">
                    <input
                        value={itemSearch}
                        onChange={(e) => setItemSearch(e.target.value)}
                        placeholder="Search items by name or tag"
                        className="w-full rounded-lg border border-white/10 bg-slate-950/80 px-3 py-2 text-sm text-white outline-none"
                    />
                  </div>
                  <div className="max-h-72 overflow-auto">
                    {filteredItems.map((item) => (
                        <button
                            key={item.itemId}
                            type="button"
                            onClick={() => handleSelectItemFromModal(item)}
                            className="mb-1 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left hover:bg-white/5"
                        >
                          {item.image ? (
                            <img
                              src={item.image}
                              alt={item.itemName}
                              className="h-8 w-8 rounded object-cover"
                            />
                          ) : (
                            <div className="flex h-8 w-8 items-center justify-center rounded bg-white/5 text-xs text-white">
                              {item.itemName?.slice(0, 2)}
                            </div>
                          )}
                          <div className="flex-1 text-sm text-slate-200">{item.itemName}</div>
                          <div className="text-xs text-slate-400">{item.itemId}</div>
                        </button>
                    ))}
                  </div>
                </div>
              </div>
          ) : null}
          {addChampionModalTarget ? (
              <div className="fixed inset-0 z-50 flex items-start justify-center p-6">
                <div className="absolute inset-0 bg-black/60" onClick={closeAddChampionModal} />
                <div className="relative z-10 w-full max-w-2xl rounded-2xl bg-slate-900/95 p-4 shadow-2xl">
                  <div className="mb-3 flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-white">Select champion</h4>
                    <button type="button" onClick={closeAddChampionModal} className="text-slate-400 hover:text-slate-200">Close</button>
                  </div>
                  <div className="mb-2">
                    <input
                        value={championSearch}
                        onChange={(e) => setChampionSearch(e.target.value)}
                        placeholder="Search champion by name"
                        className="w-full rounded-lg border border-white/10 bg-slate-950/80 px-3 py-2 text-sm text-white outline-none"
                    />
                  </div>
                  <div className="max-h-72 overflow-auto">
                    {filteredChampions.map((champion) => (
                        <button
                            key={champion.name}
                            type="button"
                            onClick={() => handleSelectChampionFromModal(champion.name)}
                            className="mb-1 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left hover:bg-white/5"
                        >
                          {champion.image ? (
                            <img src={champion.image} alt={champion.name} className="h-8 w-8 rounded object-cover" />
                          ) : (
                            <div className="flex h-8 w-8 items-center justify-center rounded bg-white/5 text-xs text-white">
                              {champion.name.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                          <div className="flex-1 text-sm text-slate-200">{champion.name}</div>
                        </button>
                    ))}
                  </div>
                </div>
              </div>
          ) : null}
        </div>
      </section>
  )
}

type ManualTeamPanelProps = {
  team: ManualTeamDraft
  teamIndex: number
  selectedTeamIndex: number
  selectedPlayerIndex: number
  onSelectPlayer: (playerIndex: number) => void
  onSetWinner: () => void
  onUpdatePlayer: (
      playerIndex: number,
      updater: (player: ManualPlayerDraft) => ManualPlayerDraft,
  ) => void
  onRemoveItem: (playerIndex: number, itemIndex: number) => void
  onOpenChampionAdd?: (teamIndex: number, playerIndex: number) => void
  onOpenAdd?: (teamIndex: number, playerIndex: number, slotIndex: number) => void
}

function ManualTeamPanel({
                           team,
                           teamIndex,
                           selectedTeamIndex,
                           selectedPlayerIndex,
                           onSelectPlayer,
                           onSetWinner,
                           onUpdatePlayer,
                           onRemoveItem,
                           onOpenChampionAdd,
                           onOpenAdd,
                         }: ManualTeamPanelProps) {
  const accent =
      team.side === 'blue'
          ? 'from-cyan-400/30 to-blue-500/10 border-cyan-400/20'
          : 'from-rose-500/30 to-red-500/10 border-rose-400/20'

  return (
      <section
          className={`rounded-[28px] border bg-gradient-to-b ${accent} px-4 py-3.5 shadow-[0_20px_70px_rgba(8,15,35,0.45)]`}
      >
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.22em] text-slate-400">Team composition</p>
            <h3 className="mt-0.5 text-xl font-semibold text-white">{team.name}</h3>
          </div>
          <button
              type="button"
              onClick={onSetWinner}
              className={`rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-200 transition hover:bg-white/[0.08]`}
          >
            {team.won ? 'Winner' : 'Set winner'}
          </button>
        </div>

        <div className="space-y-2.5">
          {team.players.map((player, playerIndex) => (
              <ManualPlayerCard
                  key={`${team.teamId}-${playerIndex}`}
                  player={player}
                  teamIndex={teamIndex}
                  isSelected={teamIndex === selectedTeamIndex && playerIndex === selectedPlayerIndex}
                  onSelect={() => onSelectPlayer(playerIndex)}
                  onUpdate={(updater) => onUpdatePlayer(playerIndex, updater)}
                  onRemoveItem={(itemIndex) => onRemoveItem(playerIndex, itemIndex)}
                  onOpenChampionAdd={() => onOpenChampionAdd?.(teamIndex, playerIndex)}
                  onOpenAdd={(slotIndex) => onOpenAdd?.(teamIndex, playerIndex, slotIndex)}
              />
          ))}
        </div>
      </section>
  )
}

type ManualPlayerCardProps = {
  player: ManualPlayerDraft
  isSelected: boolean
  onSelect: () => void
  onUpdate: (updater: (player: ManualPlayerDraft) => ManualPlayerDraft) => void
  onRemoveItem: (itemIndex: number) => void
  teamIndex?: number
  onOpenChampionAdd?: () => void
  onOpenAdd?: (slotIndex: number) => void
}

function ManualPlayerCard({
                            player,
                            isSelected,
                            onSelect,
                            onUpdate,
                            onRemoveItem,
                            onOpenChampionAdd,
                            onOpenAdd,
                          }: ManualPlayerCardProps) {
  const championInitials = (player.championName || '??').slice(0, 2).toUpperCase()

  return (
      <article
          role="button"
          tabIndex={0}
          onClick={onSelect}
          className={`overflow-hidden rounded-[20px] border px-3 py-2.5 transition ${
              isSelected
                  ? 'border-cyan-400/30 bg-cyan-400/8'
                  : 'border-white/8 bg-slate-950/75 hover:border-cyan-400/20 hover:bg-slate-950/90'
          }`}
      >
        <div className="grid min-w-0 gap-3 lg:grid-cols-[140px_minmax(0,1fr)] lg:items-center">
          <div className="flex min-w-0 items-center gap-3">
            <div className="relative h-11 w-11 shrink-0">
              {player.championImage ? (
                <img
                  src={player.championImage}
                  alt={player.championName || 'Champion'}
                  className="h-11 w-11 rounded-full object-cover shadow-[0_0_20px_rgba(56,189,248,0.22)] ring-2 ring-white/10"
                />
              ) : (
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 text-[10px] font-semibold text-slate-950 shadow-[0_0_20px_rgba(56,189,248,0.22)] ring-2 ring-white/10">
                  {championInitials}
                </div>
              )}
              <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation()
                    onOpenChampionAdd?.()
                  }}
                  className="absolute -top-1 -right-1 inline-flex h-5 w-5 items-center justify-center rounded-full border border-white/15 bg-slate-950/95 text-cyan-200 shadow-[0_6px_18px_rgba(15,23,42,0.45)] transition hover:scale-110 hover:text-cyan-100"
                  aria-label="Select champion"
              >
                <Plus className="h-3 w-3" />
              </button>
            </div>

            <div className="min-w-0 flex-1 space-y-1">
              <input
                  value={player.summonerName}
                  onChange={(event) => onUpdate((current) => ({ ...current, summonerName: event.target.value }))}
                  onClick={(event) => event.stopPropagation()}
                  placeholder="Summoner name"
                  className="w-full bg-transparent text-xs font-semibold leading-4 text-white outline-none placeholder:text-slate-500"
              />
              <input
                  value={player.championName}
                  onChange={(event) =>
                      onUpdate((current) => ({
                        ...current,
                        championName: event.target.value,
                      }))
                  }
                  onClick={(event) => event.stopPropagation()}
                  placeholder="Champion"
                  className="w-full truncate bg-transparent text-[11px] text-slate-300 outline-none placeholder:text-slate-500"
              />
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <ManualItemStrip items={player.items} onRemoveItem={onRemoveItem} onOpenAdd={onOpenAdd} />
          </div>
        </div>
      </article>
  )
}

type ManualItemStripProps = {
  items: string[]
  onRemoveItem: (itemIndex: number) => void
}

function ManualItemStrip({ items, onRemoveItem, onOpenAdd }: ManualItemStripProps & { onOpenAdd?: (slotIndex: number) => void }) {
  return (
      <div className="w-full pb-1">
        <div className="grid w-full grid-cols-6 gap-2">
          {Array.from({ length: 6 }).map((_, slotIndex) => {
            const item = items[slotIndex] ?? null
            const itemMeta = item ? itemService.getItemByName?.(item) : undefined
            const itemImage = itemMeta?.image ?? null
            const itemCode = (item ?? '')
                .split(' ')
                .map((part) => part[0])
                .join('')
                .slice(0, 2)
                .toUpperCase()

            return (
                <div key={`${item || 'empty'}-${slotIndex}`} className="group mx-auto w-[45px] text-center">
                  <div className="relative aspect-square w-[45px]">
                    <div
                        className={`flex h-full w-full items-center justify-center overflow-hidden rounded-lg border text-[10px] font-semibold ${
                            item
                                ? 'border-fuchsia-400/35 bg-[radial-gradient(circle_at_top_center,_rgba(217,70,239,0.42),_rgba(59,7,100,0.88)_70%)] text-fuchsia-50 shadow-[0_0_20px_rgba(217,70,239,0.22),0_-8px_24px_rgba(217,70,239,0.18)]'
                                : 'border-white/10 bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.16),_rgba(15,23,42,0.92))] text-slate-100'
                        }`}
                    >
                      {itemImage ? (
                          <img src={itemImage} alt={item ?? ''} className="h-full w-full rounded-lg object-cover" />
                      ) : (
                          itemCode
                      )}
                    </div>
                    {item ? (
                        <button
                            type="button"
                            onClick={(event) => {
                              event.preventDefault()
                              event.stopPropagation()
                              onRemoveItem(slotIndex)
                            }}
                            className="absolute -top-1.5 -right-1.5 z-20 flex h-[22px] w-[22px] items-center justify-center rounded-full border border-white/15 bg-slate-950/95 text-white shadow-[0_6px_18px_rgba(15,23,42,0.45)] backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:scale-110 hover:border-white/30 hover:bg-rose-500/95 focus:outline-none focus:ring-2 focus:ring-rose-400/60"
                            aria-label="Remove item"
                        >
                  <span className="relative block h-2.5 w-2.5">
                    <span className="absolute left-1/2 top-1/2 h-0.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rotate-45 rounded-full bg-current" />
                    <span className="absolute left-1/2 top-1/2 h-0.5 w-2.5 -translate-x-1/2 -translate-y-1/2 -rotate-45 rounded-full bg-current" />
                  </span>
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              onOpenAdd?.(slotIndex)
                            }}
                            className="absolute inset-0 flex items-center justify-center text-cyan-200 hover:text-cyan-100 cursor-pointer"
                            aria-label="Add item"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                    )}
                  </div>
                  <p className="mt-1 truncate text-[8px] leading-3 text-slate-400">{item ?? ''}</p>
                </div>
            )
          })}
        </div>
      </div>
  )
}
