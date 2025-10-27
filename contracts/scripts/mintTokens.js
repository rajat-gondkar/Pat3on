const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

/**
 * Script to mint MockUSDC tokens to any address
 * 
 * Usage:
 * RECIPIENT=0x123... AMOUNT=10000 npm run mint
 * or
 * npm run mint (will mint to deployer address)
 */

async function main() {
  console.log("\n" + "=".repeat(60));
  console.log("🪙  MockUSDC Token Minting Script");
  console.log("=".repeat(60) + "\n");

  // Get environment variables
  let recipientAddress = process.env.RECIPIENT;
  let amount = process.env.AMOUNT;

  // Try to load deployment info
  const deploymentFile = path.join(
    __dirname,
    `../deployments/MockUSDC-${hre.network.name}.json`
  );

  let tokenAddress;

  if (fs.existsSync(deploymentFile)) {
    const deploymentInfo = JSON.parse(fs.readFileSync(deploymentFile, "utf8"));
    tokenAddress = deploymentInfo.contractAddress;
    console.log("📍 Token address loaded from deployment file");
  } else {
    // Try to get from environment variable
    tokenAddress = process.env.MOCK_USDC_ADDRESS;
    if (!tokenAddress) {
      console.log("❌ Error: MockUSDC contract address not found!");
      console.log("   Please either:");
      console.log("   1. Deploy the contract first: npm run deploy:local");
      console.log("   2. Or set MOCK_USDC_ADDRESS in your .env file");
      process.exit(1);
    }
  }

  console.log("🎯 MockUSDC Contract:", tokenAddress);
  console.log("🌐 Network:", hre.network.name);

  // Get signer
  const [signer] = await hre.ethers.getSigners();
  console.log("📝 Minting from account:", signer.address);

  // Connect to contract
  const MockUSDC = await hre.ethers.getContractFactory("MockUSDC");
  const mockUSDC = MockUSDC.attach(tokenAddress);

  // Get token info
  const symbol = await mockUSDC.symbol();
  const decimals = await mockUSDC.decimals();

  console.log("💎 Token:", await mockUSDC.name(), `(${symbol})`);
  console.log("\n" + "-".repeat(60) + "\n");

  // Interactive mode if no address provided
  if (!recipientAddress) {
    console.log("🤔 No recipient address provided.");
    console.log("\nℹ️  To mint to a specific address, run:");
    console.log("   RECIPIENT=0x... AMOUNT=10000 npm run mint\n");

    // Default: mint to signer
    recipientAddress = signer.address;
    console.log(`📬 Defaulting to signer address: ${recipientAddress}`);
  }

  // Validate address
  if (!hre.ethers.isAddress(recipientAddress)) {
    console.log("❌ Error: Invalid Ethereum address!");
    process.exit(1);
  }

  // Default amount if not provided
  if (!amount) {
    amount = "1000";
    console.log(`💰 No amount specified, using default: ${amount} ${symbol}`);
  }

  console.log("\n📋 Minting Details:");
  console.log("   Recipient:", recipientAddress);
  console.log("   Amount:", amount, symbol);

  // Check balance before minting
  const balanceBefore = await mockUSDC.balanceOf(recipientAddress);
  console.log("   Balance Before:", hre.ethers.formatUnits(balanceBefore, decimals), symbol);

  console.log("\n⏳ Minting tokens...");

  try {
    // Mint tokens
    const tx = await mockUSDC.mint(recipientAddress, amount);
    console.log("📤 Transaction sent:", tx.hash);
    console.log("⏳ Waiting for confirmation...");
    
    const receipt = await tx.wait();
    console.log("✅ Transaction confirmed in block:", receipt.blockNumber);

    // Check balance after minting
    const balanceAfter = await mockUSDC.balanceOf(recipientAddress);
    console.log("\n💰 Balance After:", hre.ethers.formatUnits(balanceAfter, decimals), symbol);
    console.log("✨ Minted:", hre.ethers.formatUnits(balanceAfter - balanceBefore, decimals), symbol);

    console.log("\n" + "=".repeat(60));
    console.log("🎉 Tokens minted successfully!");
    console.log("=".repeat(60) + "\n");

    // Show total supply
    const totalSupply = await mockUSDC.totalSupply();
    console.log("📊 Total Supply:", hre.ethers.formatUnits(totalSupply, decimals), symbol);
    console.log("\n✅ Done!\n");

  } catch (error) {
    console.log("\n❌ Error minting tokens:", error.message);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Script failed:", error);
    process.exit(1);
  });
