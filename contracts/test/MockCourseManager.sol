// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ICourseManager} from "../interfaces/ICourseManager.sol";

/**
 * @title MockCourseManager
 * @dev Mock implementation of ICourseManager for testing purposes
 */
contract MockCourseManager is ICourseManager {
    mapping(string courseId => Course course) private _courses;
    mapping(string courseId => bool exists) private _courseExists;

    // Custom errors for testing
    error CourseDoesNotExist();
    error CourseNotActive();
    error CourseAlreadyExists();

    /**
     * @dev Add a course to the mock (for testing setup)
     */
    function addCourse(
        string calldata id,
        string calldata name,
        string calldata description,
        uint16 credits,
        uint16 maxStudents
    ) external {
        if (_courseExists[id]) {
            revert CourseAlreadyExists();
        }
        
        _courses[id] = Course({
            id: id,
            name: name,
            description: description,
            credits: credits,
            maxStudents: maxStudents,
            isActive: true
        });
        _courseExists[id] = true;
    }

    /**
     * @dev Deactivate a course (for testing)
     */
    function deactivateCourse(string calldata id) external {
        if (!_courseExists[id]) {
            revert CourseDoesNotExist();
        }
        _courses[id].isActive = false;
    }

    /**
     * @dev Activate a course (for testing)
     */
    function activateCourse(string calldata id) external {
        if (!_courseExists[id]) {
            revert CourseDoesNotExist();
        }
        _courses[id].isActive = true;
    }

    /**
     * @dev Get course information
     */
    function getCourse(string calldata id) external view override returns (Course memory course) {
        if (!_courseExists[id]) {
            revert CourseNotFound(id);
        }
        return _courses[id];
    }

    /**
     * @dev Check if course exists (helper for tests)
     */
    function courseExistsById(string calldata id) external view returns (bool courseExists) {
        courseExists = _courseExists[id];
    }

    /**
     * @dev Check if course is active (helper for tests)
     */
    function isCourseActive(string calldata id) external view returns (bool courseIsActive) {
        if (!_courseExists[id]) {
            revert CourseDoesNotExist();
        }
        courseIsActive = _courses[id].isActive;
    }
}
