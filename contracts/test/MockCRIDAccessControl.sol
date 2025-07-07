// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {ICRIDAccessControl} from "../interfaces/ICRIDAccessControl.sol";

contract MockCRIDAccessControl is AccessControl, ICRIDAccessControl {
    bool public override paused = false;

    // Events
    event SystemInitialized(address indexed admin);
    event AddCoordinatorCalled(address indexed coordinator);
    event RemoveCoordinatorCalled(address indexed coordinator);
    event AddStudentCalled(address indexed student);
    event RemoveStudentCalled(address indexed student);
    event PauseCalled();
    event UnpauseCalled();

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);

        _setRoleAdmin(COORDINATOR_ROLE, ADMIN_ROLE);
        _setRoleAdmin(STUDENT_ROLE, ADMIN_ROLE);

        emit SystemInitialized(msg.sender);
    }

    function addCoordinator(address coordinator) external override {
        _grantRole(COORDINATOR_ROLE, coordinator);
        emit AddCoordinatorCalled(coordinator);
    }

    function removeCoordinator(address coordinator) external override {
        _revokeRole(COORDINATOR_ROLE, coordinator);
        emit RemoveCoordinatorCalled(coordinator);
    }

    function addStudent(address student) external override {
        _grantRole(STUDENT_ROLE, student);
        emit AddStudentCalled(student);
    }

    function removeStudent(address student) external override {
        _revokeRole(STUDENT_ROLE, student);
        emit RemoveStudentCalled(student);
    }

    function pause() external override {
        paused = true;
        emit PauseCalled();
    }

    function unpause() external override {
        paused = false;
        emit UnpauseCalled();
    }

    function hasRole(
        bytes32 role,
        address account
    ) public view override(AccessControl, ICRIDAccessControl) returns (bool doesHasRole) {
        doesHasRole = AccessControl.hasRole(role, account);
    }
}
