// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ICRIDAccessControl} from "../interfaces/ICRIDAccessControl.sol";
import {IStudentRegistry} from "../interfaces/IStudentRegistry.sol";

/**
 * @title StudentRegistry
 * @dev Core student registry contract for CRID system
 * Student context - Student registration and persistence implementation
 */
contract StudentRegistry is IStudentRegistry {
    // State variables
    ICRIDAccessControl public accessControl;

    mapping(address studentAddress => Student student) public students; // Store students by addresses
    mapping(string studentId => address studentAddress) public idToAddress; // Index student addresses by their ids

    uint256 public totalRegisteredStudents; // Total number of registered students

    // Events
    event StudentDeactivated(string studentId, address indexed admin);
    event StudentReactivated(string studentId, address indexed admin);

    // Errors
    error InvalidInput();
    error DuplicateStudentId();
    error AlreadyRegistered();
    error Unauthorized();
    error NotRegistered();
    error SystemIsPaused();
    error NotActive();
    error AlreadyActive();

    // Modifiers
    modifier onlyValidString(string calldata str) {
        if (bytes(str).length == 0) revert InvalidInput();
        _;
    }

    modifier onlyUniqueId(string calldata studentId) {
        if (idToAddress[studentId] != address(0)) revert DuplicateStudentId();
        _;
    }

    modifier onlyUniqueAddress() {
        if (bytes(students[msg.sender].id).length != 0) revert AlreadyRegistered();
        _;
    }

    // A member can have the STUDENT_ROLE but not be registered yet
    modifier onlyStudentRole() {
        if (!accessControl.hasRole(accessControl.STUDENT_ROLE(), msg.sender)) revert Unauthorized();
        _;
    }

    // A member should register themselves after gaining STUDENT_ROLE
    modifier onlyRegistered() {
        if (bytes(students[msg.sender].id).length == 0) revert NotRegistered();
        _;
    }

    modifier whenNotPaused() {
        if (accessControl.paused()) revert SystemIsPaused();
        _;
    }

    // This constructor only runs when the contract is deployed
    // This happens only one time throughout its entire lifetime
    constructor(ICRIDAccessControl accessControl_) {
        accessControl = accessControl_;
        totalRegisteredStudents = 0;
    }

    /**
     * @dev Registers a new student in the system
     * @dev Emits a StudentRegistered event upon successful registration
     * @param id Unique identifier for the student (e.g., student ID)
     * @param fullName Full name of the student (First + Last)
     * @param email Properly formatted email address of the student
     * @param program Name of the student's course program
     * @param enrollmentYear Year of enrollment (e.g., 2023)
     * @notice This function can only be called by an address with the STUDENT_ROLE
     * @notice The student must not already be registered
     * @notice The student must provide a unique ID and valid strings for all parameters
     * @notice The function will revert if the system is paused
     */
    function registerStudent(
        string calldata id,
        string calldata fullName,
        string calldata email,
        string calldata program,
        uint16 enrollmentYear
    )
        external
        onlyStudentRole
        onlyUniqueAddress
        onlyUniqueId(id)
        onlyValidString(id)
        onlyValidString(fullName)
        onlyValidString(email)
        onlyValidString(program)
        whenNotPaused
    {
        students[msg.sender] = Student({
            id: id,
            fullName: fullName,
            email: email,
            program: program,
            enrollmentYear: enrollmentYear,
            isActive: true
        });
        idToAddress[id] = msg.sender;
        totalRegisteredStudents++;
        emit StudentRegistered(id, msg.sender);
    }

    /**
     * @dev Deactivates a student account (Only Admin or Coordinator can call this)
     * @param studentId The ID of the student to deactivate
     */
    function deactivateStudent(string calldata studentId)
        external
        whenNotPaused
        onlyValidString(studentId)
    {
        if (
            !accessControl.hasRole(accessControl.ADMIN_ROLE(), msg.sender) &&
            !accessControl.hasRole(accessControl.COORDINATOR_ROLE(), msg.sender)
        ) {
            revert Unauthorized();
        }
        address studentAddress = idToAddress[studentId];
        if (studentAddress == address(0)) revert NotRegistered();

        if (!students[studentAddress].isActive) revert NotActive();

        students[studentAddress].isActive = false;
        emit StudentDeactivated(studentId, msg.sender);
    }

    /**
     * @dev Reactivates a student account (Only Admin or Coordinator can call this)
     * @param studentId The ID of the student to reactivate
     */
    function reactivateStudent(string calldata studentId)
        external
        whenNotPaused
        onlyValidString(studentId)
    {
        if (
            !accessControl.hasRole(accessControl.ADMIN_ROLE(), msg.sender) &&
            !accessControl.hasRole(accessControl.COORDINATOR_ROLE(), msg.sender)
        ) {
            revert Unauthorized();
        }
        address studentAddress = idToAddress[studentId];
        if (studentAddress == address(0)) revert NotRegistered();

        if (students[studentAddress].isActive) revert AlreadyActive();

        students[studentAddress].isActive = true;
        emit StudentReactivated(studentId, msg.sender);
    }

    function isRegistered(address studentAddress) external view returns (bool isStudentRegistered) {
        isStudentRegistered = bytes(students[studentAddress].id).length != 0;
    }

    /**
     * @dev Check if a student is active (public function for contract integration)
     * @param studentAddress The address of the student to check
     * @return isActive True if the student is registered and active
     */
    function isStudentActive(address studentAddress) external view returns (bool isActive) {
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

    function getStudentByAddress(address studentAddress) external view returns (Student memory student) {
        if (bytes(students[studentAddress].id).length == 0) revert NotRegistered();

        // Privacy control: only allow self, coordinators, or admins
        if (
            msg.sender != studentAddress &&
            !accessControl.hasRole(accessControl.COORDINATOR_ROLE(), msg.sender) &&
            !accessControl.hasRole(accessControl.ADMIN_ROLE(), msg.sender)
        ) {
            revert Unauthorized();
        }

        student = students[studentAddress];
    }

    function getStudentById(string calldata studentId) external view returns (Student memory student) {
        address studentAddress = idToAddress[studentId];
        if (studentAddress == address(0)) revert NotRegistered();

        // Privacy control: only allow coordinators or admins for ID queries
        if (
            !accessControl.hasRole(accessControl.COORDINATOR_ROLE(), msg.sender) &&
            !accessControl.hasRole(accessControl.ADMIN_ROLE(), msg.sender)
        ) {
            revert Unauthorized();
        }

        student = students[studentAddress];
    }

    function getStudentAddress(string calldata studentId) external view returns (address studentAddress) {
        studentAddress = idToAddress[studentId];
        if (studentAddress == address(0)) revert NotRegistered();
    }

    function getAccessControl() external view returns (ICRIDAccessControl accessControl_) {
        accessControl_ = accessControl;
    }
}
