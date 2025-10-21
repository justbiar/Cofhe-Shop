import { getDefaultWallets } from '@rainbow-me/rainbowkit'
import { configureChains, createConfig } from 'wagmi'
import { sepolia, mainnet } from 'wagmi/chains'
import { publicProvider } from 'wagmi/providers/public'

// Minimal runtime wagmi configuration so the app can mount without runtime errors.
// Uses publicProvider for read-only RPC; this is safe for static builds and avoids
// the previous runtime error where wagmi expected an internal client object.
const { chains: _chains, publicClient, webSocketPublicClient } = configureChains(
	[sepolia, mainnet],
	[publicProvider()],
)

export const chains = _chains

// Create a real wagmi config. This ensures `WagmiConfig` provider receives the
// shape it expects and prevents runtime exceptions that caused the blank page.
export const config = createConfig({
	autoConnect: false,
	publicClient,
	webSocketPublicClient,
})

