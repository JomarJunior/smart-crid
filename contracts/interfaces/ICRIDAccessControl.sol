// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IAccessControl} from "@openzeppelin/contracts/access/IAccessControl.sol";

abstract contract ICRIDAccessControl is IAccessControl {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant COORDINATOR_ROLE = keccak256("COORDINATOR_ROLE");
    bytes32 public constant STUDENT_ROLE = keccak256("STUDENT_ROLE");

    // Functions
    function addCoordinator(address coordinator) external virtual;
    function addStudent(address student) external virtual;
    function removeCoordinator(address coordinator) external virtual;
    function removeStudent(address student) external virtual;
    function pause() external virtual;
    function unpause() external virtual;
    function paused() external view virtual returns (bool isPaused);
    function hasRole(bytes32 role, address account) external view virtual returns (bool doesHasRole);
}
