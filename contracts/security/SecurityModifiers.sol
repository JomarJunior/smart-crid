// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./CRIDAccessControl.sol";

/**
 * @title SecurityModifiers
 * @dev Reusable security modifiers for CRID system
 * Security Context - Common security patterns
 */
abstract contract SecurityModifiers {
    CRIDAccessControl public accessControl;

    // State variables for reentrancy protection
    uint256 private constant _NOT_ENTERED = 1;
    uint256 private constant _ENTERED = 2;
    uint256 private _status;

    constructor(address _accessControl) {
        require(_accessControl != address(0), "SecurityModifiers: invalid access control address");
        accessControl = CRIDAccessControl(_accessControl);
        _status = _NOT_ENTERED;
    }

    // Role-based modifiers
    modifier onlyAdmin() {
        require(accessControl.hasRole(accessControl.ADMIN_ROLE(), msg.sender), "SecurityModifiers: not admin");
        _;
    }

    modifier onlyCoordinator() {
        require(
            accessControl.hasRole(accessControl.COORDINATOR_ROLE(), msg.sender),
            "SecurityModifiers: not coordinator"
        );
        _;
    }

    modifier onlyStudent() {
        require(accessControl.hasRole(accessControl.STUDENT_ROLE(), msg.sender), "SecurityModifiers: not student");
        _;
    }

    modifier onlyValidUser() {
        require(accessControl.isValidUser(msg.sender), "SecurityModifiers: invalid user");
        _;
    }

    // System state modifiers
    modifier whenNotPaused() {
        require(!accessControl.paused(), "SecurityModifiers: system paused");
        _;
    }

    // Reentrancy protection
    modifier nonReentrant() {
        require(_status != _ENTERED, "SecurityModifiers: reentrant call");
        _status = _ENTERED;
        _;
        _status = _NOT_ENTERED;
    }

    // Input validation
    modifier validAddress(address addr) {
        require(addr != address(0), "SecurityModifiers: invalid address");
        _;
    }
}
