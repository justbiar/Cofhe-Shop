import { configureChains } from 'wagmi'

// Minimal placeholders used during CI builds; runtime wallet config will override these.
export const chains = []
export const config = {
  autoConnect: false,
}
import { getDefaultWallets } from '@rainbow-me/rainbowkit'
import { configureChains, createConfig } from 'wagmi'
import { sepolia, mainnet, hardhat } from 'wagmi/chains'
import { publicProvider } from 'wagmi/providers/public'
import { jsonRpcProvider } from 'wagmi/providers/jsonRpc'

// Configure chains and providers
const { chains, publicClient } = configureChains(
  [sepolia, mainnet], // Prioritize Sepolia, remove hardhat
  [
    // Removed local hardhat node rpc as we are deploying to sepolia
    publicProvider(),
  ],
)

// Default wallets / connectors provided by RainbowKit
const { connectors } = getDefaultWallets({
  appName: 'Ethereum Game',
  projectId: 'YOUR_PROJECT_ID', // Get this from https://cloud.walletconnect.com
  chains,
})

// Create wagmi config
export const config = createConfig({
  autoConnect: true,
  connectors,
  publicClient,
})

export { chains }

