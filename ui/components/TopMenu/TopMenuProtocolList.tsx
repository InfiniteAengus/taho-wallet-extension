import React, { ReactElement } from "react"
import {
  ARBITRUM_NOVA,
  ARBITRUM_ONE,
  AVALANCHE,
  BINANCE_SMART_CHAIN,
  ETHEREUM,
  GOERLI,
  OPTIMISM,
  POLYGON,
  ROOTSTOCK,
} from "@tallyho/tally-background/constants"
import { sameNetwork } from "@tallyho/tally-background/networks"
import { selectCurrentNetwork } from "@tallyho/tally-background/redux-slices/selectors"
import { selectShowTestNetworks } from "@tallyho/tally-background/redux-slices/ui"
import { selectProductionEVMNetworks } from "@tallyho/tally-background/redux-slices/selectors/networks"
import { useTranslation } from "react-i18next"
import { useBackgroundSelector } from "../../hooks"
import TopMenuProtocolListItem from "./TopMenuProtocolListItem"
import { i18n } from "../../_locales/i18n"

const productionNetworkInfo = {
  [ETHEREUM.chainID]: i18n.t("protocol.mainnet"),
  [POLYGON.chainID]: i18n.t("protocol.l2"),
  [OPTIMISM.chainID]: i18n.t("protocol.l2"),
  [ARBITRUM_ONE.chainID]: i18n.t("protocol.l2"),
  [ROOTSTOCK.chainID]: i18n.t("protocol.beta"),
  [AVALANCHE.chainID]: i18n.t("protocol.avalanche"),
  [BINANCE_SMART_CHAIN.chainID]: i18n.t("protocol.compatibleChain"),
  [ARBITRUM_NOVA.chainID]: i18n.t("comingSoon"),
}

const disabledChainIDs = [ARBITRUM_NOVA.chainID]

const testNetworks = [
  {
    network: GOERLI,
    info: i18n.t("protocol.testnet"),
    isDisabled: false,
  },
]

interface TopMenuProtocolListProps {
  onProtocolChange: () => void
}

export default function TopMenuProtocolList({
  onProtocolChange,
}: TopMenuProtocolListProps): ReactElement {
  const { t } = useTranslation()
  const currentNetwork = useBackgroundSelector(selectCurrentNetwork)
  const showTestNetworks = useBackgroundSelector(selectShowTestNetworks)
  const productionNetworks = useBackgroundSelector(selectProductionEVMNetworks)

  return (
    <div className="standard_width_padded center_horizontal">
      <ul>
        {productionNetworks.map((network) => (
          <TopMenuProtocolListItem
            isSelected={sameNetwork(currentNetwork, network)}
            key={network.name}
            network={network}
            info={
              productionNetworkInfo[network.chainID] ||
              t("protocol.compatibleChain")
            }
            onSelect={onProtocolChange}
            isDisabled={disabledChainIDs.includes(network.chainID)}
          />
        ))}
        {showTestNetworks && testNetworks.length > 0 && (
          <>
            <li className="protocol_divider">
              <div className="divider_label">
                {t("topMenu.protocolList.testnetsSectionTitle")}
              </div>
              <div className="divider_line" />
            </li>
            {testNetworks.map((info) => (
              <TopMenuProtocolListItem
                isSelected={sameNetwork(currentNetwork, info.network)}
                key={info.network.name}
                network={info.network}
                info={info.info}
                onSelect={onProtocolChange}
                isDisabled={info.isDisabled ?? false}
              />
            ))}
          </>
        )}
      </ul>
      <style jsx>
        {`
          .protocol_divider {
            display: flex;
            align-items: center;
            margin-bottom: 16px;
            margin-top: 32px;
          }
          .divider_line {
            width: 286px;
            border-bottom-color: var(--green-120);
            border-bottom-style: solid;
            border-bottom-width: 1px;
            margin-left: 19px;
            position: absolute;
            right: 0px;
          }
          .divider_label {
            color: var(--green-40);
            font-size: 16px;
            font-weight: 500;
            line-height: 24px;
          }
        `}
      </style>
    </div>
  )
}
