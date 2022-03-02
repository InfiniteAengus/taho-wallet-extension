import React from "react"

import { AccountTotal } from "@tallyho/tally-background/redux-slices/selectors"

import SharedLoadingSpinner from "../Shared/SharedLoadingSpinner"

interface Props {
  isSelected: boolean
  account: AccountTotal
}

const AccountItemSummary: React.FC<Props> = (props: Props) => {
  const { isSelected, account } = props
  const {
    shortenedAddress,
    name,
    avatarURL,
    localizedTotalMainCurrencyAmount,
  } = account

  return (
    <>
      <div className="left">
        {isSelected ? (
          <div className="avatar_selected_outline">
            <div className="avatar" />
          </div>
        ) : (
          <div className="avatar" />
        )}

        <div className="info">
          <div className="address_name">
            {typeof name === "undefined" ? shortenedAddress : name}
          </div>
          <div className="address">
            {typeof name !== "undefined" ? shortenedAddress : ""}
          </div>
        </div>
      </div>
      <div className="right">
        <div className="balance_status">
          {typeof localizedTotalMainCurrencyAmount === "undefined" ? (
            <SharedLoadingSpinner size="small" />
          ) : (
            <div className="balance">
              <span className="lighter">$</span>
              {localizedTotalMainCurrencyAmount}
            </div>
          )}
          {isSelected ? (
            <div className="connected_status">Connected</div>
          ) : null}
        </div>
      </div>

      <style jsx>{`
        .avatar {
          background: url("${avatarURL ?? "./images/avatar@2x.png"}") center
            no-repeat;
          background-color: var(--green-40);
          background-size: cover;
          width: 48px;
          height: 48px;
          border-radius: 12px;
        }
        .avatar_selected_outline {
          width: 52px;
          height: 52px;
          border-radius: 16px;
          border: 2px solid #22c480;
          display: flex;
          justify-content: center;
          align-items: center;
          margin-left: -4px;
          margin-right: -4px;
        }
        .left {
          display: flex;
          align-items: center;
          padding-left: 4px;
        }
        .address_name {
          color: #fff;
          font-size: 18px;
          font-weight: 600;
        }
        .address {
          color: var(--green-40);
          font-size: 16px;
        }
        .balance {
          text-align: right;
          color: #fff;
          font-size: 16px;
        }
        .connected_status {
          color: #22c480;
          font-size: 18px;
          font-weight: 600;
          line-height: 24px;
          text-align: right;
        }
        .info {
          margin-left: 16px;
        }
        .lighter {
          color: var(--green-40);
        }
        .right {
          display: flex;
          align-items: center;
          padding-right: 4px;
        }
      `}</style>
    </>
  )
}

export default AccountItemSummary

AccountItemSummary.defaultProps = {
  isSelected: false,
}
