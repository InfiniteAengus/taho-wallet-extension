import { createSlice } from "@reduxjs/toolkit"
import { fromFixedPointNumber } from "../lib/fixed-point"
import { NFT, NFTCollection } from "../nfts"

export type NFTCollectionCached = {
  floorPrice?: {
    value: number
    tokenSymbol: string
  }
  nfts: NFT[]
} & Omit<NFTCollection, "floorPrice">

export type NFTsState = {
  [chainID: string]: {
    [address: string]: {
      [collectionID: string]: NFTCollectionCached
    }
  }
}

export type FiltersState = []

export type NFTsSliceState = { nfts: NFTsState; filters: FiltersState }

function updateCollection(
  acc: NFTsSliceState,
  collection: NFTCollection
): void {
  const {
    id,
    name,
    nftCount,
    network,
    owner,
    floorPrice,
    hasBadges,
    thumbnail,
  } = collection
  const { chainID } = network
  acc.nfts[chainID] ??= {}
  acc.nfts[chainID][owner] ??= {}
  acc.nfts[chainID][owner][collection.id] = {
    id,
    name,
    nftCount,
    nfts: [],
    hasBadges,
    network,
    owner,
    thumbnail,
    floorPrice: floorPrice && {
      value: fromFixedPointNumber(
        { amount: floorPrice.value, decimals: floorPrice.token.decimals },
        4
      ),
      tokenSymbol: floorPrice.token.symbol,
    },
  }
}

function initializeCollections(collections: NFTCollection[]): NFTsSliceState {
  const state: NFTsSliceState = {
    nfts: {},
    filters: [],
  }
  collections.forEach((collection) => updateCollection(state, collection))
  return state
}

const NFTsSlice = createSlice({
  name: "nftsUpdate",
  initialState: {
    nfts: {},
    filters: [],
  } as NFTsSliceState,
  reducers: {
    initializeNFTs: (
      immerState,
      {
        payload,
      }: {
        payload: NFTCollection[]
      }
    ) => initializeCollections(payload),
    updateNFTsCollections: (
      immerState,
      { payload: collections }: { payload: NFTCollection[] }
    ) => {
      collections.forEach((collection) =>
        updateCollection(immerState, collection)
      )
    },
  },
})

export const { initializeNFTs, updateNFTsCollections } = NFTsSlice.actions
export default NFTsSlice.reducer
