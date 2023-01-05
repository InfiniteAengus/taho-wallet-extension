import { fetchJson } from "@ethersproject/web"
import sinon, { SinonStub } from "sinon"
import IndexingService from ".."
import { SmartContractFungibleAsset } from "../../../assets"
import { ETHEREUM, OPTIMISM } from "../../../constants"
import {
  createChainService,
  createIndexingService,
  createPreferenceService,
} from "../../../tests/factories"
import ChainService from "../../chain"
import PreferenceService from "../../preferences"
import { getOrCreateDb as getIndexingDB } from "../db"

const fetchJsonStub: SinonStub<
  Parameters<typeof fetchJson>,
  ReturnType<typeof fetchJson>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
> = fetchJson as any

// Default to an empty response
beforeEach(() => fetchJsonStub.callsFake(async () => ({})))

afterEach(() => fetchJsonStub.resetBehavior())

describe("IndexingService", () => {
  const sandbox = sinon.createSandbox()
  let indexingService: IndexingService
  let chainService: ChainService
  let preferenceService: PreferenceService

  beforeEach(async () => {
    preferenceService = await createPreferenceService()

    sandbox.stub(preferenceService, "getTokenListPreferences").resolves({
      autoUpdate: false,
      urls: ["https://gateway.ipfs.io/ipns/tokens.uniswap.org"],
    })

    chainService = await createChainService({
      preferenceService: Promise.resolve(preferenceService),
    })

    sandbox.stub(chainService, "supportedNetworks").value([ETHEREUM, OPTIMISM])

    indexedDB = new IDBFactory()

    indexingService = await createIndexingService({
      chainService: Promise.resolve(chainService),
      preferenceService: Promise.resolve(preferenceService),
      dexieOptions: { indexedDB },
    })
  })

  afterEach(async () => {
    // Always try to stop services, ignore failed promises where the service
    // was never started.
    await Promise.allSettled([
      chainService.stopService(),
      indexingService.stopService(),
    ])

    sandbox.restore()
  })

  describe("service start", () => {
    const tokenList = {
      name: "Test",
      timestamp: "2022-05-12T18:15:59+00:00",
      version: {
        major: 1,
        minor: 169,
        patch: 0,
      },
      tokens: [
        {
          chainId: 1,
          address: "0x0000000000000000000000000000000000000000",
          name: "Some Token",
          decimals: 18,
          symbol: "TEST",
          logoURI: "/logo.svg",
          tags: ["earn"],
        },
      ],
    }

    const customAsset: SmartContractFungibleAsset = {
      metadata: {
        tokenLists: [
          {
            url: "https://bridge.arbitrum.io/token-list-42161.json",
            name: "Arb Whitelist Era",
            logoURL: "ipfs://QmTvWJ4kmzq9koK74WJQ594ov8Es1HHurHZmMmhU8VY68y",
          },
        ],
      },
      name: "USD Coin",
      symbol: "USDC",
      decimals: 6,
      homeNetwork: ETHEREUM,
      contractAddress: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
    }

    it("should initialize cache with base assets, custom assets and tokenlists stored in the db", async () => {
      const cacheSpy = jest.spyOn(indexingService, "cacheAssetsForNetwork")

      const indexingDb = await getIndexingDB()

      await indexingDb.addCustomAsset(customAsset)

      await indexingDb.saveTokenList(
        "https://gateway.ipfs.io/ipns/tokens.uniswap.org",
        tokenList
      )

      const delay = sinon.promise<void>()
      fetchJsonStub
        .withArgs({
          url: "https://gateway.ipfs.io/ipns/tokens.uniswap.org",
          timeout: 10_000,
        })
        .returns(
          delay.then(() => ({
            ...tokenList,
            tokens: [
              {
                chainId: 1,
                address: "0x1000000000000000000000000000000000000000",
                name: "Some Token",
                decimals: 18,
                symbol: "DOGGO",
                logoURI: "/logo.svg",
                tags: ["earn"],
              },
            ],
          }))
        )

      await Promise.all([
        chainService.startService(),
        indexingService.startService(),
      ])

      await indexingService.emitter.once("assets").then(() => {
        expect(cacheSpy).toHaveBeenCalled()

        expect(
          indexingService
            .getCachedAssets(ETHEREUM)
            .map((assets) => assets.symbol)
        ).toEqual(["ETH", "USDC", "TEST"])
      })

      delay.resolve(undefined)
    })

    it("should update cache once token lists load", async () => {
      sandbox
        .stub(chainService, "supportedNetworks")
        .value([ETHEREUM, OPTIMISM])
      const cacheSpy = jest.spyOn(indexingService, "cacheAssetsForNetwork")

      const delay = sinon.promise<void>()

      fetchJsonStub
        .withArgs({
          url: "https://gateway.ipfs.io/ipns/tokens.uniswap.org",
          timeout: 10_000,
        })
        .returns(delay.then(() => tokenList))

      await Promise.all([
        chainService.startService(),
        indexingService.startService(),
      ])

      await indexingService.emitter.once("assets").then(() => {
        // The order in which assets are emitted is non-deterministic
        // since the `emit` function gets called as part of an unawaited
        // series of promises (trackedNetworks.forEach in "internalStartService")
        // Since we expect two asset emissions and we don't know which will
        // be emitted first - we make our test assertions after the second
        // emission in the event handler below this one.
      })

      delay.resolve(undefined)

      await indexingService.emitter.once("assets").then(() => {
        /* Caches assets for every supported network + 1 active network */
        expect(cacheSpy).toHaveBeenCalledTimes(5)

        expect(
          indexingService.getCachedAssets(ETHEREUM).map((asset) => asset.symbol)
        ).toEqual(["ETH", "TEST"])
      })
    })

    it("should update cache when adding a custom asset", async () => {
      const cacheSpy = jest.spyOn(indexingService, "cacheAssetsForNetwork")

      fetchJsonStub
        .withArgs({
          url: "https://gateway.ipfs.io/ipns/tokens.uniswap.org",
          timeout: 10_000,
        })
        .resolves(tokenList)

      await Promise.all([
        chainService.startService(),
        indexingService.startService(),
      ])

      await indexingService.emitter.once("assets").then(() => {
        expect(
          indexingService
            .getCachedAssets(ETHEREUM)
            .map((assets) => assets.symbol)
        ).toEqual(["ETH", "TEST"])
      })

      await indexingService.addCustomAsset(customAsset)

      expect(cacheSpy).toHaveBeenCalled()

      expect(
        indexingService.getCachedAssets(ETHEREUM).map((assets) => assets.symbol)
      ).toEqual(["ETH", customAsset.symbol, "TEST"])
    })
  })
})
