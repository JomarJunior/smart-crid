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
    // Events
    event SystemInitialized(address indexed admin);
    event EmergencyPause(bool paused, address indexed admin);

    // Custom Errors
    error SystemIsPaused();
    error InsufficientPermissions();
    error InvalidUserRole();
    error InvalidAddress();

    // Modifiers
    modifier whenNotPaused() {
        if (paused) revert SystemIsPaused();
        _;
    }

    modifier onlyAdmin() {
        if (!hasRole(ADMIN_ROLE, _msgSender())) revert InsufficientPermissions();
        _;
    }

    modifier onlyCoordinator() {
        if (!hasRole(COORDINATOR_ROLE, _msgSender())) revert InsufficientPermissions();
        _;
    }

    modifier onlyAdminOrCoordinator() {
        if (!hasRole(ADMIN_ROLE, _msgSender()) && !hasRole(COORDINATOR_ROLE, _msgSender())) {
            revert InsufficientPermissions();
        }
        _;
    }

    modifier onlyStudent() {
        if (!hasRole(STUDENT_ROLE, _msgSender())) revert InsufficientPermissions();
        _;
    }

    modifier onlyValidUser() {
        if (!this.isValidUser(_msgSender())) revert InvalidUserRole();
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

    /**
     * @dev Add a new coordinator (only admin)
     */
    function addCoordinator(address coordinator) external onlyAdmin whenNotPaused {
        if (coordinator == address(0)) revert InvalidAddress();
        _grantRole(COORDINATOR_ROLE, coordinator);
    }

    /**
     * @dev Remove a coordinator (only admin)
     */
    function removeCoordinator(address coordinator) external onlyAdmin whenNotPaused {
        if (coordinator == address(0)) revert InvalidAddress();
        _revokeRole(COORDINATOR_ROLE, coordinator);
    }

    /**
     * @dev Add a new student (only admin or coordinator)
     */
    function addStudent(address student) external whenNotPaused onlyAdminOrCoordinator {
        if (student == address(0)) revert InvalidAddress();
        _grantRole(STUDENT_ROLE, student);
    }

    /**
     * @dev Remove a student (only admin or coordinator)
     */
    function removeStudent(address student) external whenNotPaused onlyAdminOrCoordinator {
        if (student == address(0)) revert InvalidAddress();
        _revokeRole(STUDENT_ROLE, student);
    }

    /**
     * @dev Emergency pause function (only admin)
     */
    function pause() external onlyAdmin {
        paused = true;
        emit EmergencyPause(true, _msgSender());
    }

    /**
     * @dev Resume system (only admin)
     */
    function unpause() external onlyAdmin {
        paused = false;
        emit EmergencyPause(false, _msgSender());
    }

    /**
     * @dev Check if user has any valid role
     */
    function isValidUser(address user) external view returns (bool isValid) {
        return hasRole(ADMIN_ROLE, user) || hasRole(COORDINATOR_ROLE, user) || hasRole(STUDENT_ROLE, user);
    }
}
