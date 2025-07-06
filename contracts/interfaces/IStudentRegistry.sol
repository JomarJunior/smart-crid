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

    // Functions
    function registerStudent(
        address studentAddress,
        string calldata id,
        string calldata fullName,
        string calldata email,
        string calldata program,
        uint16 enrollmentYear,
        address agent
    ) external;

    function activateStudentById(string calldata studentId, address agent) external;
    function deactivateStudentById(string calldata studentId, address agent) external;
    function isRegistered(address studentAddress) external view returns (bool isStudentRegistered);
    function isStudentActive(address studentAddress) external view returns (bool isActive);
    function listAllStudents() external view returns (Student[] memory students);
    function getStudentId(address studentAddress) external view returns (string memory studentId);
    function getStudentByAddress(address studentAddress) external view returns (Student memory student);
    function getStudentById(string calldata studentId) external view returns (Student memory student);
    function getStudentAddressById(string calldata studentId) external view returns (address studentAddress);
    function getRegisteredStudentsCount() external view returns (uint256 count);
}
