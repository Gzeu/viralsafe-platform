const { ethers } = require("hardhat");
const fs = require('fs');
const path = require('path');

async function main() {
  console.log("\n🚀 Starting ViralSafe Platform deployment...");
  console.log("=" + "=".repeat(50));

  // Get network info
  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  const balance = await ethers.provider.getBalance(deployer.address);
  
  console.log("\n📊 Deployment Info:");
  console.log("   • Network:", network.name, `(Chain ID: ${network.chainId})`);
  console.log("   • Deployer:", deployer.address);
  console.log("   • Balance:", ethers.formatEther(balance), "ETH/BNB");
  
  if (balance < ethers.parseEther("0.05")) {
    throw new Error("❌ Insufficient balance for deployment. Need at least 0.05 BNB/ETH");
  }

  console.log("\n⏳ Deploying contracts...");
  
  // Treasury wallet (for initial deployment, use deployer)
  const treasuryWallet = deployer.address;
  console.log("   • Treasury Wallet:", treasuryWallet);

  // Deploy SAFE Token
  console.log("\n1️⃣  Deploying SAFE Token...");
  const SAFETokenFactory = await ethers.getContractFactory("SAFEToken");
  const safeToken = await SAFETokenFactory.deploy(
    deployer.address, // owner
    treasuryWallet    // treasury
  );
  
  await safeToken.waitForDeployment();
  const safeTokenAddress = await safeToken.getAddress();
  
  console.log("   ✅ SAFE Token deployed to:", safeTokenAddress);
  
  // Verify deployment
  const totalSupply = await safeToken.totalSupply();
  const tokenName = await safeToken.name();
  const tokenSymbol = await safeToken.symbol();
  
  console.log("   • Name:", tokenName);
  console.log("   • Symbol:", tokenSymbol);
  console.log("   • Total Supply:", ethers.formatEther(totalSupply), "SAFE");
  console.log("   • Owner:", await safeToken.owner());

  // Deploy ViralNFT
  console.log("\n2️⃣  Deploying ViralNFT...");
  const ViralNFTFactory = await ethers.getContractFactory("ViralNFT");
  const viralNFT = await ViralNFTFactory.deploy(
    safeTokenAddress,  // SAFE token address
    deployer.address   // owner
  );
  
  await viralNFT.waitForDeployment();
  const viralNFTAddress = await viralNFT.getAddress();
  
  console.log("   ✅ ViralNFT deployed to:", viralNFTAddress);
  
  // Verify NFT deployment
  const nftName = await viralNFT.name();
  const nftSymbol = await viralNFT.symbol();
  
  console.log("   • Name:", nftName);
  console.log("   • Symbol:", nftSymbol);
  console.log("   • Owner:", await viralNFT.owner());

  // Link contracts
  console.log("\n3️⃣  Linking contracts...");
  const linkTx = await safeToken.setViralNFTContract(viralNFTAddress);
  await linkTx.wait();
  console.log("   ✅ Contracts linked successfully");

  // Create deployment info
  const deploymentInfo = {
    network: {
      name: network.name,
      chainId: Number(network.chainId),
      deployed: new Date().toISOString()
    },
    contracts: {
      SAFEToken: {
        address: safeTokenAddress,
        name: tokenName,
        symbol: tokenSymbol,
        totalSupply: ethers.formatEther(totalSupply),
        owner: await safeToken.owner()
      },
      ViralNFT: {
        address: viralNFTAddress,
        name: nftName,
        symbol: nftSymbol,
        owner: await viralNFT.owner()
      }
    },
    deployer: {
      address: deployer.address,
      balance: ethers.formatEther(balance)
    },
    gasUsed: {
      // Gas tracking would be added here
    }
  };

  // Save deployment info
  const networkName = network.name === 'unknown' ? 
    (network.chainId === 97n ? 'bscTestnet' : 
     network.chainId === 56n ? 'bsc' : 'localhost') : 
    network.name;
    
  const deploymentsDir = path.join(__dirname, '..', 'deployments', networkName);
  
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  // Save individual contract files
  fs.writeFileSync(
    path.join(deploymentsDir, 'SAFEToken.json'),
    JSON.stringify({
      address: safeTokenAddress,
      abi: SAFETokenFactory.interface.format('json'),
      name: tokenName,
      symbol: tokenSymbol,
      totalSupply: ethers.formatEther(totalSupply),
      deployedAt: new Date().toISOString()
    }, null, 2)
  );

  fs.writeFileSync(
    path.join(deploymentsDir, 'ViralNFT.json'),
    JSON.stringify({
      address: viralNFTAddress,
      abi: ViralNFTFactory.interface.format('json'),
      name: nftName,
      symbol: nftSymbol,
      deployedAt: new Date().toISOString()
    }, null, 2)
  );

  // Save complete deployment info
  fs.writeFileSync(
    path.join(deploymentsDir, 'deployment.json'),
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log("\n📁 Deployment files saved to:", deploymentsDir);

  // Display summary
  console.log("\n" + "=".repeat(60));
  console.log("🎉 DEPLOYMENT SUCCESSFUL!");
  console.log("=".repeat(60));
  
  console.log("\n📋 Contract Addresses:");
  console.log(`   🪙 SAFE Token:  ${safeTokenAddress}`);
  console.log(`   🎨 ViralNFT:    ${viralNFTAddress}`);
  
  console.log("\n🔗 Verification Commands:");
  console.log(`   npx hardhat verify --network ${networkName} ${safeTokenAddress} "${deployer.address}" "${treasuryWallet}"`);
  console.log(`   npx hardhat verify --network ${networkName} ${viralNFTAddress} "${safeTokenAddress}" "${deployer.address}"`);
  
  console.log("\n🌐 Block Explorer Links:");
  if (network.chainId === 97n) {
    console.log(`   🔍 SAFE Token: https://testnet.bscscan.com/address/${safeTokenAddress}`);
    console.log(`   🔍 ViralNFT: https://testnet.bscscan.com/address/${viralNFTAddress}`);
  } else if (network.chainId === 56n) {
    console.log(`   🔍 SAFE Token: https://bscscan.com/address/${safeTokenAddress}`);
    console.log(`   🔍 ViralNFT: https://bscscan.com/address/${viralNFTAddress}`);
  }
  
  console.log("\n💡 Next Steps:");
  console.log("   1. Verify contracts on BSCScan");
  console.log("   2. Update frontend contract addresses");
  console.log("   3. Test voting and NFT minting functionality");
  console.log("   4. Deploy backend API with contract integration");
  
  console.log("\n✨ Ready for testing!");
}

// Handle deployment errors
main()
  .then(() => {
    console.log("\n🎯 Deployment completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Deployment failed:");
    console.error(error);
    process.exit(1);
  });