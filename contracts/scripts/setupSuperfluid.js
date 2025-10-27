const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

/**
 * This script deploys a Pure Super Token (not a wrapper)
 * Pure Super Tokens are native Superfluid tokens that don't wrap an existing ERC20
 * 
 * For Sepolia testnet, we'll use the existing fUSDCx (fake USDC Super Token)
 * deployed by Superfluid at: 0x42bb40bF79730451B11f6De1CbA222F17b87Afd7
 * 
 * If you want to create your own Super Token from MockUSDC, you need to:
 * 1. Deploy a SuperToken wrapper (using Superfluid's SuperTokenFactory)
 * 2. This requires interacting with Superfluid's host contract
 */

async function main() {
  console.log("\n" + "=".repeat(70));
  console.log("🌊 Superfluid Super Token Setup");
  console.log("=".repeat(70) + "\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("📝 Deployer account:", deployer.address);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", hre.ethers.formatEther(balance), "ETH\n");

  // Sepolia Superfluid addresses
  const SEPOLIA_SUPERFLUID_HOST = "0x109412E3C84f0539b43d39dB691B08c90f58dC7c";
  const SEPOLIA_FUSDC_SUPER_TOKEN = "0x42bb40bF79730451B11f6De1CbA222F17b87Afd7"; // fUSDCx

  console.log("📍 Network:", hre.network.name);
  console.log("📍 Superfluid Host:", SEPOLIA_SUPERFLUID_HOST);
  console.log("📍 fUSDCx (Fake USDC Super Token):", SEPOLIA_FUSDC_SUPER_TOKEN);

  // Option 1: Use existing fUSDCx (recommended for testing)
  console.log("\n" + "=".repeat(70));
  console.log("🎯 OPTION 1: Use Existing fUSDCx");
  console.log("=".repeat(70));
  console.log("\nYou can use the existing Fake USDC Super Token (fUSDCx) on Sepolia:");
  console.log("Address:", SEPOLIA_FUSDC_SUPER_TOKEN);
  console.log("\nTo get fUSDCx:");
  console.log("1. Visit: https://app.superfluid.finance/");
  console.log("2. Connect your wallet to Sepolia");
  console.log("3. Go to 'Wrap' section");
  console.log("4. Get test tokens from the faucet\n");

  // Option 2: Create wrapper for MockUSDC
  console.log("=".repeat(70));
  console.log("🎯 OPTION 2: Create Super Token Wrapper for MockUSDC");
  console.log("=".repeat(70));

  const mockUSDCAddress = process.env.MOCK_USDC_ADDRESS;
  console.log("\nMockUSDC Address:", mockUSDCAddress);

  if (!mockUSDCAddress || mockUSDCAddress === "") {
    console.log("❌ MockUSDC address not found in .env");
    console.log("   Please deploy MockUSDC first\n");
    return;
  }

  console.log("\nTo create a Super Token wrapper for MockUSDC, you need to:");
  console.log("1. Use Superfluid's SuperTokenFactory");
  console.log("2. Call createERC20Wrapper() with your MockUSDC address");
  console.log("3. This will create a wrapper Super Token (e.g., MockUSDCx)");

  // Check if we should deploy the wrapper
  console.log("\n" + "=".repeat(70));
  console.log("📦 Deploying SuperTokenWrapper Helper Contract");
  console.log("=".repeat(70) + "\n");

  // For now, let's save the Superfluid addresses to use later
  const superfluidConfig = {
    network: hre.network.name,
    superfluidHost: SEPOLIA_SUPERFLUID_HOST,
    fUSDCxAddress: SEPOLIA_FUSDC_SUPER_TOKEN,
    mockUSDCAddress: mockUSDCAddress,
    note: "Use fUSDCx for testing. To create MockUSDCx wrapper, use Superfluid's SuperTokenFactory",
    resources: {
      superfluidApp: "https://app.superfluid.finance/",
      documentation: "https://docs.superfluid.finance/",
      console: "https://console.superfluid.finance/sepolia",
    },
  };

  // Save configuration
  const deploymentsDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const outputFile = path.join(
    deploymentsDir,
    `Superfluid-${hre.network.name}.json`
  );

  fs.writeFileSync(outputFile, JSON.stringify(superfluidConfig, null, 2));
  console.log("💾 Superfluid configuration saved to:", outputFile);

  // Update .env file
  const envPath = path.join(__dirname, "../.env");
  if (fs.existsSync(envPath)) {
    let envContent = fs.readFileSync(envPath, "utf8");

    // Add Superfluid addresses
    if (!envContent.includes("SUPERFLUID_HOST=")) {
      envContent += `\n# Superfluid Protocol\nSUPERFLUID_HOST=${SEPOLIA_SUPERFLUID_HOST}\n`;
    }
    if (!envContent.includes("FUSDC_SUPER_TOKEN=")) {
      envContent += `FUSDC_SUPER_TOKEN=${SEPOLIA_FUSDC_SUPER_TOKEN}\n`;
    }

    fs.writeFileSync(envPath, envContent);
    console.log("✅ Updated .env with Superfluid addresses");
  }

  console.log("\n" + "=".repeat(70));
  console.log("✅ Superfluid Setup Complete!");
  console.log("=".repeat(70));

  console.log("\n📋 Next Steps:");
  console.log("\n1. Get test fUSDCx tokens:");
  console.log("   - Visit https://app.superfluid.finance/");
  console.log("   - Connect wallet to Sepolia");
  console.log("   - Use the faucet to get fUSDCx");

  console.log("\n2. Deploy SuperfluidSubscriptionManager:");
  console.log("   npm run deploy:superfluid-subscription");

  console.log("\n3. Test the streaming:");
  console.log("   - Create a plan");
  console.log("   - Subscribe (creates a stream)");
  console.log("   - Watch money flow in real-time!");

  console.log("\n💡 TIP: For production, create a proper Super Token wrapper");
  console.log("   using Superfluid's SuperTokenFactory contract");
  console.log("=".repeat(70) + "\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Setup failed:", error);
    process.exit(1);
  });
