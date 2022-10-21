import { ARBITRUM_ONE } from "@tallyho/tally-background/constants"
import { useEffect, useState } from "react"

type Campaign = {
  startDate: Date
  endDate: Date
  title: string
  description?: string
  chains: string[]
  buttons?: {
    primary?: {
      title: string
      link: string
    }
    secondary?: {
      title: string
      link: string
    }
  }
}

const odysseyProps = {
  chains: [ARBITRUM_ONE.chainID],
  buttons: {
    primary: {
      title: "Start now",
      link: "https://galxe.com/arbitrum",
    },
    secondary: {
      title: "Learn more",
      link: "https://galxe.com/arbitrum", // TODO will change - blogpost link
    },
  },
}

const bannerCampaigns: Campaign[] = [
  {
    startDate: new Date("11.07.2022"),
    endDate: new Date("11.13.2022"),
    title: "Odyssey Week 2 is live!",
    description: "Explore Arbitrum and earn exclusive NFTs.",
    ...odysseyProps,
  },
  {
    startDate: new Date("11.14.2022"),
    endDate: new Date("11.20.2022"),
    title: "Odyssey Week 3 is live!",
    description: "Featuring Aboard Exchange and TofuNFT.",
    ...odysseyProps,
  },
  {
    startDate: new Date("11.21.2022"),
    endDate: new Date("11.27.2022"),
    title: "Odyssey Week 4 is live!",
    description: "Featuring Uniswap and Apex.",
    ...odysseyProps,
  },
  {
    startDate: new Date("11.28.2022"),
    endDate: new Date("12.04.2022"),
    title: "Odyssey Week 5 is live!",
    description: "Featuring 1inch and Izumi/Yin Finance.",
    ...odysseyProps,
  },
  {
    startDate: new Date("12.05.2022"),
    endDate: new Date("12.11.2022"),
    title: "Odyssey Week 6 is live!",
    description: "Featuring Dodo and Swapr.",
    ...odysseyProps,
  },
  {
    startDate: new Date("12.12.2022"),
    endDate: new Date("12.18.2022"),
    title: "Odyssey Week 7 is live!",
    description: "Featuring TreasureDAO and Battlefly.",
    ...odysseyProps,
  },
  {
    startDate: new Date("12.19.2022"),
    endDate: new Date("12.25.2022"),
    title: "Odyssey Week 8 is live!",
    description: "Featuring Ideamarket and Sushi.",
    ...odysseyProps,
  },
]

export default (chainID: string): Campaign | null => {
  const [currentCampaign, setCurrentCampaign] = useState<Campaign | null>(null)

  useEffect(() => {
    const currentDate = new Date()
    const relevantCampaings = bannerCampaigns.filter(
      (campaign) =>
        campaign.startDate <= currentDate &&
        currentDate <= campaign.endDate &&
        campaign.chains.includes(chainID)
    )

    setCurrentCampaign(relevantCampaings[0] ?? null)
  }, [chainID])

  return currentCampaign
}
