// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IStudentRegistry} from "../interfaces/IStudentRegistry.sol";

/**
 * @title StudentRegistry
 * @dev Core student registry contract for CRID system
 * @notice This contract can only be called by the CRID orchestrator contract
 * Student context - Student registration and persistence implementation
 */
contract StudentRegistry is IStudentRegistry {
    // State variables
    address public immutable CRID_CONTRACT;

    mapping(address studentAddress => Student student) public students; // Store students by addresses
    mapping(string studentId => address studentAddress) public idToAddress; // Index student addresses by their ids
    mapping(address studentAddress => string studentId) public addressToId; // Index student ids by their addresses
    address[] public studentAddresses; // List of all student addresses

    uint256 public totalRegisteredStudents; // Total number of registered students

    // Events
    event StudentDeactivated(string studentId, address indexed agent);
    event StudentReactivated(string studentId, address indexed agent);
    event StudentRegistered(string studentId, address indexed agent);
    event StudentUpdated(Student oldStudent, Student newStudent, address indexed agent);

    // Errors
    error InvalidInput();
    error DuplicateStudentId();
    error AlreadyRegistered();
    error NotRegistered();
    error NotActive();
    error AlreadyActive();
    error OnlyCRIDContract();

    // Modifiers
    modifier onlyCRID() {
        if (msg.sender != CRID_CONTRACT) {
            revert OnlyCRIDContract();
        }
        _;
    }

    modifier onlyValidString(string calldata str) {
        if (bytes(str).length == 0) revert InvalidInput();
        _;
    }

    modifier onlyUniqueId(string calldata studentId) {
        if (idToAddress[studentId] != address(0)) revert DuplicateStudentId();
        _;
    }

    modifier onlyUniqueAddress(address studentAddress) {
        if (bytes(students[studentAddress].id).length != 0) revert AlreadyRegistered();
        _;
    }

    /**
     * @dev Constructor initializes the contract with CRID contract and access control
     * @param _cridContract Address of the CRID orchestrator contract
     */
    constructor(address _cridContract) {
        if (_cridContract == address(0)) revert InvalidInput();
        CRID_CONTRACT = _cridContract;
        totalRegisteredStudents = 0;
    }

    /**
     * @dev Registers a new student in the system (only callable by CRID contract)
     * @dev Emits a StudentRegistered event upon successful registration
     * @param studentAddress The address of the student to register
     * @param id Unique identifier for the student (e.g., student ID)
     * @param fullName Full name of the student (First + Last)
     * @param email Properly formatted email address of the student
     * @param program Name of the student's course program
     * @param enrollmentYear Year of enrollment (e.g., 2023)
     */
    function registerStudent(
        address studentAddress,
        string calldata id,
        string calldata fullName,
        string calldata email,
        string calldata program,
        uint16 enrollmentYear,
        address agent
    )
        external
        onlyCRID
        onlyValidString(id)
        onlyValidString(fullName)
        onlyValidString(email)
        onlyValidString(program)
        onlyUniqueId(id)
        onlyUniqueAddress(studentAddress)
    {
        if (studentAddress == address(0)) revert InvalidInput();
        if (enrollmentYear == 0) revert InvalidInput();

        // Register the student into the students mapping
        students[studentAddress] = Student({
            id: id,
            fullName: fullName,
            email: email,
            program: program,
            enrollmentYear: enrollmentYear,
            isActive: true
        });

        // Update the index mappings
        idToAddress[id] = studentAddress;
        addressToId[studentAddress] = id;
        // Add the student address to the list
        studentAddresses.push(studentAddress);

        // Increment the total registered students count
        totalRegisteredStudents++;

        emit StudentRegistered(id, agent);
    }

    /**
     * @dev Deactivates a student account (Only callable by CRID contract)
     * @param studentId The ID of the student to deactivate
     */
    function deactivateStudentById(
        string calldata studentId,
        address agent
    ) external onlyCRID onlyValidString(studentId) {
        address studentAddress = idToAddress[studentId];
        if (studentAddress == address(0)) revert NotRegistered();

        if (!students[studentAddress].isActive) revert NotActive();

        students[studentAddress].isActive = false;
        emit StudentDeactivated(studentId, agent);
    }

    /**
     * @dev Reactivates a student account (Only callable by CRID contract)
     * @param studentId The ID of the student to reactivate
     */
    function activateStudentById(
        string calldata studentId,
        address agent
    ) external onlyCRID onlyValidString(studentId) {
        address studentAddress = idToAddress[studentId];
        if (studentAddress == address(0)) revert NotRegistered();

        if (students[studentAddress].isActive) revert AlreadyActive();

        students[studentAddress].isActive = true;
        emit StudentReactivated(studentId, agent);
    }

    function listAllStudents() external view returns (Student[] memory studentsList) {
        uint256 count = totalRegisteredStudents;
        studentsList = new Student[](count);
        for (uint256 i = 0; i < count; i++) {
            studentsList[i] = students[studentAddresses[i]];
        }
    }

    function isRegistered(address studentAddress) external view returns (bool isStudentRegistered) {
        if (studentAddress == address(0)) revert InvalidInput();
        isStudentRegistered = bytes(students[studentAddress].id).length != 0;
    }

    /**
     * @dev Check if a student is active (public function for contract integration)
     * @param studentAddress The address of the student to check
     * @return isActive True if the student is registered and active
     */
    function isStudentActive(address studentAddress) external view returns (bool isActive) {
        // if not registered, return false
        if (bytes(students[studentAddress].id).length == 0) revert NotRegistered();
        isActive = false;

        if (bytes(students[studentAddress].id).length != 0) {
            isActive = students[studentAddress].isActive;
        }
    }

    /**
     * @dev Get student ID by address (public function for contract integration)
     * @param studentAddress The address of the student
     * @return studentId The student's ID, or empty string if not registered
     */
    function getStudentId(address studentAddress) external view returns (string memory studentId) {
        studentId = students[studentAddress].id;
    }

    /**
     * @dev Get student by address (no access control, handled by CRID)
     */
    function getStudentByAddress(address studentAddress) external view returns (Student memory student) {
        if (bytes(students[studentAddress].id).length == 0) revert NotRegistered();
        return students[studentAddress];
    }

    /**
     * @dev Get student by ID (no access control, handled by CRID)
     */
    function getStudentById(string calldata studentId) external view returns (Student memory student) {
        address studentAddress = idToAddress[studentId];
        if (studentAddress == address(0)) revert NotRegistered();
        return students[studentAddress];
    }

    /**
     * @dev Get student address by ID
     */
    function getStudentAddressById(string calldata studentId) external view returns (address studentAddress) {
        studentAddress = idToAddress[studentId];
        if (studentAddress == address(0)) revert NotRegistered();
    }

    /**
     * @dev Get total registered students count
     */
    function getRegisteredStudentsCount() external view returns (uint256 count) {
        return totalRegisteredStudents;
    }
}
