// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {CRIDAccessControl} from "./CRIDAccessControl.sol";

/**
 * @title SecurityModifiers
 * @dev Reusable security modifiers for CRID system
 * Security Context - Common security patterns
 */
abstract contract SecurityModifiers {
    // State variables for reentrancy protection
    uint256 private constant _NOT_ENTERED = 1;
    uint256 private constant _ENTERED = 2;
    uint256 private _status;

    CRIDAccessControl public accessControl;

    // Custom errors
    error NotAdmin();
    error NotCoordinator();
    error NotStudent();
    error InvalidUser();
    error SystemPaused();
    error ReentrantCall();
    error InvalidAddress();
    error InvalidAccessControlAddress();

    // Role-based modifiers
    modifier onlyAdmin() {
        if (!accessControl.hasRole(accessControl.ADMIN_ROLE(), msg.sender)) revert NotAdmin();
        _;
    }

    modifier onlyCoordinator() {
        if (!accessControl.hasRole(accessControl.COORDINATOR_ROLE(), msg.sender)) revert NotCoordinator();
        _;
    }

    modifier onlyStudent() {
        if (!accessControl.hasRole(accessControl.STUDENT_ROLE(), msg.sender)) revert NotStudent();
        _;
    }

    modifier onlyValidUser() {
        if (!accessControl.hasRole(accessControl.ADMIN_ROLE(), msg.sender) &&
            !accessControl.hasRole(accessControl.COORDINATOR_ROLE(), msg.sender) &&
            !accessControl.hasRole(accessControl.STUDENT_ROLE(), msg.sender)) {
            revert InvalidUser();
        }
        _;
    }

    // System state modifiers
    modifier whenNotPaused() {
        if (accessControl.paused()) revert SystemPaused();
        _;
    }

    // Reentrancy protection
    modifier nonReentrant() {
        if (_status == _ENTERED) revert ReentrantCall();
        _status = _ENTERED;
        _;
        _status = _NOT_ENTERED;
    }

    // Input validation
    modifier validAddress(address addr) {
        if (addr == address(0)) revert InvalidAddress();
        _;
    }

    constructor(address _accessControl) {
        if (_accessControl == address(0)) revert InvalidAccessControlAddress();
        accessControl = CRIDAccessControl(_accessControl);
        _status = _NOT_ENTERED;
    }
}
