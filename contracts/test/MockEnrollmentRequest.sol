// SPDX-License-Identifier: MIT
// solhint-disable not-rely-on-time
pragma solidity ^0.8.0;

import {IEnrollmentRequest} from "../interfaces/IEnrollmentRequest.sol";

contract MockEnrollmentRequest is IEnrollmentRequest {
    event RequestEnrollmentCalled(uint256 courseId, address agent);
    event CancelEnrollmentRequestCalled(uint256 courseId, address agent);
    event ApproveEnrollmentRequestCalled(uint256 courseId, address agent);
    event RejectEnrollmentRequestCalled(uint256 courseId, address agent);

    function requestEnrollment(uint256 courseId, address agent) external override {
        emit RequestEnrollmentCalled(courseId, agent);
    }

    function cancelEnrollmentRequest(uint256 courseId, address agent) external override {
        emit CancelEnrollmentRequestCalled(courseId, agent);
    }

    function approveEnrollmentRequest(uint256 courseId, address agent) external override {
        emit ApproveEnrollmentRequestCalled(courseId, agent);
    }

    function rejectEnrollmentRequest(uint256 courseId, address agent) external override {
        emit RejectEnrollmentRequestCalled(courseId, agent);
    }

    function listAllEnrollmentRequests() external pure override returns (Request[] memory requestsList) {
        // For mock purposes, we return an empty array
        requestsList = new Request[](0);
    }

    function getEnrollmentRequest(uint256 requestId) external view override returns (Request memory request) {
        // For mock purposes, we return a dummy request
        request = Request({
            student: address(0x90F79bf6EB2c4f870365E785982E1f101E93b906), // Mock student address
            requestDate: block.timestamp,
            status: RequestStatus.Pending,
            id: requestId,
            courseId: 0
        });
    }

    function getEnrollmentRequestsByStudent(
        address student
    ) external pure override returns (uint256[] memory requestIds) {
        // For mock purposes, we return an empty array
        student; // To avoid unused variable warning
        return new uint256[](0);
    }

    function getEnrollmentRequestsByCourse(
        uint256 courseId
    ) external pure override returns (uint256[] memory requestIds) {
        // For mock purposes, we return an empty array
        courseId; // To avoid unused variable warning
        return new uint256[](0);
    }

    function getEnrollmentRequestsCount() external pure override returns (uint256 count) {
        // For mock purposes, we return 0
        count = 0;
    }
}
