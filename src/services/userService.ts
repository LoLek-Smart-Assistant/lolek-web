import axiosInstance from '../config/axiosConfig';

export interface User {
  _id: string;
  username: string;
  email: string;
  riotName?: string;
  riotTag?: string;
  puuid?: string;
  platform?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface LinkRiotRequest {
  riotName: string;
  riotTag: string;
  platform: string;
}

export interface RiotProfile {
  summonerId: string;
  summonerName: string;
  summonerLevel: number;
  [key: string]: any;
}

const userService = {
  /**
   * Get current user profile
   */
  getProfile: () => {
    return axiosInstance.get<User>('/user/profile');
  },

  /**
   * Get Riot profile data for linked account
   */
  getRiotProfile: () => {
    return axiosInstance.get<RiotProfile>('/user/riot-profile');
  },

  /**
   * Link Riot account to user profile
   */
  linkRiotProfile: (data: LinkRiotRequest) => {
    return axiosInstance.post('/user/link-riot-profile', data);
  },

  /**
   * Remove linked Riot account from user profile
   */
  removeRiotProfile: () => {
    return axiosInstance.post('/user/remove-riot-profile');
  },

  /**
   * Update user profile
   */
  updateProfile: (data: Partial<User>) => {
    return axiosInstance.put<User>('/user/profile', data);
  },
};

export default userService;
