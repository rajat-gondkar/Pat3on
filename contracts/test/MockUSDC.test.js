const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MockUSDC Token", function () {
  let mockUSDC;
  let owner;
  let addr1;
  let addr2;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();
    
    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    mockUSDC = await MockUSDC.deploy(1000000); // 1 million initial supply
    await mockUSDC.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the right name and symbol", async function () {
      expect(await mockUSDC.name()).to.equal("Mock USDC");
      expect(await mockUSDC.symbol()).to.equal("mUSDC");
    });

    it("Should have 6 decimals like real USDC", async function () {
      expect(await mockUSDC.decimals()).to.equal(6);
    });

    it("Should mint initial supply to owner", async function () {
      const ownerBalance = await mockUSDC.balanceOf(owner.address);
      const totalSupply = await mockUSDC.totalSupply();
      expect(ownerBalance).to.equal(totalSupply);
    });

    it("Should have correct initial supply", async function () {
      const totalSupply = await mockUSDC.totalSupply();
      expect(totalSupply).to.equal(ethers.parseUnits("1000000", 6));
    });
  });

  describe("Minting", function () {
    it("Should allow anyone to mint tokens", async function () {
      const mintAmount = 1000;
      await mockUSDC.mint(addr1.address, mintAmount);
      
      const balance = await mockUSDC.balanceOf(addr1.address);
      expect(balance).to.equal(ethers.parseUnits(mintAmount.toString(), 6));
    });

    it("Should correctly mint with decimals", async function () {
      await mockUSDC.mint(addr1.address, 100);
      const balance = await mockUSDC.balanceOf(addr1.address);
      expect(balance).to.equal(100000000n); // 100 * 10^6
    });
  });

  describe("Faucet", function () {
    it("Should give 1000 tokens from faucet", async function () {
      await mockUSDC.connect(addr1).faucet();
      
      const balance = await mockUSDC.balanceOf(addr1.address);
      expect(balance).to.equal(ethers.parseUnits("1000", 6));
    });

    it("Should allow multiple faucet calls", async function () {
      await mockUSDC.connect(addr1).faucet();
      await mockUSDC.connect(addr1).faucet();
      
      const balance = await mockUSDC.balanceOf(addr1.address);
      expect(balance).to.equal(ethers.parseUnits("2000", 6));
    });
  });

  describe("Burning", function () {
    it("Should allow users to burn their tokens", async function () {
      await mockUSDC.mint(addr1.address, 1000);
      await mockUSDC.connect(addr1).burn(500);
      
      const balance = await mockUSDC.balanceOf(addr1.address);
      expect(balance).to.equal(ethers.parseUnits("500", 6));
    });
  });

  describe("Transfers", function () {
    it("Should transfer tokens between accounts", async function () {
      await mockUSDC.mint(addr1.address, 1000);
      await mockUSDC.connect(addr1).transfer(addr2.address, ethers.parseUnits("500", 6));
      
      const addr1Balance = await mockUSDC.balanceOf(addr1.address);
      const addr2Balance = await mockUSDC.balanceOf(addr2.address);
      
      expect(addr1Balance).to.equal(ethers.parseUnits("500", 6));
      expect(addr2Balance).to.equal(ethers.parseUnits("500", 6));
    });
  });
});
