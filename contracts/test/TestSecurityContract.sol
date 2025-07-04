// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {SecurityModifiers} from "../security/SecurityModifiers.sol";

/**
 * @title TestSecurityContract
 * @dev Test contract to verify SecurityModifiers functionality
 */
contract TestSecurityContract is SecurityModifiers {
    uint256 public testValue;
    bool private _reentrantCall;

    constructor(address _accessControl) SecurityModifiers(_accessControl) {}

    // Test functions for each modifier
    function testOnlyAdmin() external onlyAdmin {
        testValue = 1;
    }

    function testOnlyCoordinator() external onlyCoordinator {
        testValue = 2;
    }

    function testOnlyStudent() external onlyStudent {
        testValue = 3;
    }

    function testOnlyValidUser() external onlyValidUser {
        testValue = 4;
    }

    function testWhenNotPaused() external whenNotPaused {
        testValue = 5;
    }

    function testNonReentrant() external nonReentrant {
        testValue = 6;
    }

    function testValidAddress(address addr) external validAddress(addr) {
        testValue = 7;
    }

    function testCombinedModifiers(address addr) external onlyAdmin validAddress(addr) whenNotPaused {
        testValue = 8;
    }

    // Test reentrancy protection
    function testReentrancy() external nonReentrant {
        if (!_reentrantCall) {
            _reentrantCall = true;
            // This should fail due to reentrancy protection
            this.testReentrancy();
        }
    }

    // Reset function for testing
    function reset() external {
        testValue = 0;
        _reentrantCall = false;
    }
}
