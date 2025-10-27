const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SubscriptionManager", function () {
  let subscriptionManager;
  let mockUSDC;
  let owner;
  let creator;
  let subscriber1;
  let subscriber2;

  const PRICE_PER_MONTH = ethers.parseUnits("10", 6); // 10 USDC (6 decimals)

  beforeEach(async function () {
    [owner, creator, subscriber1, subscriber2] = await ethers.getSigners();

    // Deploy MockUSDC
    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    mockUSDC = await MockUSDC.deploy(1000000); // 1M initial supply
    await mockUSDC.waitForDeployment();

    // Deploy SubscriptionManager
    const SubscriptionManager = await ethers.getContractFactory("SubscriptionManager");
    subscriptionManager = await SubscriptionManager.deploy(await mockUSDC.getAddress());
    await subscriptionManager.waitForDeployment();

    // Mint tokens to subscribers
    await mockUSDC.mint(subscriber1.address, 1000);
    await mockUSDC.mint(subscriber2.address, 1000);
  });

  describe("Deployment", function () {
    it("Should set the correct payment token", async function () {
      expect(await subscriptionManager.paymentToken()).to.equal(await mockUSDC.getAddress());
    });

    it("Should set the correct owner", async function () {
      expect(await subscriptionManager.owner()).to.equal(owner.address);
    });
  });

  describe("Plan Creation", function () {
    it("Should allow creating a plan", async function () {
      const tx = await subscriptionManager.connect(creator).createPlan(
        "Basic Plan",
        "Access to basic features",
        PRICE_PER_MONTH
      );

      await expect(tx)
        .to.emit(subscriptionManager, "PlanCreated")
        .withArgs(1, creator.address, "Basic Plan", PRICE_PER_MONTH);

      const plan = await subscriptionManager.getPlan(1);
      expect(plan.tierName).to.equal("Basic Plan");
      expect(plan.creator).to.equal(creator.address);
      expect(plan.pricePerMonth).to.equal(PRICE_PER_MONTH);
      expect(plan.isActive).to.be.true;
    });

    it("Should fail with empty tier name", async function () {
      await expect(
        subscriptionManager.connect(creator).createPlan("", "Description", PRICE_PER_MONTH)
      ).to.be.revertedWith("Tier name required");
    });

    it("Should fail with zero price", async function () {
      await expect(
        subscriptionManager.connect(creator).createPlan("Plan", "Description", 0)
      ).to.be.revertedWith("Price must be greater than 0");
    });

    it("Should increment plan IDs correctly", async function () {
      await subscriptionManager.connect(creator).createPlan("Plan 1", "Desc 1", PRICE_PER_MONTH);
      await subscriptionManager.connect(creator).createPlan("Plan 2", "Desc 2", PRICE_PER_MONTH);

      const plan1 = await subscriptionManager.getPlan(1);
      const plan2 = await subscriptionManager.getPlan(2);

      expect(plan1.planId).to.equal(1);
      expect(plan2.planId).to.equal(2);
    });
  });

  describe("Plan Updates", function () {
    beforeEach(async function () {
      await subscriptionManager.connect(creator).createPlan(
        "Basic Plan",
        "Description",
        PRICE_PER_MONTH
      );
    });

    it("Should allow creator to update their plan", async function () {
      const newPrice = ethers.parseUnits("15", 6);
      
      await subscriptionManager.connect(creator).updatePlan(1, newPrice, true);

      const plan = await subscriptionManager.getPlan(1);
      expect(plan.pricePerMonth).to.equal(newPrice);
    });

    it("Should allow deactivating a plan", async function () {
      await subscriptionManager.connect(creator).updatePlan(1, PRICE_PER_MONTH, false);

      const plan = await subscriptionManager.getPlan(1);
      expect(plan.isActive).to.be.false;
    });

    it("Should not allow non-creator to update plan", async function () {
      await expect(
        subscriptionManager.connect(subscriber1).updatePlan(1, PRICE_PER_MONTH, true)
      ).to.be.revertedWith("Not plan creator");
    });
  });

  describe("Subscriptions", function () {
    beforeEach(async function () {
      // Creator creates a plan
      await subscriptionManager.connect(creator).createPlan(
        "Basic Plan",
        "Description",
        PRICE_PER_MONTH
      );

      // Subscriber approves token spending
      await mockUSDC.connect(subscriber1).approve(
        await subscriptionManager.getAddress(),
        PRICE_PER_MONTH
      );
    });

    it("Should allow subscribing to a plan", async function () {
      const creatorBalanceBefore = await mockUSDC.balanceOf(creator.address);

      const tx = await subscriptionManager.connect(subscriber1).subscribe(1);

      await expect(tx)
        .to.emit(subscriptionManager, "SubscriptionCreated")
        .withArgs(1, subscriber1.address, creator.address, 1, PRICE_PER_MONTH);

      const creatorBalanceAfter = await mockUSDC.balanceOf(creator.address);
      expect(creatorBalanceAfter - creatorBalanceBefore).to.equal(PRICE_PER_MONTH);

      const subscription = await subscriptionManager.getSubscription(1);
      expect(subscription.subscriber).to.equal(subscriber1.address);
      expect(subscription.planId).to.equal(1);
      expect(subscription.isActive).to.be.true;
    });

    it("Should fail subscribing without token approval", async function () {
      await expect(
        subscriptionManager.connect(subscriber2).subscribe(1)
      ).to.be.reverted;
    });

    it("Should fail subscribing to own plan", async function () {
      await mockUSDC.connect(creator).approve(
        await subscriptionManager.getAddress(),
        PRICE_PER_MONTH
      );

      await expect(
        subscriptionManager.connect(creator).subscribe(1)
      ).to.be.revertedWith("Cannot subscribe to own plan");
    });

    it("Should fail subscribing twice to same plan", async function () {
      await subscriptionManager.connect(subscriber1).subscribe(1);

      await mockUSDC.connect(subscriber1).approve(
        await subscriptionManager.getAddress(),
        PRICE_PER_MONTH
      );

      await expect(
        subscriptionManager.connect(subscriber1).subscribe(1)
      ).to.be.revertedWith("Already subscribed to this plan");
    });

    it("Should fail subscribing to inactive plan", async function () {
      await subscriptionManager.connect(creator).updatePlan(1, PRICE_PER_MONTH, false);

      await expect(
        subscriptionManager.connect(subscriber1).subscribe(1)
      ).to.be.revertedWith("Plan is not active");
    });

    it("Should increment subscriber count", async function () {
      await subscriptionManager.connect(subscriber1).subscribe(1);

      const plan = await subscriptionManager.getPlan(1);
      expect(plan.subscriberCount).to.equal(1);
    });
  });

  describe("Subscription Cancellation", function () {
    beforeEach(async function () {
      await subscriptionManager.connect(creator).createPlan(
        "Basic Plan",
        "Description",
        PRICE_PER_MONTH
      );

      await mockUSDC.connect(subscriber1).approve(
        await subscriptionManager.getAddress(),
        PRICE_PER_MONTH
      );

      await subscriptionManager.connect(subscriber1).subscribe(1);
    });

    it("Should allow cancelling subscription", async function () {
      const tx = await subscriptionManager.connect(subscriber1).cancelSubscription(1);

      await expect(tx)
        .to.emit(subscriptionManager, "SubscriptionCancelled")
        .withArgs(1, subscriber1.address, 1);

      const subscription = await subscriptionManager.getSubscription(1);
      expect(subscription.isActive).to.be.false;
      expect(subscription.endTime).to.be.gt(0);
    });

    it("Should decrement subscriber count", async function () {
      await subscriptionManager.connect(subscriber1).cancelSubscription(1);

      const plan = await subscriptionManager.getPlan(1);
      expect(plan.subscriberCount).to.equal(0);
    });

    it("Should not allow non-owner to cancel subscription", async function () {
      await expect(
        subscriptionManager.connect(subscriber2).cancelSubscription(1)
      ).to.be.revertedWith("Not subscription owner");
    });

    it("Should fail cancelling already cancelled subscription", async function () {
      await subscriptionManager.connect(subscriber1).cancelSubscription(1);

      await expect(
        subscriptionManager.connect(subscriber1).cancelSubscription(1)
      ).to.be.revertedWith("Subscription already cancelled");
    });
  });

  describe("View Functions", function () {
    beforeEach(async function () {
      await subscriptionManager.connect(creator).createPlan("Plan 1", "Desc 1", PRICE_PER_MONTH);
      await subscriptionManager.connect(creator).createPlan("Plan 2", "Desc 2", PRICE_PER_MONTH);

      await mockUSDC.connect(subscriber1).approve(
        await subscriptionManager.getAddress(),
        PRICE_PER_MONTH * 2n
      );

      await subscriptionManager.connect(subscriber1).subscribe(1);
    });

    it("Should return creator plans", async function () {
      const plans = await subscriptionManager.getCreatorPlans(creator.address);
      expect(plans.length).to.equal(2);
      expect(plans[0]).to.equal(1);
      expect(plans[1]).to.equal(2);
    });

    it("Should return user subscriptions", async function () {
      const subs = await subscriptionManager.getUserSubscriptions(subscriber1.address);
      expect(subs.length).to.equal(1);
      expect(subs[0]).to.equal(1);
    });

    it("Should check if user is subscribed", async function () {
      const isSubbed = await subscriptionManager.isSubscribed(subscriber1.address, 1);
      expect(isSubbed).to.be.true;

      const isNotSubbed = await subscriptionManager.isSubscribed(subscriber2.address, 1);
      expect(isNotSubbed).to.be.false;
    });

    it("Should return total plans count", async function () {
      const total = await subscriptionManager.getTotalPlans();
      expect(total).to.equal(2);
    });

    it("Should return total subscriptions count", async function () {
      const total = await subscriptionManager.getTotalSubscriptions();
      expect(total).to.equal(1);
    });
  });
});
