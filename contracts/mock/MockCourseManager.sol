// SPDX-License-Identifier: MIT
// solhint-disable ordering
pragma solidity ^0.8.0;

import {ICourseManager} from "../interfaces/ICourseManager.sol";

/**
 * @title MockCourseManager
 * @dev Mock implementation of the ICourseManager interface for testing purposes
 */
contract MockCourseManager is ICourseManager {
    mapping (uint256 courseId => bool isActive) private _activeCourses;

    event AddCourseCalled(
        uint256 courseId,
        string courseName,
        string courseDescription,
        uint256 credits,
        uint16 maxStudents,
        address agent
    );
    event ActivateCourseCalled(uint256 courseId, address agent);
    event DeactivateCourseCalled(uint256 courseId, address agent);

    function addCourse(
        uint256 id,
        string calldata name,
        string calldata description,
        uint8 credits,
        uint16 maxStudents,
        address agent
    ) external override {
        emit AddCourseCalled(id, name, description, credits, maxStudents, agent);
    }

    function activateCourse(uint256 courseId, address agent) external override {
        emit ActivateCourseCalled(courseId, agent);
        _activeCourses[courseId] = true; // Mock activation logic
    }

    function deactivateCourse(uint256 courseId, address agent) external override {
        emit DeactivateCourseCalled(courseId, agent);
        _activeCourses[courseId] = false; // Mock deactivation logic
    }

    function getCourse(uint256 id) external pure override returns (Course memory course) {
        // For mock purposes, we return a dummy course
        course = Course({
            id: id,
            name: "Mock Course",
            description: "This is a mock.",
            credits: 3,
            maxStudents: 30,
            isActive: true
        });
    }

    function isCourseActive(uint256 courseId) external view override returns (bool isActive) {
        isActive = _activeCourses[courseId];
    }

    function courseExists(uint256 courseId) external pure override returns (bool exists) {
        // For mock purposes, we return true
        courseId; // To avoid unused variable warning
        exists = true;
    }
}
