// SPDX-License-Identifier: MIT
// solhint-disable not-rely-on-time
pragma solidity ^0.8.28;

import {IEnrollmentRequest} from "../interfaces/IEnrollmentRequest.sol";

/**
 * @title EnrollmentRequest
 * @dev Handles all enrollment request, approval, and rejection logic (Enrollment Context)
 * @notice This contract can only be called by the CRID orchestrator contract
 */
contract EnrollmentRequest is IEnrollmentRequest {
    // State variables
    address public immutable CRID_CONTRACT;

    mapping(uint256 requestId => Request request) public requests; // Store requests by unique ID
    mapping(address student => uint256[] requestIds) public studentRequests; // Index requests by student
    mapping(uint256 courseId => uint256[] requestIds) public courseRequests; // Index requests by course ID
    uint256 public enrollmentRequestsCount; // Total number of requests

    // Modifiers
    modifier onlyCRID() {
        if (msg.sender != CRID_CONTRACT) {
            revert OnlyCRIDContract();
        }
        _;
    }

    modifier requestExists(uint256 requestId) {
        if (requests[requestId].id == 0) {
            revert RequestDoesNotExist();
        }
        _;
    }

    modifier onlyPendingRequest(uint256 requestId) {
        if (requests[requestId].status != RequestStatus.Pending) {
            revert RequestNotPending();
        }
        _;
    }

    /**
     * @dev Constructor to initialize the contract with CRID contract address and dependencies
     * @param _cridContract Address of the CRID orchestrator contract
     */
    constructor(address _cridContract) {
        CRID_CONTRACT = _cridContract;
    }

    /**
     * @dev Create a new enrollment request (only callable by CRID contract)
     * @param courseId The ID of the course for which the request is made
     * @param agent The address of the student making the request
     */
    function requestEnrollment(uint256 courseId, address agent) external onlyCRID {
        if (agent == address(0)) {
            revert InvalidInput();
        }

        // Find all requests made by the student
        uint256[] memory requestIds = studentRequests[agent];

        // Check if the student has already requested enrollment for this course
        uint256 requestCount = requestIds.length;
        for (uint256 i = 0; i < requestCount; i++) {
            if (requests[requestIds[i]].courseId == courseId) {
                revert AlreadyRequested();
            }
        }

        // Create a new request
        Request memory newRequest = Request({
            student: agent,
            requestDate: block.timestamp,
            status: RequestStatus.Pending,
            id: _generateRequestId(),
            courseId: courseId
        });
        requests[newRequest.id] = newRequest;

        // Update mappings
        studentRequests[agent].push(newRequest.id);
        courseRequests[courseId].push(newRequest.id);

        // Emit event for enrollment request
        emit EnrollmentRequested(newRequest.id, agent);
    }

    /**
     * @dev Cancel an enrollment request (only callable by CRID contract)
     * @param requestId The ID of the request to cancel
     * @param agent The address of the student canceling the request
     */
    function cancelEnrollmentRequest(
        uint256 requestId,
        address agent
    ) external onlyCRID requestExists(requestId) onlyPendingRequest(requestId) {
        if (agent == address(0)) {
            revert InvalidInput();
        }

        if (requests[requestId].student != agent) {
            revert NotRequestOwner();
        }

        requests[requestId].status = RequestStatus.Cancelled;
        emit EnrollmentRequestCancelled(requestId, agent);
    }

    /**
     * @dev Approve an enrollment request (only callable by CRID contract)
     * @param requestId The ID of the request to approve
     * @param agent The address of the agent that is approving the request
     */
    function approveEnrollmentRequest(
        uint256 requestId,
        address agent
    ) external onlyCRID requestExists(requestId) onlyPendingRequest(requestId) {
        if (agent == address(0)) {
            revert InvalidInput();
        }
        requests[requestId].status = RequestStatus.Approved;
        emit EnrollmentRequestApproved(requestId, agent);
    }

    /**
     * @dev Reject an enrollment request (only callable by CRID contract)
     * @param requestId The ID of the request to reject
     * @param agent The address of the agent that is rejecting the request
     */
    function rejectEnrollmentRequest(
        uint256 requestId,
        address agent
    ) external onlyCRID requestExists(requestId) onlyPendingRequest(requestId) {
        if (agent == address(0)) {
            revert InvalidInput();
        }
        requests[requestId].status = RequestStatus.Rejected;
        emit EnrollmentRequestRejected(requestId, agent);
    }

    /**
     * @dev Get all enrollment requests
     * @return requestsList An array of all enrollment requests
     */
    function listAllEnrollmentRequests() external view returns (Request[] memory requestsList) {
        uint256 totalRequests = enrollmentRequestsCount;
        requestsList = new Request[](totalRequests);
        uint256 index = 0;

        for (uint256 i = 1; i <= totalRequests; i++) {
            requestsList[index] = requests[i];
            index++;
        }

        return requestsList;
    }

    /**
     * @dev Get data for a specific enrollment request
     * @param requestId The ID of the request to retrieve
     * @return request The request data
     */
    function getEnrollmentRequest(
        uint256 requestId
    ) external view requestExists(requestId) returns (Request memory request) {
        return requests[requestId];
    }

    /**
     * @dev Get enrollment requests by student address
     * @param studentAddress The address of the student
     * @return requestIds An array of request IDs for the student
     */
    function getEnrollmentRequestsByStudent(
        address studentAddress
    ) external view returns (uint256[] memory requestIds) {
        return studentRequests[studentAddress];
    }

    /**
     * @dev Get enrollment requests by course ID
     * @param courseId The ID of the course
     * @return requestIds An array of request IDs for the course
     */
    function getEnrollmentRequestsByCourse(uint256 courseId) external view returns (uint256[] memory requestIds) {
        return courseRequests[courseId];
    }

    /**
     * @dev Get the total count of enrollment requests
     * @return count The total number of requests created
     */
    function getEnrollmentRequestsCount() external view returns (uint256 count) {
        count = enrollmentRequestsCount;
    }

    /**
     * @dev Generate a unique request ID
     * @return nextId A unique ID for the request
     */
    function _generateRequestId() internal returns (uint256 nextId) {
        enrollmentRequestsCount++;
        nextId = enrollmentRequestsCount;
    }
}
