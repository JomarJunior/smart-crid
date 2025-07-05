// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ICRIDAccessControl} from "../interfaces/ICRIDAccessControl.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title CRIDAccessControl
 * @dev Core access control contract for CRID system
 * Security Context - Role-based access control implementation
 */
contract CRIDAccessControl is ICRIDAccessControl, AccessControl {
    // State variables
    bool public override paused; // Emergency pause state
    address public systemAdmin; // The admin of the system
    address public cridAddress; // Address of the CRID contract

    // Events
    event SystemInitialized(address indexed admin);
    event EmergencyPause(bool paused, address indexed admin);

    // Custom Errors
    error SystemIsPaused();
    error InsufficientPermissions();
    error InvalidUserRole();
    error InvalidAddress();
    error AlreadyInitialized();

    // Modifiers
    modifier whenNotPaused() {
        if (paused) revert SystemIsPaused();
        _;
    }

    modifier onlyCRID() {
        if (msg.sender != cridAddress) revert InsufficientPermissions();
        _;
    }

    constructor() {
        systemAdmin = _msgSender(); // The caller of the constructor will be the default admin

        // Set up role hierarchy
        _grantRole(DEFAULT_ADMIN_ROLE, systemAdmin);
        _grantRole(ADMIN_ROLE, systemAdmin);

        // Set role admins
        _setRoleAdmin(COORDINATOR_ROLE, ADMIN_ROLE);
        _setRoleAdmin(STUDENT_ROLE, ADMIN_ROLE);

        emit SystemInitialized(systemAdmin);
    }

    function initialize(
        address crid
    ) external whenNotPaused {
        if (cridAddress != address(0)) revert AlreadyInitialized();
        if (crid == address(0)) revert InvalidAddress();

        cridAddress = crid;
        emit SystemInitialized(systemAdmin);
    }

    /**
     * @dev Add a new coordinator (only admin)
     */
    function addCoordinator(address coordinator) external override whenNotPaused onlyCRID {
        if (coordinator == address(0)) revert InvalidAddress();
        _grantRole(COORDINATOR_ROLE, coordinator);
    }

    /**
     * @dev Remove a coordinator (only admin)
     */
    function removeCoordinator(address coordinator) external override whenNotPaused onlyCRID {
        if (coordinator == address(0)) revert InvalidAddress();
        _revokeRole(COORDINATOR_ROLE, coordinator);
    }

    /**
     * @dev Add a new student (only admin or coordinator)
     */
    function addStudent(address student) external override whenNotPaused onlyCRID {
        if (student == address(0)) revert InvalidAddress();
        _grantRole(STUDENT_ROLE, student);
    }

    /**
     * @dev Remove a student (only admin or coordinator)
     */
    function removeStudent(address student) external override whenNotPaused onlyCRID {
        if (student == address(0)) revert InvalidAddress();
        _revokeRole(STUDENT_ROLE, student);
    }

    /**
     * @dev Emergency pause function (only admin)
     */
    function pause() external override whenNotPaused onlyCRID {
        paused = true;
        emit EmergencyPause(true, _msgSender());
    }

    /**
     * @dev Resume system (only admin)
     */
    function unpause() external override onlyCRID {
        paused = false;
        emit EmergencyPause(false, _msgSender());
    }

    /**
     * @dev Check if user has a given role
     */
    function hasRole(
        bytes32 role,
        address account
    ) public view override(AccessControl, ICRIDAccessControl) returns (bool doesHasRole) {
        doesHasRole = AccessControl.hasRole(role, account);
    }
}
