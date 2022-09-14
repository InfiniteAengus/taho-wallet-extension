import { convertToEth, weiToGwei } from "../../lib/utils"
import { ConfirmedEVMTransaction } from "../../networks"
import { EnrichedEVMTransaction } from "../../services/enrichment"
import { HexString } from "../../types"

enum TxStatus {
  FAIL = 0,
  SUCCESS = 1,
}

type FieldAdapter = {
  readableName: string
  transformer: (tx: EnrichedEVMTransaction) => string
  detailTransformer: (tx: EnrichedEVMTransaction) => string
}

type UIFields = keyof (EnrichedEVMTransaction &
  Pick<ConfirmedEVMTransaction, "gasUsed">)

type UIAdaptationMap = {
  [P in UIFields]?: FieldAdapter
}

export type ActivityItem = EnrichedEVMTransaction & {
  localizedDecimalValue: string
  blockHeight: number | null
  fromTruncated: string
  toTruncated: string
  infoRows: {
    [name: string]: {
      label: string
      value: string
      valueDetail: string
    }
  }
}

export function getRecipient(activityItem: ActivityItem): {
  address: HexString | undefined
  name?: string
} {
  const { annotation } = activityItem

  switch (annotation?.type) {
    case "asset-transfer":
      return {
        address: annotation.recipient?.address,
        name: annotation.recipient?.annotation.nameOnNetwork?.name,
      }
    case "contract-interaction":
      return {
        address: activityItem.to,
        name: annotation.contractInfo?.annotation.nameOnNetwork?.name,
      }
    default:
      return { address: activityItem.to }
  }
}

function amountTransformer(
  value: bigint | null | undefined,
  symbol: string
): string {
  if (value === null || typeof value === "undefined") {
    return "(Unknown)"
  }
  return `${convertToEth(value) || "0"} ${symbol}`
}

function gweiTransformer(value: bigint | null | undefined): string {
  if (value === null || typeof value === "undefined") {
    return "(Unknown)"
  }
  return `${weiToGwei(value) || "0"} Gwei`
}

function blockHeightTransformer(
  blockHeight: number | null,
  status: number | undefined
): string {
  if (
    blockHeight !== null &&
    status !== undefined &&
    status !== TxStatus.SUCCESS
  ) {
    return "(failed)"
  }
  if (blockHeight !== null) {
    return blockHeight.toString()
  }
  if (blockHeight === null && status === TxStatus.FAIL) {
    return "(dropped)"
  }

  return "(pending)"
}

function toStringTransformer(value: bigint | number): string {
  return value?.toString() ?? ""
}

/**
 * Given a map of adaptations from fields in EnrichedEVMTransaction, return all keys that need
 * adaptation with three fields, a label, a value, and a valueDetail, derived
 * based on the adaptation map.
 */
export function adaptForUI(
  fieldAdapters: UIAdaptationMap,
  tx: EnrichedEVMTransaction
): {
  [key in keyof UIAdaptationMap]: {
    label: string
    value: string
    valueDetail: string
  }
} {
  // The as below is dicey but reasonable in our usage.
  return Object.keys(fieldAdapters).reduce(
    (adaptedFields, key) => {
      const knownKey = key as keyof UIAdaptationMap // statically guaranteed
      const adapter = fieldAdapters[knownKey] as FieldAdapter | undefined

      if (typeof adapter === "undefined") {
        return adaptedFields
      }

      const { readableName, transformer, detailTransformer } = adapter

      return {
        ...adaptedFields,
        [key]: {
          label: readableName,
          value: transformer(tx),
          valueDetail: detailTransformer(tx),
        },
      }
    },
    {} as {
      [key in keyof UIAdaptationMap]: {
        label: string
        value: string
        valueDetail: string
      }
    }
  )
}

export const keysMap: UIAdaptationMap = {
  blockHeight: {
    readableName: "Block Height",
    transformer: (tx) =>
      blockHeightTransformer(
        tx.blockHeight,
        "status" in tx ? tx.status : undefined
      ),
    detailTransformer: () => "",
  },
  value: {
    readableName: "Amount",
    transformer: (tx) =>
      amountTransformer(tx.value, tx.network.baseAsset.symbol),
    detailTransformer: (tx) =>
      amountTransformer(tx.value, tx.network.baseAsset.symbol),
  },
  maxFeePerGas: {
    readableName: "Max Fee/Gas",
    transformer: (tx) => gweiTransformer(tx.maxFeePerGas),
    detailTransformer: (tx) => gweiTransformer(tx.maxFeePerGas),
  },
  gasPrice: {
    readableName: "Gas Price",
    transformer: (tx) => gweiTransformer(tx.gasPrice),
    detailTransformer: (tx) => gweiTransformer(tx.gasPrice),
  },
  gasUsed: {
    readableName: "Gas",
    transformer: (tx) =>
      "gasUsed" in tx ? toStringTransformer(tx.gasUsed) : "",
    detailTransformer: (tx) =>
      "gasUsed" in tx ? toStringTransformer(tx.gasUsed) : "",
  },
  nonce: {
    readableName: "Nonce",
    transformer: (tx) => toStringTransformer(tx.nonce),
    detailTransformer: (tx) => toStringTransformer(tx.nonce),
  },
}
