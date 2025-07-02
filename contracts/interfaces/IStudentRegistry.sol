// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @title IStudentRegistry
 * @dev Interface for student registry contract
 */
interface IStudentRegistry {
    // Struct to be returned by view functions
    struct Student {
        string id;
        string fullName;
        string email;
        string program;
        uint16 enrollmentYear;
        bool isActive;
    }

    // Events
    event StudentRegistered(string studentId, address studentAddress);

    // Functions
    function registerStudent(
        string calldata id,
        string calldata fullName,
        string calldata email,
        string calldata program,
        uint16 enrollmentYear
    ) external;

    function isRegistered(address studentAddress) external view returns (bool isStudentRegistered);
    function getStudentByAddress(address studentAddress) external view returns (Student memory student);
    function getStudentById(string calldata studentId) external view returns (Student memory student);
    function getStudentAddress(string calldata studentId) external view returns (address studentAddress);
}
