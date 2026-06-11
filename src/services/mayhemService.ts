import axiosInstance from '../config/axiosConfig'

export type MayhemItemEntry = {
  itemId: number
  itemName: string | null
  image?: string | null
  customTags?: string[] | null
}

export type MayhemChampionResult = {
  championName: string
  championId: string
  version: string
  coreItems: MayhemItemEntry[]
  suggestedItems: {
    slot4Items: MayhemItemEntry[]
    slot5Items: MayhemItemEntry[]
    slot6Items: MayhemItemEntry[]
    allItems: MayhemItemEntry[]
  }
}

export type MayhemSuggestedItemsResponse = {
  requestedChampions: string[]
  foundCount: number
  notFoundChampions: string[]
  results: MayhemChampionResult[]
}

const mayhemService = {
  getSuggestedItemsByChampions: async (
    champions: string[],
  ): Promise<MayhemSuggestedItemsResponse> => {
    const cleaned = champions.map((champion) => champion.trim()).filter(Boolean)
    if (!cleaned.length) {
      return {
        requestedChampions: [],
        foundCount: 0,
        notFoundChampions: [],
        results: [],
      }
    }

    const response = await axiosInstance.get<MayhemSuggestedItemsResponse>(
      '/mayhem-suggested-items',
      {
        params: {
          champions: cleaned.join(','),
        },
      },
    )
    return response.data
  },
}

export default mayhemService

