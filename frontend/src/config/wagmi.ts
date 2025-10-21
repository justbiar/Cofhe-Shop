import { getDefaultWallets } from '@rainbow-me/rainbowkit'
import { configureChains, createConfig } from 'wagmi'
import { sepolia, mainnet } from 'wagmi/chains'
import { publicProvider } from 'wagmi/providers/public'
import { InjectedConnector } from 'wagmi/connectors/injected'
import { MetaMaskConnector } from 'wagmi/connectors/metaMask'

// Configure chains and public clients
const { chains: _chains, publicClient, webSocketPublicClient } = configureChains(
	[sepolia, mainnet],
	[publicProvider()],
)

export const chains = _chains

// RainbowKit's getDefaultWallets requires a WalletConnect projectId in newer versions.
// Read from Vite env (VITE_WALLETCONNECT_PROJECT_ID). If not provided, fall back
// to a minimal set of connectors (MetaMask and Injected) so users can still
// connect with browser wallets like MetaMask.
const projectId = ((import.meta as any).env && (import.meta as any).env.VITE_WALLETCONNECT_PROJECT_ID) || ''

let connectors = [] as any[]
if (projectId) {
	try {
		const defaults = getDefaultWallets({
			appName: 'CoFHE Shop',
			projectId,
			chains: _chains,
		})
		// getDefaultWallets may return connectors as a function; call it if so.
		connectors = typeof defaults.connectors === 'function' ? defaults.connectors() : defaults.connectors
	} catch (err) {
		connectors = [new MetaMaskConnector({ chains: _chains }), new InjectedConnector({ chains: _chains })]
	}
} else {
	connectors = [new MetaMaskConnector({ chains: _chains }), new InjectedConnector({ chains: _chains })]
}

// Create a wagmi config including connectors. This enables wallet connection UI.
export const config = createConfig({
	autoConnect: false,
	connectors,
	publicClient,
	webSocketPublicClient,
})

