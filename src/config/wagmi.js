import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { sepolia } from 'wagmi/chains';

export const config = getDefaultConfig({
  appName: 'Welp Token Presale',
  projectId: '2f05a7caa1578789bf6ea5df5cc5a2d0', // WalletConnect Cloud Project ID
  chains: [sepolia],
  ssr: false,
});