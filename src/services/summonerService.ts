import axiosInstance from '../config/axiosConfig';

export interface AccountInfo {
  gameName: string;
  tagLine: string;
  puuid: string;
}

export interface LiveGameParticipant {
  summonerId: string;
  summonerName: string;
  championId: number;
  championName: string;
  stats?: {
    [key: string]: any;
  };
  [key: string]: any;
}

export interface LiveGameData {
  gameId: number;
  gameMode: string;
  gameType: string;
  participants: LiveGameParticipant[];
  [key: string]: any;
}

const summonerService = {
  /**
   * Get account by game name and tag line
   */
  getAccount: (gameName: string, tagLine: string) => {
    return axiosInstance.get<AccountInfo>(`/riot-account/${gameName}/${tagLine}`);
  },

  /**
   * Get live game spectator data
   */
  getLiveGame: (platform: string, encryptedId: string) => {
    return axiosInstance.get<LiveGameData>(`/live-game/${platform}/${encryptedId}`);
  },
};

export default summonerService;
