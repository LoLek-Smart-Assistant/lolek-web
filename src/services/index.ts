export { default as authService } from './authService';
export type { SignInRequest, LoginRequest, AuthResponse } from './authService';

export { default as userService } from './userService';
export type { User, LinkRiotRequest, RiotProfile } from './userService';

export { default as summonerService } from './summonerService';
export type { AccountInfo, LiveGameParticipant, LiveGameData } from './summonerService';

export { default as syncService } from './syncService';
export type { Champion, Item, SyncResponse } from './syncService';

export { default as playedMatchService } from './playedMatchService'
export type {
  PlayedMatchItem,
  PlayedMatchPlayer,
  PlayedMatchRecord,
  PlayedMatchSource,
  PlayedMatchTeam,
  PlayedMatchesResponse,
  SavePlayedMatchRequest,
} from './playedMatchService'

export {
  createStoredDraft,
  deletePlayedMatchDraft,
  loadPlayedMatchDraft,
  savePlayedMatchDraft,
} from './matchDraftStorage'

export { connectLiveGameSummary } from './liveGameSummarySocket';
export type {
  LiveGameSummary,
  LiveGameSummaryMessage,
  LiveGameSummaryParams,
  LiveGameParticipant as LiveGameSummaryParticipant,
} from './liveGameSummarySocket';
