// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title SubscriptionManager
 * @dev Manages subscription plans and payments for creators
 * @notice This contract handles creator plans and subscription logic
 * 
 * NOTE: This version uses simple token transfers for now.
 * Superfluid streaming will be integrated in the next version.
 */
contract SubscriptionManager is Ownable {
    
    // Payment token (MockUSDC)
    IERC20 public paymentToken;
    
    // Plan counter for unique IDs
    uint256 private planIdCounter;
    
    // Subscription counter
    uint256 private subscriptionIdCounter;
    
    struct Plan {
        uint256 planId;
        address creator;
        string tierName;
        string description;
        uint256 pricePerMonth; // in tokens (with decimals)
        bool isActive;
        uint256 subscriberCount;
        uint256 createdAt;
    }
    
    struct Subscription {
        uint256 subscriptionId;
        address subscriber;
        address creator;
        uint256 planId;
        uint256 startTime;
        uint256 endTime; // 0 means active
        uint256 lastPayment;
        bool isActive;
    }
    
    // Mappings
    mapping(uint256 => Plan) public plans;
    mapping(address => uint256[]) public creatorPlans;
    mapping(uint256 => Subscription) public subscriptions;
    mapping(address => uint256[]) public userSubscriptions;
    mapping(bytes32 => bool) public activeSubscriptionKeys; // keccak256(subscriber, planId)
    
    // Events
    event PlanCreated(
        uint256 indexed planId,
        address indexed creator,
        string tierName,
        uint256 pricePerMonth
    );
    
    event PlanUpdated(
        uint256 indexed planId,
        uint256 newPrice,
        bool isActive
    );
    
    event SubscriptionCreated(
        uint256 indexed subscriptionId,
        address indexed subscriber,
        address indexed creator,
        uint256 planId,
        uint256 amount
    );
    
    event SubscriptionCancelled(
        uint256 indexed subscriptionId,
        address indexed subscriber,
        uint256 planId
    );
    
    event PaymentProcessed(
        uint256 indexed subscriptionId,
        address indexed subscriber,
        address indexed creator,
        uint256 amount
    );
    
    event FundsWithdrawn(
        address indexed creator,
        uint256 amount
    );
    
    constructor(address _paymentToken) {
        require(_paymentToken != address(0), "Invalid token address");
        paymentToken = IERC20(_paymentToken);
        planIdCounter = 1;
        subscriptionIdCounter = 1;
    }
    
    /**
     * @dev Create a new subscription plan
     * @param _tierName Name of the subscription tier
     * @param _description Description of the plan
     * @param _pricePerMonth Monthly price in tokens
     */
    function createPlan(
        string memory _tierName,
        string memory _description,
        uint256 _pricePerMonth
    ) external returns (uint256) {
        require(bytes(_tierName).length > 0, "Tier name required");
        require(_pricePerMonth > 0, "Price must be greater than 0");
        
        uint256 planId = planIdCounter++;
        
        plans[planId] = Plan({
            planId: planId,
            creator: msg.sender,
            tierName: _tierName,
            description: _description,
            pricePerMonth: _pricePerMonth,
            isActive: true,
            subscriberCount: 0,
            createdAt: block.timestamp
        });
        
        creatorPlans[msg.sender].push(planId);
        
        emit PlanCreated(planId, msg.sender, _tierName, _pricePerMonth);
        
        return planId;
    }
    
    /**
     * @dev Update plan details
     * @param _planId Plan ID to update
     * @param _newPrice New monthly price
     * @param _isActive Active status
     */
    function updatePlan(
        uint256 _planId,
        uint256 _newPrice,
        bool _isActive
    ) external {
        Plan storage plan = plans[_planId];
        require(plan.creator == msg.sender, "Not plan creator");
        require(plan.planId != 0, "Plan does not exist");
        
        if (_newPrice > 0) {
            plan.pricePerMonth = _newPrice;
        }
        plan.isActive = _isActive;
        
        emit PlanUpdated(_planId, _newPrice, _isActive);
    }
    
    /**
     * @dev Subscribe to a plan (pays for first month)
     * @param _planId Plan ID to subscribe to
     */
    function subscribe(uint256 _planId) external returns (uint256) {
        Plan storage plan = plans[_planId];
        require(plan.planId != 0, "Plan does not exist");
        require(plan.isActive, "Plan is not active");
        require(plan.creator != msg.sender, "Cannot subscribe to own plan");
        
        bytes32 subKey = keccak256(abi.encodePacked(msg.sender, _planId));
        require(!activeSubscriptionKeys[subKey], "Already subscribed to this plan");
        
        // Transfer first month payment
        require(
            paymentToken.transferFrom(msg.sender, plan.creator, plan.pricePerMonth),
            "Payment transfer failed"
        );
        
        uint256 subscriptionId = subscriptionIdCounter++;
        
        subscriptions[subscriptionId] = Subscription({
            subscriptionId: subscriptionId,
            subscriber: msg.sender,
            creator: plan.creator,
            planId: _planId,
            startTime: block.timestamp,
            endTime: 0,
            lastPayment: block.timestamp,
            isActive: true
        });
        
        userSubscriptions[msg.sender].push(subscriptionId);
        activeSubscriptionKeys[subKey] = true;
        plan.subscriberCount++;
        
        emit SubscriptionCreated(subscriptionId, msg.sender, plan.creator, _planId, plan.pricePerMonth);
        emit PaymentProcessed(subscriptionId, msg.sender, plan.creator, plan.pricePerMonth);
        
        return subscriptionId;
    }
    
    /**
     * @dev Process monthly payment for active subscription
     * @param _subscriptionId Subscription ID
     */
    function processMonthlyPayment(uint256 _subscriptionId) external {
        Subscription storage sub = subscriptions[_subscriptionId];
        require(sub.isActive, "Subscription not active");
        require(block.timestamp >= sub.lastPayment + 30 days, "Payment not due yet");
        
        Plan storage plan = plans[sub.planId];
        
        // Transfer monthly payment
        require(
            paymentToken.transferFrom(sub.subscriber, sub.creator, plan.pricePerMonth),
            "Payment transfer failed"
        );
        
        sub.lastPayment = block.timestamp;
        
        emit PaymentProcessed(_subscriptionId, sub.subscriber, sub.creator, plan.pricePerMonth);
    }
    
    /**
     * @dev Cancel an active subscription
     * @param _subscriptionId Subscription ID to cancel
     */
    function cancelSubscription(uint256 _subscriptionId) external {
        Subscription storage sub = subscriptions[_subscriptionId];
        require(sub.subscriber == msg.sender, "Not subscription owner");
        require(sub.isActive, "Subscription already cancelled");
        
        sub.isActive = false;
        sub.endTime = block.timestamp;
        
        bytes32 subKey = keccak256(abi.encodePacked(sub.subscriber, sub.planId));
        activeSubscriptionKeys[subKey] = false;
        
        Plan storage plan = plans[sub.planId];
        if (plan.subscriberCount > 0) {
            plan.subscriberCount--;
        }
        
        emit SubscriptionCancelled(_subscriptionId, msg.sender, sub.planId);
    }
    
    /**
     * @dev Get plan details
     * @param _planId Plan ID
     */
    function getPlan(uint256 _planId) external view returns (Plan memory) {
        require(plans[_planId].planId != 0, "Plan does not exist");
        return plans[_planId];
    }
    
    /**
     * @dev Get all plans for a creator
     * @param _creator Creator address
     */
    function getCreatorPlans(address _creator) external view returns (uint256[] memory) {
        return creatorPlans[_creator];
    }
    
    /**
     * @dev Get subscription details
     * @param _subscriptionId Subscription ID
     */
    function getSubscription(uint256 _subscriptionId) external view returns (Subscription memory) {
        return subscriptions[_subscriptionId];
    }
    
    /**
     * @dev Get all subscriptions for a user
     * @param _user User address
     */
    function getUserSubscriptions(address _user) external view returns (uint256[] memory) {
        return userSubscriptions[_user];
    }
    
    /**
     * @dev Check if user is subscribed to a plan
     * @param _subscriber Subscriber address
     * @param _planId Plan ID
     */
    function isSubscribed(address _subscriber, uint256 _planId) external view returns (bool) {
        bytes32 subKey = keccak256(abi.encodePacked(_subscriber, _planId));
        return activeSubscriptionKeys[subKey];
    }
    
    /**
     * @dev Get total number of plans
     */
    function getTotalPlans() external view returns (uint256) {
        return planIdCounter - 1;
    }
    
    /**
     * @dev Get total number of subscriptions
     */
    function getTotalSubscriptions() external view returns (uint256) {
        return subscriptionIdCounter - 1;
    }
}
