// SPDX-License-Identifier: MIT
// solhint-disable ordering
pragma solidity ^0.8.28;

import {IStudentRegistry} from "./IStudentRegistry.sol";
import {ICourseManager} from "./ICourseManager.sol";
import {IEnrollmentRequest} from "./IEnrollmentRequest.sol";

/**
 * @title ICRID
 * @dev Interface for the main CRID orchestrator contract
 */
interface ICRID {
    // Events
    event SystemInitialized(address indexed agent);
    event ContractUpdated(string indexed contractName, address indexed newAddress, address indexed agent);
    event SystemUpgraded(uint256 indexed newVersion, address indexed agent);

    // Custom errors
    error SystemNotInitialized();
    error SystemAlreadyInitialized();
    error UnauthorizedAccess();
    error InvalidContract();
    error InvalidInput();

    // System initialization
    function initializeSystem(
        address _studentRegistry,
        address _courseManager,
        address _enrollmentRequest,
        address _gradeManager
    ) external;

    function addCoordinator(address coordinator) external;

    function removeCoordinator(address coordinator) external;

    function addStudent(address student) external;

    function removeStudent(address student) external;

    // Student operations
    function registerStudent(
        string calldata id,
        string calldata fullName,
        string calldata email,
        string calldata program,
        uint16 enrollmentYear
    ) external;
    function setStudentStatus(string calldata studentId, bool isActive) external;

    function listAllStudents() external view returns (IStudentRegistry.Student[] memory students);

    function getStudentByAddress(
        address studentAddress
    ) external view returns (IStudentRegistry.Student memory student);

    function getStudentById(string calldata studentId) external view returns (IStudentRegistry.Student memory student);

    // Course operations
    function addCourse(
        uint256 id,
        string calldata name,
        string calldata description,
        uint8 credits,
        uint16 maxStudents
    ) external;

    function updateCourse(
        uint256 id,
        string calldata name,
        string calldata description,
        uint8 credits,
        uint16 maxStudents
    ) external;

    function listAllCourses() external view returns (ICourseManager.Course[] memory courses);

    function setCourseStatus(uint256 courseId, bool isActive) external;

    function getCourse(uint256 courseId) external view returns (ICourseManager.Course memory course);

    // Enrollment operations
    function requestEnrollment(uint256 courseId) external;
    function cancelEnrollmentRequest(uint256 requestId) external;
    function approveEnrollmentRequest(uint256 requestId) external;
    function rejectEnrollmentRequest(uint256 requestId) external;

    function listAllEnrollmentRequests() external view returns (IEnrollmentRequest.Request[] memory requestsList);
    function getEnrollmentRequest(uint256 requestId) external view returns (IEnrollmentRequest.Request memory request);

    function getEnrollmentRequestsByStudent(address studentAddress) external view returns (uint256[] memory requestIds);

    function getEnrollmentRequestsCount() external view returns (uint256 count);

    // Grade management
    function addGrade(address student, uint256 courseId, uint8 grade) external;

    function removeGrade(uint256 courseId) external;

    function getGrade(address student, uint256 courseId) external view returns (uint8 grade);

    function getGradesByStudent(
        address student
    ) external view returns (uint256[] memory courseIds, uint8[] memory grades);

    function getGradesByCourse(
        uint256 courseId
    ) external view returns (address[] memory students, uint8[] memory grades);

    // System management
    function updateContract(string calldata contractName, address newAddress) external;

    function getSystemStatus()
        external
        view
        returns (bool initialized, bool paused, uint256 version, uint256 totalStudents, uint256 totalRequests);

    function upgradeSystem() external;
}
