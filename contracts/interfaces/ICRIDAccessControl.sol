// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IAccessControl} from "@openzeppelin/contracts/access/IAccessControl.sol";

abstract contract ICRIDAccessControl is IAccessControl {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant COORDINATOR_ROLE = keccak256("COORDINATOR_ROLE");
    bytes32 public constant STUDENT_ROLE = keccak256("STUDENT_ROLE");

    // Functions
    function addCoordinator(address coordinator) virtual external;
    function addStudent(address student) virtual external;
    function removeCoordinator(address coordinator) virtual external;
    function removeStudent(address student) virtual external;
    function pause() virtual external;
    function unpause() virtual external;
    function paused() virtual external view returns (bool isPaused);
    function hasRole(bytes32 role, address account) virtual external view returns (bool doesHasRole);
}
