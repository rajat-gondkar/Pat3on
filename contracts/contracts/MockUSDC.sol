// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MockUSDC
 * @dev Mock USDC token for testing purposes
 * Anyone can mint tokens for testing - DO NOT USE IN PRODUCTION
 */
contract MockUSDC is ERC20, Ownable {
    uint8 private _decimals;

    /**
     * @notice Constructor to initialize the token
     * @param initialSupply Initial supply in base units (6 decimals)
     */
    constructor(uint256 initialSupply) ERC20("Mock USDC", "mUSDC") {
        _mint(msg.sender, initialSupply);
    }

    /**
     * @dev Returns the number of decimals
     */
    function decimals() public view virtual override returns (uint8) {
        return _decimals;
    }

    /**
     * @dev Mint tokens to any address (for testing only)
     * @param to Address to mint tokens to
     * @param amount Amount in whole tokens (will be multiplied by decimals)
     */
    function mint(address to, uint256 amount) public {
        _mint(to, amount * 10 ** decimals());
    }

    /**
     * @dev Faucet function - anyone can get 1000 tokens for testing
     */
    function faucet() public {
        _mint(msg.sender, 1000 * 10 ** decimals());
    }

    /**
     * @dev Burn tokens from caller
     * @param amount Amount in whole tokens
     */
    function burn(uint256 amount) public {
        _burn(msg.sender, amount * 10 ** decimals());
    }
}
