// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title CRIDAccessControl
 * @dev Core access control contract for CRID system
 * Security Context - Role-based access control implementation
 */
contract CRIDAccessControl is AccessControl {
    // Role definitions based on TDD
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant COORDINATOR_ROLE = keccak256("COORDINATOR_ROLE");
    bytes32 public constant STUDENT_ROLE = keccak256("STUDENT_ROLE");

    // Events
    event SystemInitialized(address indexed admin, uint256 timestamp);
    event EmergencyPause(bool paused, address indexed admin);

    // State variables
    bool public paused;
    address public systemAdmin;

    // Modifiers
    modifier whenNotPaused() {
        require(!paused, "CRIDAccessControl: system is paused");
        _;
    }

    modifier onlyAdmin() {
        require(hasRole(ADMIN_ROLE, _msgSender()), "CRIDAccessControl: insufficient permissions");
        _;
    }

    modifier onlyCoordinator() {
        require(hasRole(COORDINATOR_ROLE, _msgSender()), "CRIDAccessControl: insufficient permissions");
        _;
    }

    modifier onlyAdminOrCoordinator() {
        require(
            hasRole(ADMIN_ROLE, _msgSender()) || hasRole(COORDINATOR_ROLE, _msgSender()),
            "CRIDAccessControl: insufficient permissions"
        );
        _;
    }

    modifier onlyStudent() {
        require(hasRole(STUDENT_ROLE, _msgSender()), "CRIDAccessControl: insufficient permissions");
        _;
    }

    modifier onlyValidUser() {
        require(
            this.isValidUser(_msgSender()),
            "CRIDAccessControl: caller does not have a valid role"
        );
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

        emit SystemInitialized(systemAdmin, block.timestamp);
    }

    /**
     * @dev Add a new coordinator (only admin)
     */
    function addCoordinator(address coordinator) external onlyAdmin whenNotPaused {
        require(coordinator != address(0), "CRIDAccessControl: invalid coordinator address");
        _grantRole(COORDINATOR_ROLE, coordinator);
    }

    /**
     * @dev Add a mew student (only admin or coordinator)
     */
    function addStudent(address student) external whenNotPaused onlyAdminOrCoordinator {
        require(student != address(0), "CRIDAccessControl: invalid student address");
        _grantRole(STUDENT_ROLE, student);
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
    function isValidUser(address user) external view returns (bool) {
        return hasRole(ADMIN_ROLE, user) || hasRole(COORDINATOR_ROLE, user) || hasRole(STUDENT_ROLE, user);
    }
}
