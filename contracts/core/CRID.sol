// SPDX-License-Identifier: MIT
// solhint-disable ordering
pragma solidity ^0.8.28;

import {ICRID} from "../interfaces/ICRID.sol";
import {IStudentRegistry} from "../interfaces/IStudentRegistry.sol";
import {ICourseManager} from "../interfaces/ICourseManager.sol";
import {ICRIDAccessControl} from "../interfaces/ICRIDAccessControl.sol";
import {IEnrollmentRequest} from "../interfaces/IEnrollmentRequest.sol";
import {SecurityModifiers} from "../security/SecurityModifiers.sol";

import {IGradeManager} from "../interfaces/IGradeManager.sol";

/**
 * @title CRID
 * @dev Central orchestrator contract that handles all access control and coordinates between contexts
 * @notice This is the main entry point for all CRID system operations
 */
contract CRID is SecurityModifiers, ICRID {
    // State variables
    ICRIDAccessControl public immutable ACCESS_CONTROL;
    IStudentRegistry public studentRegistry;
    ICourseManager public courseManager;
    IEnrollmentRequest public enrollmentRequest;
    IGradeManager public gradeManager;

    bool public systemInitialized;
    uint256 public systemVersion;

    // Modifiers
    modifier onlyCoordinatorOrAdmin() {
        if (
            !ACCESS_CONTROL.hasRole(ACCESS_CONTROL.COORDINATOR_ROLE(), msg.sender) &&
            !ACCESS_CONTROL.hasRole(ACCESS_CONTROL.ADMIN_ROLE(), msg.sender)
        ) {
            revert UnauthorizedAccess();
        }
        _;
    }

    modifier systemMustBeInitialized() {
        if (!systemInitialized) {
            revert SystemNotInitialized();
        }
        _;
    }

    /**
     * @dev Constructor that sets up the access control
     * @param _accessControl Address of the access control contract
     */
    constructor(address _accessControl) SecurityModifiers(_accessControl) {
        if (_accessControl == address(0)) {
            revert InvalidContract();
        }
        ACCESS_CONTROL = ICRIDAccessControl(_accessControl);
        systemVersion = 1;
    }

    /**
     * @dev Initialize the system with all contract addresses
     * @param _studentRegistry Address of the student registry contract
     * @param _courseManager Address of the course manager contract
     * @param _enrollmentRequest Address of the enrollment request contract
     */
    function initializeSystem(
        address _studentRegistry,
        address _courseManager,
        address _enrollmentRequest,
        address _gradeManager
    ) external onlyAdmin {
        if (systemInitialized) {
            revert SystemAlreadyInitialized();
        }

        if (
            _studentRegistry == address(0) ||
            _courseManager == address(0) ||
            _enrollmentRequest == address(0) ||
            _gradeManager == address(0)
        ) {
            revert InvalidContract();
        }

        studentRegistry = IStudentRegistry(_studentRegistry);
        courseManager = ICourseManager(_courseManager);
        enrollmentRequest = IEnrollmentRequest(_enrollmentRequest);
        gradeManager = IGradeManager(_gradeManager);

        systemInitialized = true;

        emit SystemInitialized(msg.sender);
    }

    // =======================
    // ACCESS CONTROL OPERATIONS
    // =======================
    /**
     * @dev Add a new coordinator (admin only)
     */
    function addCoordinator(address coordinator) external onlyAdmin whenNotPaused systemMustBeInitialized {
        if (coordinator == address(0)) {
            revert InvalidInput();
        }
        ACCESS_CONTROL.addCoordinator(coordinator);
    }

    /**
     * @dev Remove a coordinator (admin only)
     */
    function removeCoordinator(address coordinator) external onlyAdmin whenNotPaused systemMustBeInitialized {
        if (coordinator == address(0)) {
            revert InvalidInput();
        }
        ACCESS_CONTROL.removeCoordinator(coordinator);
    }

    /**
     * @dev Add a new student (admin only)
     */
    function addStudent(address student) external onlyAdmin whenNotPaused systemMustBeInitialized {
        if (student == address(0)) {
            revert InvalidInput();
        }
        ACCESS_CONTROL.addStudent(student);
    }

    /**
     * @dev Remove a student (admin only)
     */
    function removeStudent(address student) external onlyAdmin whenNotPaused systemMustBeInitialized {
        if (student == address(0)) {
            revert InvalidInput();
        }
        ACCESS_CONTROL.removeStudent(student);
    }

    /**
     * @dev Pause the system (admin only)
     */
    function pauseSystem() external onlyAdmin whenNotPaused systemMustBeInitialized {
        ACCESS_CONTROL.pause();
    }

    /**
     * @dev Unpause the system (admin only)
     */
    function unpauseSystem() external onlyAdmin systemMustBeInitialized {
        ACCESS_CONTROL.unpause();
    }

    /**
     * @dev Check if the system is paused
     */
    function isSystemPaused() external view systemMustBeInitialized returns (bool paused) {
        paused = ACCESS_CONTROL.paused();
    }

    /** 
     * @dev Check if the user has a specific role
     */
    function hasRole(bytes32 role, address account) external view systemMustBeInitialized returns (bool doesHasRole) {
        doesHasRole = ACCESS_CONTROL.hasRole(role, account);
    }

    // =======================
    // STUDENT CONTEXT OPERATIONS
    // =======================

    /**
     * @dev Register a new student
     */
    function registerStudent(
        string calldata id,
        string calldata fullName,
        string calldata email,
        string calldata program,
        uint16 enrollmentYear
    ) external onlyStudent whenNotPaused systemMustBeInitialized {
        studentRegistry.registerStudent(msg.sender, id, fullName, email, program, enrollmentYear, msg.sender);
    }

    /**
     * @dev Activate/deactivate student (admin only)
     */
    function setStudentStatus(
        string calldata studentId,
        bool isActive
    ) external onlyAdmin whenNotPaused systemMustBeInitialized {
        if (isActive) {
            studentRegistry.activateStudentById(studentId, msg.sender);
        } else {
            studentRegistry.deactivateStudentById(studentId, msg.sender);
        }
    }

    /**
     * @dev List all registered students (coordinators and admins only)
     */
    function listAllStudents()
        external
        view
        onlyCoordinatorOrAdmin
        systemMustBeInitialized
        returns (IStudentRegistry.Student[] memory students)
    {
        return studentRegistry.listAllStudents();
    }

    /**
     * @dev Get student information by address
     */
    function getStudentByAddress(
        address studentAddress
    ) external view systemMustBeInitialized returns (IStudentRegistry.Student memory student) {
        // Students can view their own profile, coordinators and admins can view any
        if (
            msg.sender != studentAddress &&
            !ACCESS_CONTROL.hasRole(ACCESS_CONTROL.COORDINATOR_ROLE(), msg.sender) &&
            !ACCESS_CONTROL.hasRole(ACCESS_CONTROL.ADMIN_ROLE(), msg.sender)
        ) {
            revert UnauthorizedAccess();
        }

        return studentRegistry.getStudentByAddress(studentAddress);
    }

    /**
     * @dev Get student information by ID (coordinators and admins only)
     */
    function getStudentById(
        string calldata studentId
    ) external view onlyCoordinatorOrAdmin systemMustBeInitialized returns (IStudentRegistry.Student memory student) {
        return studentRegistry.getStudentById(studentId);
    }

    // =======================
    // COURSE MANAGEMENT OPERATIONS
    // =======================

    /**
     * @dev Add a new course (coordinators and admins only)
     */
    function addCourse(
        uint256 id,
        string calldata name,
        string calldata description,
        uint8 credits,
        uint16 maxStudents
    ) external onlyCoordinatorOrAdmin whenNotPaused systemMustBeInitialized {
        courseManager.addCourse(id, name, description, credits, maxStudents, msg.sender);
    }

    /**
     * @dev Update an existing course (coordinators and admins only)
     */
    function updateCourse(
        uint256 id,
        string calldata name,
        string calldata description,
        uint8 credits,
        uint16 maxStudents
    ) external onlyCoordinatorOrAdmin whenNotPaused systemMustBeInitialized {
        courseManager.updateCourse(id, name, description, credits, maxStudents, msg.sender);
    }

    /**
     * @dev Get course information (public view)
     */
    function getCourse(
        uint256 courseId
    ) external view systemMustBeInitialized returns (ICourseManager.Course memory course) {
        return courseManager.getCourse(courseId);
    }

    /**
     * @dev Activate/deactivate course (coordinators and admins only)
     */
    function setCourseStatus(
        uint256 courseId,
        bool isActive
    ) external onlyCoordinatorOrAdmin whenNotPaused systemMustBeInitialized {
        if (isActive) {
            courseManager.activateCourse(courseId, msg.sender);
        } else {
            courseManager.deactivateCourse(courseId, msg.sender);
        }
    }

    // =======================
    // ENROLLMENT OPERATIONS
    // =======================

    /**
     * @dev Submit enrollment request (students only)
     */
    function requestEnrollment(uint256 courseId) external onlyStudent whenNotPaused systemMustBeInitialized {
        // Validate student is active
        if (!studentRegistry.isStudentActive(msg.sender)) {
            revert UnauthorizedAccess();
        }

        // Validate course exists and is active
        if (!courseManager.isCourseActive(courseId)) {
            revert InvalidInput();
        }

        enrollmentRequest.requestEnrollment(courseId, msg.sender);
    }

    /**
     * @dev Cancel enrollment request (students only, own requests)
     */
    function cancelEnrollmentRequest(uint256 requestId) external onlyStudent whenNotPaused systemMustBeInitialized {
        enrollmentRequest.cancelEnrollmentRequest(requestId, msg.sender);
    }

    /**
     * @dev Approve enrollment request (coordinators and admins only)
     */
    function approveEnrollmentRequest(
        uint256 requestId
    ) external onlyCoordinatorOrAdmin whenNotPaused systemMustBeInitialized {
        enrollmentRequest.approveEnrollmentRequest(requestId, msg.sender);
    }

    /**
     * @dev Reject enrollment request (coordinators and admins only)
     */
    function rejectEnrollmentRequest(
        uint256 requestId
    ) external onlyCoordinatorOrAdmin whenNotPaused systemMustBeInitialized {
        enrollmentRequest.rejectEnrollmentRequest(requestId, msg.sender);
    }

    /**
     * @dev Get enrollment request by ID
     */
    function getEnrollmentRequest(
        uint256 requestId
    ) external view systemMustBeInitialized returns (IEnrollmentRequest.Request memory request) {
        IEnrollmentRequest.Request memory req = enrollmentRequest.getEnrollmentRequest(requestId);

        // Students can only view their own requests
        if (
            msg.sender != req.student &&
            !ACCESS_CONTROL.hasRole(ACCESS_CONTROL.COORDINATOR_ROLE(), msg.sender) &&
            !ACCESS_CONTROL.hasRole(ACCESS_CONTROL.ADMIN_ROLE(), msg.sender)
        ) {
            revert UnauthorizedAccess();
        }

        return req;
    }

    /**
     * @dev Get enrollment requests by student (students can view own, coordinators/admins can view any)
     */
    function getEnrollmentRequestsByStudent(
        address studentAddress
    ) external view systemMustBeInitialized returns (uint256[] memory requestIds) {
        // Students can only view their own requests
        if (
            msg.sender != studentAddress &&
            !ACCESS_CONTROL.hasRole(ACCESS_CONTROL.COORDINATOR_ROLE(), msg.sender) &&
            !ACCESS_CONTROL.hasRole(ACCESS_CONTROL.ADMIN_ROLE(), msg.sender)
        ) {
            revert UnauthorizedAccess();
        }

        return enrollmentRequest.getEnrollmentRequestsByStudent(studentAddress);
    }

    /**
     * @dev Get total enrollment requests count
     */
    function getEnrollmentRequestsCount() external view systemMustBeInitialized returns (uint256 count) {
        return enrollmentRequest.getEnrollmentRequestsCount();
    }

    // =======================
    // GRADE MANAGEMENT OPERATIONS
    // =======================
    /**
     * @dev Add a new grade (coordinators and admins only)
     */
    function addGrade(
        address student,
        uint256 courseId,
        uint8 grade
    ) external onlyCoordinatorOrAdmin whenNotPaused systemMustBeInitialized {
        // Validate student is registered
        if (!studentRegistry.isRegistered(student)) {
            revert InvalidInput();
        }
        // Validate course exists and is active
        if (!courseManager.isCourseActive(courseId)) {
            revert InvalidInput();
        }
        gradeManager.addGrade(student, courseId, grade, msg.sender);
    }

    /**
     * @dev Remove a grade (coordinators and admins only)
     */
    function removeGrade(uint256 gradeId) external onlyCoordinatorOrAdmin whenNotPaused systemMustBeInitialized {
        gradeManager.removeGrade(gradeId, msg.sender);
    }

    /**
     * @dev Get grade by student and course (public view)
     */
    function getGrade(address student, uint256 courseId) external view systemMustBeInitialized returns (uint8 grade) {
        // Validate student is registered
        if (!studentRegistry.isRegistered(student)) {
            revert InvalidInput();
        }
        // Validate course exists and is active
        if (!courseManager.isCourseActive(courseId)) {
            revert InvalidInput();
        }
        return gradeManager.getGrade(student, courseId);
    }

    /**
     * @dev Get grades by student (coordinators and admins can view any, students can view own)
     */
    function getGradesByStudent(
        address student
    ) external view systemMustBeInitialized returns (uint256[] memory courseIds, uint8[] memory grades) {
        // Students can only view their own grades
        if (
            msg.sender != student &&
            !ACCESS_CONTROL.hasRole(ACCESS_CONTROL.COORDINATOR_ROLE(), msg.sender) &&
            !ACCESS_CONTROL.hasRole(ACCESS_CONTROL.ADMIN_ROLE(), msg.sender)
        ) {
            revert UnauthorizedAccess();
        }

        return gradeManager.getGradesByStudent(student);
    }

    /**
     * @dev Get grades by course (coordinators and admins can view any, students can view own)
     */
    function getGradesByCourse(
        uint256 courseId
    ) external view systemMustBeInitialized returns (address[] memory studentIds, uint8[] memory grades) {
        // Validate course exists and is active
        if (!courseManager.isCourseActive(courseId)) {
            revert InvalidInput();
        }
        // Students can only view grades for courses they are enrolled in
        if (
            !ACCESS_CONTROL.hasRole(ACCESS_CONTROL.COORDINATOR_ROLE(), msg.sender) &&
            !ACCESS_CONTROL.hasRole(ACCESS_CONTROL.ADMIN_ROLE(), msg.sender)
        ) {
            revert UnauthorizedAccess();
        }
        return gradeManager.getGradesByCourse(courseId);
    }

    // =======================
    // SYSTEM MANAGEMENT
    // =======================

    /**
     * @dev Update contract addresses (admin only)
     */
    function updateContract(
        string calldata contractName,
        address newAddress
    ) external onlyAdmin systemMustBeInitialized {
        if (newAddress == address(0)) {
            revert InvalidContract();
        }

        bytes32 nameHash = keccak256(abi.encodePacked(contractName));

        if (nameHash == keccak256(abi.encodePacked("studentRegistry"))) {
            studentRegistry = IStudentRegistry(newAddress);
        } else if (nameHash == keccak256(abi.encodePacked("courseManager"))) {
            courseManager = ICourseManager(newAddress);
        } else if (nameHash == keccak256(abi.encodePacked("enrollmentRequest"))) {
            enrollmentRequest = IEnrollmentRequest(newAddress);
        } else {
            revert InvalidInput();
        }

        emit ContractUpdated(contractName, newAddress, msg.sender);
    }

    /**
     * @dev Get system status
     */
    function getSystemStatus()
        external
        view
        returns (bool initialized, bool paused, uint256 version, uint256 totalStudents, uint256 totalRequests)
    {
        initialized = systemInitialized;
        paused = ACCESS_CONTROL.paused();
        version = systemVersion;

        if (systemInitialized) {
            totalStudents = studentRegistry.getRegisteredStudentsCount();
            totalRequests = enrollmentRequest.getEnrollmentRequestsCount();
        }
    }

    /**
     * @dev Upgrade system version (admin only)
     */
    function upgradeSystem() external onlyAdmin {
        systemVersion++;
        emit SystemUpgraded(systemVersion, msg.sender);
    }
}
