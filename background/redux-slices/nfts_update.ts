import { createSlice } from "@reduxjs/toolkit"
import Emittery from "emittery"
import { AddressOnNetwork } from "../accounts"
import { fromFixedPointNumber } from "../lib/fixed-point"
import { normalizeEVMAddress } from "../lib/utils"
import { NFT, NFTCollection, TransferredNFT } from "../nfts"
import { createBackgroundAsyncThunk } from "./utils"

export type NFTCollectionCached = {
  floorPrice?: {
    value: number
    tokenSymbol: string
  }
  nfts: NFT[]
  hasNextPage: boolean
} & Omit<NFTCollection, "floorPrice">

export type NFTsState = {
  [chainID: string]: {
    [address: string]: {
      [collectionID: string]: NFTCollectionCached
    }
  }
}

export type NFTWithCollection = {
  collection: NFTCollectionCached
  nft: NFT
}

export type FiltersState = []

export type NFTsSliceState = {
  isReloading: boolean
  nfts: NFTsState
  filters: FiltersState
}

export type Events = {
  fetchNFTs: { collectionID: string; account: AddressOnNetwork }
  fetchMoreNFTs: { collectionID: string; account: AddressOnNetwork }
  refetchCollections: never
}

export const emitter = new Emittery<Events>()

function updateCollection(
  acc: NFTsSliceState,
  collection: NFTCollection
): void {
  const {
    id,
    name,
    nftCount,
    totalNftCount,
    network,
    owner,
    floorPrice,
    hasBadges,
    thumbnailURL,
  } = collection
  const { chainID } = network
  const ownerAddress = normalizeEVMAddress(owner)
  acc.nfts[chainID] ??= {}
  acc.nfts[chainID][ownerAddress] ??= {}
  const savedCollection = acc.nfts[chainID][ownerAddress][collection.id] ?? {}

  acc.nfts[chainID][ownerAddress][collection.id] = {
    id,
    name,
    nftCount: nftCount ?? savedCollection.nftCount ?? 0, // POAPs has no nftCount until the NFTs are loaded, let's fallback to old number
    totalNftCount,
    nfts: savedCollection.nfts ?? [],
    hasBadges: savedCollection.hasBadges || hasBadges, // once we know it has badges it should stay like that
    network,
    owner: ownerAddress,
    thumbnailURL,
    hasNextPage: false,
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
    isReloading: false,
    nfts: {},
    filters: [],
  }
  collections.forEach((collection) => updateCollection(state, collection))
  return state
}

const NFTsSlice = createSlice({
  name: "nftsUpdate",
  initialState: {
    isReloading: false,
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
    updateNFTs: (
      immerState,
      {
        payload,
      }: {
        payload: {
          account: AddressOnNetwork
          collectionID: string
          nfts: NFT[]
          hasNextPage: boolean
        }
      }
    ) => {
      const {
        account: { network, address },
        collectionID,
        nfts,
        hasNextPage,
      } = payload

      const collectionToUpdate =
        immerState.nfts[network.chainID][normalizeEVMAddress(address)][
          collectionID
        ]

      collectionToUpdate.nfts = nfts
      collectionToUpdate.hasNextPage = hasNextPage
    },
    updateIsReloading: (
      immerState,
      { payload: isReloading }: { payload: boolean }
    ) => {
      immerState.isReloading = isReloading
    },
    deleteNFTsForAddress: (
      immerState,
      {
        payload: address,
      }: {
        payload: string
      }
    ) => {
      const normalizedAddress = normalizeEVMAddress(address)

      Object.keys(immerState.nfts).forEach((chainID) => {
        delete immerState.nfts[chainID][normalizedAddress]
      })
    },
    deleteTransferredNFTs: (
      immerState,
      { payload: transferredNFTs }: { payload: TransferredNFT[] }
    ) => {
      transferredNFTs.forEach(({ id, chainID, address }) => {
        Object.keys(
          immerState.nfts[chainID][normalizeEVMAddress(address)]
        ).forEach((collectionID) => {
          const collection = immerState.nfts[chainID]?.[address]?.[collectionID]

          if (collection) {
            collection.nfts = collection.nfts.filter((nft) => nft.id !== id)
          }
        })
      })
    },
    cleanCachedNFTs: (immerState) => {
      Object.keys(immerState.nfts).forEach((chainID) =>
        Object.keys(immerState.nfts[chainID]).forEach((address) =>
          Object.keys(immerState.nfts[chainID][address]).forEach(
            (collectionID) => {
              const collection = immerState.nfts[chainID][address][collectionID]

              // TODO: as badges are always expanded they are not updating on intersection
              // Figure out a way for badges to follow the same rules as regular nfts
              if (!collection.hasBadges) {
                const reducedList = collection.nfts.slice(0, 2) // leave 2 nfts to avoid unnecessary updates
                collection.nfts = reducedList
              }
            }
          )
        )
      )
    },
  },
})

export const {
  initializeNFTs,
  updateNFTsCollections,
  updateNFTs,
  updateIsReloading,
  deleteNFTsForAddress,
  deleteTransferredNFTs,
  cleanCachedNFTs,
} = NFTsSlice.actions
export default NFTsSlice.reducer

export const fetchNFTsFromCollection = createBackgroundAsyncThunk(
  "nfts/fetchNFTsFromCollection",
  async (payload: { collectionID: string; account: AddressOnNetwork }) => {
    await emitter.emit("fetchNFTs", payload)
  }
)

export const fetchMoreNFTsFromCollection = createBackgroundAsyncThunk(
  "nfts/fetchMoreNFTsFromCollection",
  async (payload: { collectionID: string; account: AddressOnNetwork }) => {
    await emitter.emit("fetchMoreNFTs", payload)
  }
)

export const refetchCollections = createBackgroundAsyncThunk(
  "nfts/refetchCollections",
  async () => {
    await emitter.emit("refetchCollections")
  }
)
