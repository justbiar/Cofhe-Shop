import { getDefaultWallets } from '@rainbow-me/rainbowkit';
import { configureChains, createConfig } from 'wagmi';
import { sepolia, mainnet } from 'wagmi/chains';
import { publicProvider } from 'wagmi/providers/public';
// Configure chains and providers
const { chains, publicClient } = configureChains([sepolia, mainnet], // Prioritize Sepolia, remove hardhat
[
    // Removed local hardhat node rpc as we are deploying to sepolia
    publicProvider(),
]);
// Default wallets / connectors provided by RainbowKit
const { connectors } = getDefaultWallets({
    appName: 'Ethereum Game',
    projectId: 'YOUR_PROJECT_ID', // Get this from https://cloud.walletconnect.com
    chains,
});
// Create wagmi config
export const config = createConfig({
    autoConnect: true,
    connectors,
    publicClient,
});
export { chains };
