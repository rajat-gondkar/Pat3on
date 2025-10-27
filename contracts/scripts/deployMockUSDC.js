const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Starting MockUSDC deployment...\n");

  // Get the deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log("📝 Deploying contracts with account:", deployer.address);
  
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", hre.ethers.formatEther(balance), "ETH\n");

  // Deploy MockUSDC with initial supply of 1,000,000 tokens
  console.log("📦 Deploying MockUSDC token...");
  const MockUSDC = await hre.ethers.getContractFactory("MockUSDC");
  const initialSupply = 1000000; // 1 million tokens
  const mockUSDC = await MockUSDC.deploy(initialSupply);
  
  await mockUSDC.waitForDeployment();
  const tokenAddress = await mockUSDC.getAddress();
  
  console.log("✅ MockUSDC deployed to:", tokenAddress);
  console.log("🪙 Initial supply minted to deployer:", initialSupply, "mUSDC\n");

  // Get token details
  const name = await mockUSDC.name();
  const symbol = await mockUSDC.symbol();
  const decimals = await mockUSDC.decimals();
  const totalSupply = await mockUSDC.totalSupply();
  
  console.log("📊 Token Details:");
  console.log("   Name:", name);
  console.log("   Symbol:", symbol);
  console.log("   Decimals:", decimals.toString());
  console.log("   Total Supply:", hre.ethers.formatUnits(totalSupply, decimals), symbol);
  console.log("   Contract Address:", tokenAddress);

  // Save deployment info
  const deploymentInfo = {
    network: hre.network.name,
    contractName: "MockUSDC",
    contractAddress: tokenAddress,
    deployer: deployer.address,
    deployedAt: new Date().toISOString(),
    transactionHash: mockUSDC.deploymentTransaction().hash,
    tokenDetails: {
      name,
      symbol,
      decimals: decimals.toString(),
      initialSupply: initialSupply.toString()
    }
  };

  // Save to deployments directory
  const deploymentsDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const deploymentFile = path.join(
    deploymentsDir,
    `MockUSDC-${hre.network.name}.json`
  );
  
  fs.writeFileSync(
    deploymentFile,
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log("\n💾 Deployment info saved to:", deploymentFile);
  console.log("\n" + "=".repeat(60));
  console.log("🎉 Deployment completed successfully!");
  console.log("=".repeat(60));
  console.log("\n📝 Next steps:");
  console.log("1. Copy the contract address to your .env file:");
  console.log(`   MOCK_USDC_ADDRESS=${tokenAddress}`);
  console.log("\n2. Mint tokens to your wallet:");
  console.log(`   npm run mint -- --address YOUR_WALLET_ADDRESS --amount 10000`);
  console.log("\n3. Or use the faucet function to get 1000 tokens");
  console.log("=".repeat(60) + "\n");

  // Verify on block explorer if not local network
  if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
    console.log("\n⏳ Waiting 30 seconds before verification...");
    await new Promise(resolve => setTimeout(resolve, 30000));
    
    try {
      console.log("🔍 Verifying contract on block explorer...");
      await hre.run("verify:verify", {
        address: tokenAddress,
        constructorArguments: [initialSupply],
      });
      console.log("✅ Contract verified successfully!");
    } catch (error) {
      console.log("⚠️  Verification failed:", error.message);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
