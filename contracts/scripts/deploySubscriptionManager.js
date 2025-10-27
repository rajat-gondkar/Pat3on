const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("\n" + "=".repeat(70));
  console.log("🚀 Deploying SubscriptionManager Contract");
  console.log("=".repeat(70) + "\n");

  // Get deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log("📝 Deploying with account:", deployer.address);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", hre.ethers.formatEther(balance), "ETH\n");

  // Get MockUSDC address from deployment file or env
  let mockUSDCAddress;
  
  const deploymentFile = path.join(
    __dirname,
    `../deployments/MockUSDC-${hre.network.name}.json`
  );

  if (fs.existsSync(deploymentFile)) {
    const deploymentInfo = JSON.parse(fs.readFileSync(deploymentFile, "utf8"));
    mockUSDCAddress = deploymentInfo.contractAddress;
    console.log("📍 MockUSDC address loaded:", mockUSDCAddress);
  } else {
    mockUSDCAddress = process.env.MOCK_USDC_ADDRESS;
    console.log("📍 MockUSDC address from env:", mockUSDCAddress);
  }

  if (!mockUSDCAddress || mockUSDCAddress === "") {
    console.log("❌ Error: MockUSDC address not found!");
    console.log("   Please deploy MockUSDC first or set MOCK_USDC_ADDRESS in .env");
    process.exit(1);
  }

  console.log("\n📦 Deploying SubscriptionManager...");
  const SubscriptionManager = await hre.ethers.getContractFactory("SubscriptionManager");
  const subscriptionManager = await SubscriptionManager.deploy(mockUSDCAddress);

  await subscriptionManager.waitForDeployment();
  const contractAddress = await subscriptionManager.getAddress();

  console.log("✅ SubscriptionManager deployed to:", contractAddress);
  console.log("💳 Payment token (MockUSDC):", mockUSDCAddress);

  // Save deployment info
  const deploymentInfo = {
    network: hre.network.name,
    contractName: "SubscriptionManager",
    contractAddress: contractAddress,
    paymentToken: mockUSDCAddress,
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
    `SubscriptionManager-${hre.network.name}.json`
  );

  fs.writeFileSync(outputFile, JSON.stringify(deploymentInfo, null, 2));

  console.log("\n💾 Deployment info saved to:", outputFile);

  // Update .env file with contract address
  const envPath = path.join(__dirname, "../.env");
  if (fs.existsSync(envPath)) {
    let envContent = fs.readFileSync(envPath, "utf8");
    
    if (envContent.includes("SUBSCRIPTION_MANAGER_ADDRESS=")) {
      envContent = envContent.replace(
        /SUBSCRIPTION_MANAGER_ADDRESS=.*/,
        `SUBSCRIPTION_MANAGER_ADDRESS=${contractAddress}`
      );
    } else {
      envContent += `\nSUBSCRIPTION_MANAGER_ADDRESS=${contractAddress}\n`;
    }
    
    fs.writeFileSync(envPath, envContent);
    console.log("✅ Updated .env with contract address");
  }

  console.log("\n" + "=".repeat(70));
  console.log("🎉 Deployment Completed Successfully!");
  console.log("=".repeat(70));
  
  console.log("\n📋 Contract Details:");
  console.log("   SubscriptionManager:", contractAddress);
  console.log("   Payment Token:", mockUSDCAddress);
  console.log("   Network:", hre.network.name);
  console.log("   Deployer:", deployer.address);

  console.log("\n📝 Next Steps:");
  console.log("1. Update backend .env with:");
  console.log(`   SUBSCRIPTION_MANAGER_ADDRESS=${contractAddress}`);
  console.log("\n2. Update frontend config with contract address and ABI");
  console.log("\n3. Test the contract:");
  console.log("   - Create a plan");
  console.log("   - Subscribe to the plan");
  console.log("   - Cancel subscription");
  console.log("=".repeat(70) + "\n");

  // Verify on block explorer if not local network
  if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
    console.log("⏳ Waiting 30 seconds before verification...\n");
    await new Promise((resolve) => setTimeout(resolve, 30000));

    try {
      console.log("🔍 Verifying contract on block explorer...");
      await hre.run("verify:verify", {
        address: contractAddress,
        constructorArguments: [mockUSDCAddress],
      });
      console.log("✅ Contract verified successfully!");
    } catch (error) {
      console.log("⚠️  Verification failed:", error.message);
      console.log("   You can verify manually later using:");
      console.log(`   npx hardhat verify --network ${hre.network.name} ${contractAddress} ${mockUSDCAddress}`);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Deployment failed:", error);
    process.exit(1);
  });
