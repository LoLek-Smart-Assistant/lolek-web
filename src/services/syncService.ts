import axiosInstance from '../config/axiosConfig';

export interface Champion {
  _id: string;
  version: string;
  championId: string;
  championName: string;
  tags: string[];
  image?: string | null;
}

export interface Item {
  _id: string;
  version: string;
  itemId: string;
  itemName: string;
  description?: string | null;
  tags: string[];
  customTags?: string[];
  image?: string | null;
  isBoots?: boolean;
  isLegendary?: boolean;
}

export interface SyncResponse {
  message: string;
  champions?: Champion[];
  items?: Item[];
  [key: string]: any;
}

const syncService = {
  /**
   * Sync champions and items data from Riot API
   */
  syncData: () => {
    return axiosInstance.post<SyncResponse>('/syncData');
  },
};

export default syncService;
