// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IEnrollmentRequest {
    // Enums for request status
    enum RequestStatus {
        Pending,
        Approved,
        Rejected,
        Cancelled
    }

    // Request structure
    struct Request {
        address student; // Address of the student making the request
        uint256 requestDate; // Timestamp of when the request was made
        RequestStatus status; // Current status of the request
        uint256 id; // Unique request ID
        uint256 courseId; // ID of the course for which the request is made
    }

    // Events
    event EnrollmentRequested(uint256 indexed request, address indexed agent);
    event EnrollmentRequestCancelled(uint256 indexed requestId, address indexed agent);
    event EnrollmentRequestApproved(uint256 indexed requestId, address indexed agent);
    event EnrollmentRequestRejected(uint256 indexed requestId, address indexed agent);

    // Custom errors
    error CourseNotFound();
    error AlreadyRequested();
    error CourseNotActive();
    error StudentNotActive();
    error StudentNotRegistered();
    error RequestDoesNotExist();
    error NotRequestOwner();
    error RequestNotPending();
    error OnlyCRIDContract();
    error SystemIsPaused();
    error Unauthorized();
    error InvalidInput();

    // Functions
    function requestEnrollment(uint256 courseId, address agent) external;
    function cancelEnrollmentRequest(uint256 requestId, address agent) external;
    function approveEnrollmentRequest(uint256 requestId, address agent) external;
    function rejectEnrollmentRequest(uint256 requestId, address agent) external;
    function getEnrollmentRequest(uint256 requestId) external view returns (Request memory request);
    function getEnrollmentRequestsByStudent(address student) external view returns (uint256[] memory requestIds);
    function getEnrollmentRequestsByCourse(uint256 courseId) external view returns (uint256[] memory requestIds);
    function getEnrollmentRequestsCount() external view returns (uint256 count);
}
