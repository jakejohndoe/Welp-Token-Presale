# WELP Token Presale DApp

A professional (testnet) token presale platform for the WELP token on Ethereum Sepolia testnet, featuring an interactive network visualization and modern Web3 integration.

![WELP Token Presale](https://img.shields.io/badge/Sepolia-Testnet-blue) ![License](https://img.shields.io/badge/license-MIT-green)

## 🌟 Features

- **Token Sale System**: Buy and sell WELP tokens with real-time pricing
- **Animated Network Background**: Custom yellow/gold network visualization with data packets
- **Modern Web3 Integration**: RainbowKit + wagmi + viem for seamless wallet connections
- **Real-time Balance Tracking**: Live ETH and WELP balance display
- **Supply Tracker**: Visual progress bar showing presale progress
- **Welp Network Design System**: Custom Fredoka/Nunito fonts with branded yellow CTAs
- **Optimized Transaction Flow**: Direct receipt waiting for 5-15 second transaction completion
- **Enhanced Modal System**: Clean state management preventing stale success modals
- **Custom Favicon**: Welp-branded favicon for professional appearance

## 🚀 Live Demo

**Deployed on Vercel**: presale.sepolia.welp.network

**Sepolia Testnet Contracts**:

- Token Address: `0xb79DA8e01c761D08B2dAAe5c2A9c51e0ace012ed`
- Etherscan:`https://sepolia.etherscan.io/address/0xb79da8e01c761d08b2daae5c2a9c51e0ace012ed`
- Presale Address: `0x19B961BE6CAC93e13988E67FCEAC43FB75F2AD58`

Get free Sepolia ETH: [Metana Faucet](https://faucet.metana.io/#)

## 🛠️ Tech Stack

- **Frontend**: React 18 + Vite
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Web3**: RainbowKit, wagmi, viem
- **Smart Contracts**: Solidity, deployed on SepoliaETH
- **Blockchain**: Ethereum Sepolia Testnet

## 📦 Installation

```bash
# Clone the repository
git clone [your-repo-url]
cd welp-presale-token-sepolia

# Install dependencies
npm install

# Create .env file (see .env.example)
cp .env.example .env

# Start development server
npm run dev
```

## 🔧 Environment Variables

Create a `.env` file in the root directory:

```env
VITE_WALLETCONNECT_PROJECT_ID=your_project_id_here
VITE_WELP_TOKEN_ADDRESS=your_token_address
VITE_PRESALE_ADDRESS=your_presale_address
```

Get your WalletConnect Project ID: [cloud.walletconnect.com](https://cloud.walletconnect.com)

## 🏗️ Smart Contract Architecture

### WELP Token (ERC-20)

- Total Supply: 1,000,000 WELP
- Decimals: 18
- Initial allocation to presale contract

### Presale Contract

- Buy Rate: 0.001 ETH per WELP
- Sell Rate: 0.0005 ETH per WELP
- Owner-controlled withdrawal system

## 🎨 Design System

**Fonts**:

- Headings: Fredoka (700)
- Body: Nunito (400, 600)

**Colors**:

- Primary: Yellow (#FFD700)
- Background: Blue to Purple gradient
- Cards: Glassmorphism with white/10-20 opacity

**Animations**:

- Canvas-based network visualization
- 35 yellow/gold nodes with connecting lines
- Slow-moving data packets (2-3 visible at once)
- Smooth Framer Motion hover effects

## 📱 Features Breakdown

### Network Animation

Custom canvas-based particle system featuring:

- 35 yellow/gold orbs representing network nodes
- Dynamic connection lines between nearby nodes
- Traveling data packets showing network activity
- Optimized for 60fps performance

### Wallet Integration

- Support for 100+ wallets via RainbowKit
- Real-time balance updates
- MetaMask token addition functionality
- Transaction status modals with confetti effects

### Token Operations

- **Buy WELP**: Exchange ETH for WELP tokens at fixed rate
- **Sell WELP**: Exchange WELP tokens back for ETH
- **Add to Wallet**: One-click MetaMask token import
- **Supply Tracking**: Visual progress bar with shimmer effect

## 🚢 Deployment

### Vercel Deployment

```bash
# Build for production
npm run build

# Deploy to Vercel
vercel --prod
```

Or use the Vercel GitHub integration for automatic deployments.

### Contract Deployment

Contracts are already deployed on Sepolia testnet! To deploy your own:

```bash
cd contracts
npx hardhat run scripts/deploy.js --network sepolia
```

## 📄 Project Structure

```
welp-presale-token-sepolia/
├── src/
│   ├── components/
│   │   ├── AnimatedBackground.jsx  # Network animation
│   │   └── [other components]
│   ├── contracts/                  # Contract ABIs
│   ├── App.jsx                     # Main app component
│   └── main.jsx                    # Entry point
├── public/                         # Static assets
├── contracts/                      # Solidity contracts
└── package.json
```

## 🧪 Testing

```bash
# Run tests
npm test

# Test on Sepolia
# 1. Get Sepolia ETH from faucet
# 2. Connect wallet to DApp
# 3. Try buying/selling WELP tokens
# 4. Check success metrics
```

## 📝 License

MIT License - feel free to use this project for learning or building your own presale!

## 🤝 Contributing

This is a bootcamp project, but PRs for bug fixes are always welcome!

## 🔗 Links

- **Welp Network**: [welp.network](https://welp.network)
- **Metana Bootcamp**: [metana.io](https://metana.io)
- **Twitter**: [@jakejohnhello](https://twitter.com/jakejohnhello)

## 🎓 Built By

Jakob Johnson - Metana Web3 Dev Bootcamp Graduate (~March 2026)

---

**⭐ If you found this helpful, consider giving it a star!**
