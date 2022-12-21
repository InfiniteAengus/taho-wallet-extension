import React, { ReactElement } from "react"
import { useTranslation } from "react-i18next"
import {
  selectIsReloadingNFTs,
  selectMainCurrencySign,
  selectNFTBadgesCount,
  selectNFTCollectionsCount,
  selectNFTsCount,
} from "@tallyho/tally-background/redux-slices/selectors"

import SharedLoadingSpinner from "../Shared/SharedLoadingSpinner"
import { HeaderContainer, EmptyHeader } from "./NFTsHeaderBase"
import { useBackgroundSelector, useTotalNFTsFloorPrice } from "../../hooks"

export default function NFTsHeader(): ReactElement {
  const { t } = useTranslation("translation", {
    keyPrefix: "nfts",
  })
  const isLoading = useBackgroundSelector(selectIsReloadingNFTs)
  const nftCount = useBackgroundSelector(selectNFTsCount)

  const collectionCount = useBackgroundSelector(selectNFTCollectionsCount)
  const badgeCount = useBackgroundSelector(selectNFTBadgesCount)
  const mainCurrencySign = useBackgroundSelector(selectMainCurrencySign)

  const { totalFloorPriceInETH, totalFloorPriceInUSD } =
    useTotalNFTsFloorPrice()

  if (!nftCount && !badgeCount && !isLoading) {
    return (
      <HeaderContainer>
        <EmptyHeader />
      </HeaderContainer>
    )
  }

  return (
    <HeaderContainer>
      <div className="stats_container">
        <div className="stats_title">{t("header.title")}</div>
        <div className="stats_totals">
          <span className="currency_sign">{mainCurrencySign}</span>
          <span className="currency_total">{totalFloorPriceInUSD ?? "0"}</span>
          {isLoading && (
            <div className="stats_spinner">
              <SharedLoadingSpinner size="small" variant="transparent" />
            </div>
          )}
        </div>
        <div className="crypto_total">{totalFloorPriceInETH ?? "-"} ETH</div>
      </div>
      <ul className="nft_counts">
        <li>
          <strong>{collectionCount}</strong>
          {t("units.collection", { count: collectionCount ?? 0 })}
        </li>
        <li className="spacer" role="presentation" />
        <li>
          <strong>{nftCount}</strong>
          {t("units.nft", { count: nftCount ?? 0 })}
        </li>
        <li className="spacer" role="presentation" />
        <li>
          <strong>{badgeCount}</strong>
          {t("units.badge", { count: badgeCount ?? 0 })}
        </li>
      </ul>
      <style jsx>{`
        .stats_container {
          text-align: center;
          margin-bottom: 24px;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .stats_title {
          font-size: 14px;
          font-weight: 500;
          line-height: 16px;
          letter-spacing: 0.03em;
          color: var(--green-20);
        }

        .stats_spinner {
          position: absolute;
          right: -25px;
        }

        .stats_totals {
          position: relative;
          display: flex;
          flex-direction: row;
          gap: 4px;
          align-items: center;
        }

        .currency_total {
          font-size: 36px;
          font-weight: 500;
          line-height: 48px;
          letter-spacing: 0em;
          color: #fff;
        }

        .currency_sign {
          font-size: 18px;
          font-weight: 600;
          line-height: 24px;
          letter-spacing: 0em;
          color: var(--green-40);
          align-self: start;
          margin-top: 7px;
        }

        .crypto_total {
          font-size: 14px;
          font-weight: 500;
          line-height: 16px;
          letter-spacing: 0.03em;
          color: var(--green-20);
        }

        .nft_counts {
          display: flex;
          flex-direction: row;
          align-items: center;
          justify-content: space-evenly;
          width: 100%;
        }

        li {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 8px;
          color: var(--green-40);
          font-weight: 600;
          font-size: 18px;
          line-height: 24px;
        }

        li strong {
          color: var(--white);
        }

        li.spacer {
          border: 0.5px solid var(--green-80);
          align-self: stretch;
          margin: 0 5px;
        }
      `}</style>
    </HeaderContainer>
  )
}
