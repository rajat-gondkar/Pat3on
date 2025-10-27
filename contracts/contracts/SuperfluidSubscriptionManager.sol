// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ISuperfluid, ISuperToken, ISuperApp} from "@superfluid-finance/ethereum-contracts/contracts/interfaces/superfluid/ISuperfluid.sol";
import {SuperTokenV1Library} from "@superfluid-finance/ethereum-contracts/contracts/apps/SuperTokenV1Library.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title SuperfluidSubscriptionManager
 * @notice Manages subscription plans with Superfluid real-time streaming payments
 * @dev Uses Superfluid's money streaming for automatic subscription payments
 */
contract SuperfluidSubscriptionManager is Ownable {
    using SuperTokenV1Library for ISuperToken;

    // Superfluid Super Token (e.g., USDCx)
    ISuperToken public immutable paymentToken;

    // Subscription plan structure
    struct Plan {
        uint256 planId;
        address creator;
        string tierName;
        string description;
        int96 flowRate; // Flow rate in tokens per second (Superfluid format)
        uint256 pricePerMonth; // For display purposes (in base units)
        bool isActive;
        uint256 subscriberCount;
        uint256 createdAt;
    }

    // Subscription structure
    struct Subscription {
        uint256 subscriptionId;
        uint256 planId;
        address subscriber;
        address creator;
        uint256 startDate;
        bool isActive;
    }

    // State variables
    uint256 public totalPlans;
    uint256 public totalSubscriptions;

    mapping(uint256 => Plan) public plans;
    mapping(uint256 => Subscription) public subscriptions;
    mapping(address => uint256[]) public creatorPlans; // creator => planIds
    mapping(address => uint256[]) public userSubscriptions; // user => subscriptionIds
    mapping(address => mapping(uint256 => bool)) public isSubscribed; // user => planId => bool
    mapping(address => mapping(address => uint256)) public activeFlows; // subscriber => creator => subscriptionId

    // Events
    event PlanCreated(
        uint256 indexed planId,
        address indexed creator,
        string tierName,
        int96 flowRate,
        uint256 pricePerMonth
    );

    event PlanUpdated(
        uint256 indexed planId,
        string tierName,
        int96 flowRate,
        uint256 pricePerMonth,
        bool isActive
    );

    event SubscriptionCreated(
        uint256 indexed subscriptionId,
        uint256 indexed planId,
        address indexed subscriber,
        address creator,
        int96 flowRate
    );

    event SubscriptionCancelled(
        uint256 indexed subscriptionId,
        address indexed subscriber,
        address indexed creator
    );

    /**
     * @notice Constructor
     * @param _paymentToken Address of the Superfluid Super Token (e.g., USDCx)
     */
    constructor(ISuperToken _paymentToken) {
        require(address(_paymentToken) != address(0), "Invalid token address");
        paymentToken = _paymentToken;
    }

    /**
     * @notice Create a new subscription plan
     * @param _tierName Name of the subscription tier
     * @param _description Description of the plan
     * @param _pricePerMonth Price in base units (e.g., for 10 USDC = 10000000)
     * @return planId The ID of the created plan
     */
    function createPlan(
        string memory _tierName,
        string memory _description,
        uint256 _pricePerMonth
    ) external returns (uint256) {
        require(bytes(_tierName).length > 0, "Tier name cannot be empty");
        require(_pricePerMonth > 0, "Price must be greater than 0");

        // Calculate flow rate: pricePerMonth / (30 days in seconds)
        // flowRate = price / (30 * 24 * 60 * 60) = price / 2592000
        int96 flowRate = int96(int256(_pricePerMonth / 2592000));
        require(flowRate > 0, "Flow rate must be positive");

        totalPlans++;
        uint256 planId = totalPlans;

        plans[planId] = Plan({
            planId: planId,
            creator: msg.sender,
            tierName: _tierName,
            description: _description,
            flowRate: flowRate,
            pricePerMonth: _pricePerMonth,
            isActive: true,
            subscriberCount: 0,
            createdAt: block.timestamp
        });

        creatorPlans[msg.sender].push(planId);

        emit PlanCreated(planId, msg.sender, _tierName, flowRate, _pricePerMonth);

        return planId;
    }

    /**
     * @notice Update an existing plan
     * @param _planId ID of the plan to update
     * @param _tierName New tier name
     * @param _description New description
     * @param _pricePerMonth New price per month
     * @param _isActive Whether the plan is active
     */
    function updatePlan(
        uint256 _planId,
        string memory _tierName,
        string memory _description,
        uint256 _pricePerMonth,
        bool _isActive
    ) external {
        Plan storage plan = plans[_planId];
        require(plan.planId != 0, "Plan does not exist");
        require(plan.creator == msg.sender, "Only creator can update plan");
        require(bytes(_tierName).length > 0, "Tier name cannot be empty");
        require(_pricePerMonth > 0, "Price must be greater than 0");

        int96 newFlowRate = int96(int256(_pricePerMonth / 2592000));
        require(newFlowRate > 0, "Flow rate must be positive");

        plan.tierName = _tierName;
        plan.description = _description;
        plan.flowRate = newFlowRate;
        plan.pricePerMonth = _pricePerMonth;
        plan.isActive = _isActive;

        emit PlanUpdated(_planId, _tierName, newFlowRate, _pricePerMonth, _isActive);
    }

    /**
     * @notice Subscribe to a plan by creating a Superfluid stream
     * @param _planId ID of the plan to subscribe to
     * @return subscriptionId The ID of the created subscription
     */
    function subscribe(uint256 _planId) external returns (uint256) {
        Plan storage plan = plans[_planId];
        require(plan.planId != 0, "Plan does not exist");
        require(plan.isActive, "Plan is not active");
        require(msg.sender != plan.creator, "Cannot subscribe to own plan");
        require(!isSubscribed[msg.sender][_planId], "Already subscribed to this plan");
        require(activeFlows[msg.sender][plan.creator] == 0, "Already streaming to this creator");

        // Create Superfluid stream from subscriber to creator
        paymentToken.createFlow(plan.creator, plan.flowRate);

        totalSubscriptions++;
        uint256 subscriptionId = totalSubscriptions;

        subscriptions[subscriptionId] = Subscription({
            subscriptionId: subscriptionId,
            planId: _planId,
            subscriber: msg.sender,
            creator: plan.creator,
            startDate: block.timestamp,
            isActive: true
        });

        userSubscriptions[msg.sender].push(subscriptionId);
        isSubscribed[msg.sender][_planId] = true;
        activeFlows[msg.sender][plan.creator] = subscriptionId;
        plan.subscriberCount++;

        emit SubscriptionCreated(
            subscriptionId,
            _planId,
            msg.sender,
            plan.creator,
            plan.flowRate
        );

        return subscriptionId;
    }

    /**
     * @notice Cancel a subscription by deleting the Superfluid stream
     * @param _subscriptionId ID of the subscription to cancel
     */
    function cancelSubscription(uint256 _subscriptionId) external {
        Subscription storage subscription = subscriptions[_subscriptionId];
        require(subscription.subscriptionId != 0, "Subscription does not exist");
        require(subscription.subscriber == msg.sender, "Not the subscriber");
        require(subscription.isActive, "Subscription already cancelled");

        Plan storage plan = plans[subscription.planId];

        // Delete Superfluid stream
        paymentToken.deleteFlow(msg.sender, subscription.creator);

        subscription.isActive = false;
        isSubscribed[msg.sender][subscription.planId] = false;
        activeFlows[msg.sender][subscription.creator] = 0;
        plan.subscriberCount--;

        emit SubscriptionCancelled(_subscriptionId, msg.sender, subscription.creator);
    }

    // ================================
    // VIEW FUNCTIONS
    // ================================

    /**
     * @notice Get plan details
     */
    function getPlan(uint256 _planId) external view returns (Plan memory) {
        require(plans[_planId].planId != 0, "Plan does not exist");
        return plans[_planId];
    }

    /**
     * @notice Get all plan IDs for a creator
     */
    function getCreatorPlans(address _creator) external view returns (uint256[] memory) {
        return creatorPlans[_creator];
    }

    /**
     * @notice Get subscription details
     */
    function getSubscription(uint256 _subscriptionId)
        external
        view
        returns (Subscription memory)
    {
        require(subscriptions[_subscriptionId].subscriptionId != 0, "Subscription does not exist");
        return subscriptions[_subscriptionId];
    }

    /**
     * @notice Get all subscription IDs for a user
     */
    function getUserSubscriptions(address _user) external view returns (uint256[] memory) {
        return userSubscriptions[_user];
    }

    /**
     * @notice Check if user is subscribed to a plan
     */
    function checkSubscription(address _user, uint256 _planId) external view returns (bool) {
        return isSubscribed[_user][_planId];
    }

    /**
     * @notice Get the current flow rate from subscriber to creator
     * @param _subscriber Subscriber address
     * @param _creator Creator address
     * @return flowRate Current flow rate
     */
    function getFlowRate(address _subscriber, address _creator)
        external
        view
        returns (int96 flowRate)
    {
        return paymentToken.getFlowRate(_subscriber, _creator);
    }

    /**
     * @notice Get net flow rate for an account (incoming - outgoing)
     * @param _account Account address
     * @return flowRate Net flow rate
     */
    function getNetFlowRate(address _account) external view returns (int96 flowRate) {
        return paymentToken.getNetFlowRate(_account);
    }

    /**
     * @notice Convert price per month to flow rate (helper for frontend)
     * @param _pricePerMonth Price in base units
     * @return flowRate Flow rate in tokens per second
     */
    function calculateFlowRate(uint256 _pricePerMonth) public pure returns (int96) {
        return int96(int256(_pricePerMonth / 2592000));
    }

    /**
     * @notice Convert flow rate to price per month (helper for frontend)
     * @param _flowRate Flow rate in tokens per second
     * @return pricePerMonth Price in base units
     */
    function calculatePricePerMonth(int96 _flowRate) public pure returns (uint256) {
        return uint256(uint96(_flowRate)) * 2592000;
    }
}
