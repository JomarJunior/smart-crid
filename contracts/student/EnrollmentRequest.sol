// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IStudentRegistry} from "../interfaces/IStudentRegistry.sol";
import {ICourseManager} from "../interfaces/ICourseManager.sol";
import {ICRIDAccessControl} from "../interfaces/ICRIDAccessControl.sol";

/**
 * @title EnrollmentRequest
 * @dev Contract to handle enrollment requests for courses
 * Student context - Enrollment request management
 */

contract EnrollmentRequest {
    // Enums for request status
    enum RequestStatus {
        Pending,
        Approved,
        Rejected,
        Cancelled
    }

    // Request structure
    struct Request {
        address student;
        uint256 requestDate;
        RequestStatus status;
        string id; // Unique request ID
        string studentId;
        string courseId;
    }

    // State variables
    IStudentRegistry public studentRegistry;
    ICourseManager public courseManager;

    mapping(string id => Request request) public requests; // Store requests by unique ID
    mapping(address student => string[] requestIds) public studentRequests; // Index requests by student
    mapping(string courseId => string[] requestIds) public courseRequests; // Index requests by course ID
    mapping(string studentId => string[] requestIds) public studentIdRequests; // Index requests by student ID
    uint256 public enrollmentRequestsCount; // Total number of requests

    // Events
    event EnrollmentRequested(string indexed studentId, string indexed courseId, string requestId);

    event EnrollmentRequestCancelled(string indexed requestId);

    event EnrollmentRequestApproved(string indexed requestId);

    event EnrollmentRequestRejected(string indexed requestId);

    // Custom errors
    error CourseNotFound();
    error AlreadyRequested();
    error CourseNotActive();
    error StudentNotActive();
    error StudentNotRegistered();
    error RequestDoesNotExist();
    error NotRequestOwner();
    error RequestNotPending();
    error SystemIsPaused();
    error InsufficientPermissions();

    // Modifiers
    modifier onlyActiveStudent() {
        if (!studentRegistry.isStudentActive(msg.sender)) {
            revert StudentNotActive();
        }
        _;
    }

    modifier onlyActiveCourse(string calldata courseId) {
        if (!courseManager.getCourse(courseId).isActive) {
            revert CourseNotActive();
        }
        _;
    }

    modifier onlyRequestOwner(string calldata requestId) {
        if (bytes(requests[requestId].id).length == 0) {
            revert RequestDoesNotExist();
        }
        if (requests[requestId].student != msg.sender) {
            revert NotRequestOwner();
        }
        _;
    }

    modifier onlyPendingRequest(string calldata requestId) {
        if (requests[requestId].status != RequestStatus.Pending) {
            revert RequestNotPending();
        }
        _;
    }

    modifier onlyRequestManagers() {
        ICRIDAccessControl accessControl = studentRegistry.getAccessControl();
        if (
            !accessControl.hasRole(accessControl.COORDINATOR_ROLE(), msg.sender) &&
            !accessControl.hasRole(accessControl.ADMIN_ROLE(), msg.sender)
        ) {
            revert InsufficientPermissions();
        }
        _;
    }

    modifier whenNotPaused() {
        ICRIDAccessControl accessControl = studentRegistry.getAccessControl();
        if (accessControl.paused()) {
            revert SystemIsPaused();
        }
        _;
    }

    // Constructor to initialize the contract with student registry and course manager
    constructor(IStudentRegistry _studentRegistry, ICourseManager _courseManager) {
        studentRegistry = _studentRegistry;
        courseManager = _courseManager;
    }

    /**
     * @dev Create a new enrollment request
     * @param courseId The ID of the course for which the request is made
     */
    function requestEnrollment(
        string calldata courseId
    ) external whenNotPaused onlyActiveCourse(courseId) onlyActiveStudent {
        string memory studentId = studentRegistry.getStudentId(msg.sender);
        string[] memory requestIds = studentRequests[msg.sender];

        // Check if the student has already requested enrollment for this course
        uint256 requestCount = requestIds.length;
        for (uint256 i = 0; i < requestCount; i++) {
            if (
                keccak256(abi.encodePacked(requests[requestIds[i]].courseId)) == keccak256(abi.encodePacked(courseId))
            ) {
                revert AlreadyRequested();
            }
        }

        // Create a new request
        string memory requestId = _generateRequestId();
        requests[requestId] = Request({
            student: msg.sender,
            requestDate: block.timestamp,
            status: RequestStatus.Pending,
            id: requestId,
            studentId: studentId,
            courseId: courseId
        });
        studentRequests[msg.sender].push(requestId);
        courseRequests[courseId].push(requestId);
        studentIdRequests[studentId].push(requestId);
        emit EnrollmentRequested(studentId, courseId, requestId);
    }

    /**
     * @dev Cancel an enrollment request
     * @param requestId The ID of the request to cancel
     */
    function cancelEnrollmentRequest(
        string calldata requestId
    ) external whenNotPaused onlyRequestOwner(requestId) onlyPendingRequest(requestId) {
        requests[requestId].status = RequestStatus.Cancelled;
        emit EnrollmentRequestCancelled(requestId);
    }

    /**
     * @dev Approve an enrollment request
     * @param requestId The ID of the request to approve
     */
    function approveEnrollment(string calldata requestId) external onlyRequestManagers onlyPendingRequest(requestId) {
        requests[requestId].status = RequestStatus.Approved;
        emit EnrollmentRequestApproved(requestId);
    }

    /**
     * @dev Reject an enrollment request
     * @param requestId The ID of the request to reject
     */
    function rejectEnrollment(string calldata requestId) external onlyRequestManagers onlyPendingRequest(requestId) {
        requests[requestId].status = RequestStatus.Rejected;
        emit EnrollmentRequestRejected(requestId);
    }

    /**
     * @dev Get sender's enrollment requests
     * @return requestIds An array of request IDs for the sender
     */
    function getMyEnrollmentRequests() external view returns (string[] memory requestIds) {
        requestIds = studentRequests[msg.sender];
    }

    /**
     * @dev Get data for a specific enrollment request
     * @param requestId The ID of the request to retrieve
     * @return request The request data
     */
    function getEnrollmentRequest(string calldata requestId) external view returns (Request memory request) {
        if (bytes(requests[requestId].id).length == 0) {
            revert RequestDoesNotExist();
        }
        request = requests[requestId];
    }

    /**
     * @dev Get Student Registry contract reference
     * @return studentRegistry_ The address of the student registry contract
     */
    function getStudentRegistry() external view returns (IStudentRegistry studentRegistry_) {
        studentRegistry_ = studentRegistry;
    }

    /**
     * @dev Get Course Manager contract reference
     * @return courseManager_ The address of the course manager contract
     */
    function getCourseManager() external view returns (ICourseManager courseManager_) {
        courseManager_ = courseManager;
    }

    /**
     * @dev Get the total count of enrollment requests
     * @return count The total number of requests created
     */
    function getEnrollmentRequestsCount() external view returns (uint256 count) {
        count = enrollmentRequestsCount;
    }

    /**
     * @dev Get Access Control contract reference
     * @return accessControl_ The address of the access control contract
     */
    function getAccessControl() external view returns (ICRIDAccessControl accessControl_) {
        accessControl_ = studentRegistry.getAccessControl();
    }

    /**
     * @dev Generate a unique request ID
     * @return nextId A unique string ID for the request
     */
    function _generateRequestId() internal returns (string memory nextId) {
        enrollmentRequestsCount++;
        nextId = string(abi.encodePacked("REQ-", _toString(enrollmentRequestsCount)));
    }

    /**
     * @dev Convert a uint256 to its ASCII string decimal representation.
     */
    function _toString(uint256 value) internal pure returns (string memory) {
        if (value == 0) {
            return "0";
        }
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }
}
