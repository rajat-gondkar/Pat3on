// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ISuperToken} from "@superfluid-finance/ethereum-contracts/contracts/interfaces/superfluid/ISuperToken.sol";
import {SuperTokenV1Library} from "@superfluid-finance/ethereum-contracts/contracts/apps/SuperTokenV1Library.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title SuperTokenWrapper
 * @notice Helper contract to wrap ERC20 tokens into Superfluid Super Tokens
 * @dev This is a utility contract for easy wrapping/unwrapping
 */
contract SuperTokenWrapper {
    using SuperTokenV1Library for ISuperToken;

    ISuperToken public immutable superToken;
    IERC20 public immutable underlyingToken;

    event Wrapped(address indexed user, uint256 amount);
    event Unwrapped(address indexed user, uint256 amount);

    constructor(ISuperToken _superToken, IERC20 _underlyingToken) {
        superToken = _superToken;
        underlyingToken = _underlyingToken;
    }

    /**
     * @notice Wrap underlying tokens into Super Tokens
     * @param _amount Amount to wrap (in underlying token units)
     */
    function wrap(uint256 _amount) external {
        require(_amount > 0, "Amount must be greater than 0");

        // Transfer underlying tokens from user to this contract
        require(
            underlyingToken.transferFrom(msg.sender, address(this), _amount),
            "Transfer failed"
        );

        // Approve super token to spend underlying tokens
        underlyingToken.approve(address(superToken), _amount);

        // Upgrade (wrap) underlying tokens to super tokens
        ISuperToken(address(superToken)).upgrade(_amount);

        // Transfer super tokens to user
        require(
            superToken.transfer(msg.sender, _amount),
            "Super token transfer failed"
        );

        emit Wrapped(msg.sender, _amount);
    }

    /**
     * @notice Unwrap Super Tokens back to underlying tokens
     * @param _amount Amount to unwrap (in super token units)
     */
    function unwrap(uint256 _amount) external {
        require(_amount > 0, "Amount must be greater than 0");

        // Transfer super tokens from user to this contract
        require(
            superToken.transferFrom(msg.sender, address(this), _amount),
            "Super token transfer failed"
        );

        // Downgrade (unwrap) super tokens to underlying tokens
        ISuperToken(address(superToken)).downgrade(_amount);

        // Transfer underlying tokens back to user
        require(
            underlyingToken.transfer(msg.sender, _amount),
            "Transfer failed"
        );

        emit Unwrapped(msg.sender, _amount);
    }

    /**
     * @notice Get Super Token balance of an address
     */
    function getSuperTokenBalance(address _account) external view returns (uint256) {
        return superToken.balanceOf(_account);
    }

    /**
     * @notice Get underlying token balance of an address
     */
    function getUnderlyingBalance(address _account) external view returns (uint256) {
        return underlyingToken.balanceOf(_account);
    }
}
