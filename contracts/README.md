# Pat3on Smart Contracts

This folder contains the smart contracts and token minting utilities for the Pat3on platform.

## 🎯 Primary Network: Ethereum Sepolia Testnet

**For this project, we use Sepolia testnet for all development and testing.**

� **[Complete Sepolia Setup Guide →](./SEPOLIA_SETUP.md)**

## �📦 Quick Setup for Sepolia

### 1. Install Dependencies

```bash
cd contracts
npm install
```

### 2. Configure for Sepolia

```bash
cp .env.example .env
```

Edit `.env` and add:
```env
PRIVATE_KEY=your_wallet_private_key
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY
ETHERSCAN_API_KEY=your_etherscan_api_key
```

**Get Sepolia ETH**: https://sepoliafaucet.com/

### 3. Deploy to Sepolia

```bash
npm run deploy:sepolia
```

### 4. Mint Tokens

```bash
RECIPIENT=0xYourAddress AMOUNT=100000 npm run mint:sepolia
```

✅ **Done!** Your tokens are now on Sepolia testnet!

## 📝 Contract Details

### MockUSDC.sol

- **Symbol**: mUSDC
- **Name**: Mock USDC
- **Decimals**: 6 (same as real USDC)
- **Initial Supply**: 1,000,000 tokens (minted to deployer)

#### Functions

- `mint(address to, uint256 amount)` - Mint tokens to any address (public)
- `faucet()` - Get 1000 tokens instantly
- `burn(uint256 amount)` - Burn your own tokens

**⚠️ TESTING ONLY**: This contract allows anyone to mint tokens. Never use in production!

## 🔧 Development Commands

```bash
# Compile contracts
npm run compile

# Run tests
npm test

# Start local node
npm run node

# Deploy to local network
npm run deploy:local

# Deploy to Sepolia
npm run deploy:sepolia

# Deploy to Mumbai
npm run deploy:mumbai
```

## 📁 Project Structure

```
contracts/
├── contracts/           # Solidity contracts
│   └── MockUSDC.sol    # Test token contract
├── scripts/            # Deployment and utility scripts
│   ├── deployMockUSDC.js
│   └── mintTokens.js
├── test/               # Contract tests
├── deployments/        # Deployment info (auto-generated)
├── hardhat.config.js   # Hardhat configuration
└── package.json
```

## 🌐 Network Configuration

### Local Hardhat Network
- Chain ID: 31337
- RPC: http://127.0.0.1:8545

### Sepolia Testnet
- Chain ID: 11155111
- RPC: Configure in .env
- Faucet: https://sepoliafaucet.com/

### Mumbai Testnet (Polygon)
- Chain ID: 80001
- RPC: Configure in .env
- Faucet: https://faucet.polygon.technology/

## 🎓 Quick Start Guide

### First Time Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Start local blockchain** (Terminal 1)
   ```bash
   npm run node
   ```

3. **Deploy MockUSDC** (Terminal 2)
   ```bash
   npm run deploy:local
   ```

4. **Mint tokens to your wallet**
   ```bash
   npm run mint -- --address YOUR_WALLET_ADDRESS --amount 100000
   ```

5. **Done!** You now have test USDC tokens to use in the platform

## 💡 Tips

- Keep your local node running while testing
- The contract address is saved in `deployments/` folder
- You can mint unlimited tokens for testing
- Use the faucet for quick 1000 token claims
- Check your balance in MetaMask after minting

## 🆘 Troubleshooting

### "Contract address not found"
- Make sure you've deployed the contract first
- Check if the deployment file exists in `deployments/`

### "Insufficient funds"
- Make sure your wallet has enough ETH for gas
- Get testnet ETH from faucets

### "Invalid address"
- Ensure you're using a valid Ethereum address (0x...)
- Address should be 42 characters long

## 📞 Need Help?

Check the main project README or create an issue in the repository.

---

**Happy Testing! 🚀**
