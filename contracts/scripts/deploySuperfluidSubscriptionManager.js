const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("\n" + "=".repeat(70));
  console.log("🌊 Deploying SuperfluidSubscriptionManager Contract");
  console.log("=".repeat(70) + "\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("📝 Deploying with account:", deployer.address);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", hre.ethers.formatEther(balance), "ETH\n");

  // Get Super Token address (fUSDCx on Sepolia)
  let superTokenAddress;

  const superfluidConfigFile = path.join(
    __dirname,
    `../deployments/Superfluid-${hre.network.name}.json`
  );

  if (fs.existsSync(superfluidConfigFile)) {
    const config = JSON.parse(fs.readFileSync(superfluidConfigFile, "utf8"));
    superTokenAddress = config.fUSDCxAddress;
    console.log("📍 Super Token (fUSDCx) address loaded:", superTokenAddress);
  } else {
    superTokenAddress = process.env.FUSDC_SUPER_TOKEN;
    console.log("📍 Super Token address from env:", superTokenAddress);
  }

  if (!superTokenAddress || superTokenAddress === "") {
    console.log("❌ Error: Super Token address not found!");
    console.log("   Please run: npm run setup:superfluid");
    console.log("   Or set FUSDC_SUPER_TOKEN in .env");
    process.exit(1);
  }

  console.log("\n📦 Deploying SuperfluidSubscriptionManager...");
  const SuperfluidSubscriptionManager = await hre.ethers.getContractFactory(
    "SuperfluidSubscriptionManager"
  );
  const subscriptionManager = await SuperfluidSubscriptionManager.deploy(
    superTokenAddress
  );

  await subscriptionManager.waitForDeployment();
  const contractAddress = await subscriptionManager.getAddress();

  console.log("✅ SuperfluidSubscriptionManager deployed to:", contractAddress);
  console.log("💳 Payment token (Super Token):", superTokenAddress);

  // Save deployment info
  const deploymentInfo = {
    network: hre.network.name,
    contractName: "SuperfluidSubscriptionManager",
    contractAddress: contractAddress,
    paymentToken: superTokenAddress,
    deployer: deployer.address,
    deployedAt: new Date().toISOString(),
    transactionHash: subscriptionManager.deploymentTransaction().hash,
  };

  // Save to deployments directory
  const deploymentsDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const outputFile = path.join(
    deploymentsDir,
    `SuperfluidSubscriptionManager-${hre.network.name}.json`
  );

  fs.writeFileSync(outputFile, JSON.stringify(deploymentInfo, null, 2));
  console.log("\n💾 Deployment info saved to:", outputFile);

  // Update .env file
  const envPath = path.join(__dirname, "../.env");
  if (fs.existsSync(envPath)) {
    let envContent = fs.readFileSync(envPath, "utf8");

    if (envContent.includes("SUPERFLUID_SUBSCRIPTION_MANAGER=")) {
      envContent = envContent.replace(
        /SUPERFLUID_SUBSCRIPTION_MANAGER=.*/,
        `SUPERFLUID_SUBSCRIPTION_MANAGER=${contractAddress}`
      );
    } else {
      envContent += `\nSUPERFLUID_SUBSCRIPTION_MANAGER=${contractAddress}\n`;
    }

    fs.writeFileSync(envPath, envContent);
    console.log("✅ Updated .env with contract address");
  }

  console.log("\n" + "=".repeat(70));
  console.log("🎉 Deployment Completed Successfully!");
  console.log("=".repeat(70));

  console.log("\n📋 Contract Details:");
  console.log("   SuperfluidSubscriptionManager:", contractAddress);
  console.log("   Payment Token (fUSDCx):", superTokenAddress);
  console.log("   Network:", hre.network.name);
  console.log("   Deployer:", deployer.address);

  console.log("\n📝 How to Test:");
  console.log("\n1. Get fUSDCx tokens:");
  console.log("   - Visit https://app.superfluid.finance/");
  console.log("   - Connect to Sepolia");
  console.log("   - Get test fUSDCx from faucet");

  console.log("\n2. Create a subscription plan:");
  console.log("   - Call createPlan() with:");
  console.log("     * tierName: 'Premium'");
  console.log("     * description: 'Premium access'");
  console.log("     * pricePerMonth: 10000000 (10 fUSDCx)");

  console.log("\n3. Subscribe to a plan:");
  console.log("   - User calls subscribe(planId)");
  console.log("   - This creates a Superfluid stream");
  console.log("   - Money flows automatically!");

  console.log("\n4. Watch the stream:");
  console.log("   - Visit https://console.superfluid.finance/sepolia");
  console.log("   - Enter your wallet address");
  console.log("   - See your active streams");

  console.log("\n5. Cancel subscription:");
  console.log("   - Call cancelSubscription(subscriptionId)");
  console.log("   - Stream stops immediately");

  console.log("\n💰 Flow Rate Calculation:");
  console.log("   $10/month = 10000000 tokens/month");
  console.log("   = 10000000 / 2592000 seconds");
  console.log("   ≈ 3.858 tokens/second");

  console.log("\n🔗 Useful Links:");
  console.log("   Superfluid App: https://app.superfluid.finance/");
  console.log("   Console: https://console.superfluid.finance/sepolia");
  console.log("   Docs: https://docs.superfluid.finance/");

  console.log("=".repeat(70) + "\n");

  // Verify on block explorer if not local network
  if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
    console.log("⏳ Waiting 30 seconds before verification...\n");
    await new Promise((resolve) => setTimeout(resolve, 30000));

    try {
      console.log("🔍 Verifying contract on block explorer...");
      await hre.run("verify:verify", {
        address: contractAddress,
        constructorArguments: [superTokenAddress],
      });
      console.log("✅ Contract verified successfully!");
    } catch (error) {
      console.log("⚠️  Verification failed:", error.message);
      console.log("   You can verify manually later using:");
      console.log(
        `   npx hardhat verify --network ${hre.network.name} ${contractAddress} ${superTokenAddress}`
      );
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Deployment failed:", error);
    process.exit(1);
  });
