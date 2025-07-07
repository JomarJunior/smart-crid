// SPDX-License-Identifier: MIT
// solhint-disable ordering
pragma solidity ^0.8.0;

import {IStudentRegistry} from "../interfaces/IStudentRegistry.sol";

/**
 * @title MockStudentRegistry
 * @dev Mock implementation of the IStudentRegistry interface for testing purposes
 */
contract MockStudentRegistry is IStudentRegistry {
    mapping(address student => bool isRegistered) private _registeredStudents;
    mapping(string student => bool isActive) private _activeStudents;
    mapping(address student => string id) private _studentIds;

    event RegisterStudentCalled(
        address indexed studentAddress,
        string id,
        string fullName,
        string email,
        string program,
        uint16 enrollmentYear,
        address agent
    );
    event ActivateStudentByIdCalled(string studentId, address agent);
    event DeactivateStudentByIdCalled(string studentId, address agent);

    function registerStudent(
        address studentAddress,
        string calldata id,
        string calldata fullName,
        string calldata email,
        string calldata program,
        uint16 enrollmentYear,
        address agent
    ) external override {
        _registeredStudents[studentAddress] = true;
        _studentIds[studentAddress] = id;
        emit RegisterStudentCalled(studentAddress, id, fullName, email, program, enrollmentYear, agent);
    }

    function activateStudentById(string calldata studentId, address agent) external override {
        _activeStudents[studentId] = true;
        // Assume the student is the agent for testing purposes
        _studentIds[agent] = studentId;
        emit ActivateStudentByIdCalled(studentId, agent);
    }

    function deactivateStudentById(string calldata studentId, address agent) external override {
        _activeStudents[studentId] = false;
        // Assume the student is the agent for testing purposes
        _studentIds[agent] = studentId;
        emit DeactivateStudentByIdCalled(studentId, agent);
    }

    function listAllStudents() external view override returns (Student[] memory students) {
        // For mock purposes, we return a single dummy student
        students = new Student[](1);
        students[0] = Student({
            id: "dummy-id",
            fullName: "Dummy Student",
            email: "dummy@student.edu",
            program: "Computer Science",
            enrollmentYear: 2023,
            isActive: true
        });
    }

    function isRegistered(address studentAddress) external view override returns (bool isStudentRegistered) {
        isStudentRegistered = _registeredStudents[studentAddress];
    }

    function isStudentActive(address studentAddress) external view override returns (bool isActive) {
        // For mock purposes, we return true
        string memory studentId = _studentIds[studentAddress];
        isActive = _activeStudents[studentId];
    }

    function getStudentId(address studentAddress) external pure override returns (string memory studentId) {
        // For mock purposes, we return a dummy ID
        studentAddress; // To avoid unused variable warning
        studentId = "dummy-id";
    }

    function getStudentByAddress(address studentAddress) external pure override returns (Student memory student) {
        // For mock purposes, we return a dummy student
        studentAddress; // To avoid unused variable warning
        student = Student({
            id: "dummy-id",
            fullName: "Dummy Student",
            email: "dummy@student.edu",
            program: "Computer Science",
            enrollmentYear: 2023,
            isActive: true
        });
    }

    function getStudentById(string calldata studentId) external view override returns (Student memory student) {
        // For mock purposes, we return a dummy student
        student = Student({
            id: studentId,
            fullName: "Dummy Student",
            email: "dummy@student.edu",
            program: "Computer Science",
            enrollmentYear: 2023,
            isActive: _activeStudents[studentId]
        });
    }

    function getStudentAddressById(string calldata studentId) external pure override returns (address studentAddress) {
        // For mock purposes, we return a dummy address
        studentId; // To avoid unused variable warning
        studentAddress = address(0x1234567890123456789012345678901234567890);
    }
    function getRegisteredStudentsCount() external pure override returns (uint256 count) {
        // For mock purposes, we return a dummy count
        count = 1;
    }
}
