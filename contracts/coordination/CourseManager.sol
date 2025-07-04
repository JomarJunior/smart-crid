// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ICourseManager} from "../interfaces/ICourseManager.sol";

/**
 * @title CourseManager
 * @dev Implementation of course management functionality
 */
contract CourseManager is ICourseManager {
    // State variables
    address public immutable CRID_CONTRACT; // Address of the CRID orchestrator contract
    mapping(uint256 courseId => Course course) public courses; // Store courses by ID
    uint256 public courseCount; // Total number of courses

    // Modifiers
    modifier onlyCRID() {
        if (msg.sender != CRID_CONTRACT) {
            revert UnauthorizedCaller();
        }
        _;
    }

    modifier validString(string calldata str) {
        if (bytes(str).length == 0) {
            revert InvalidInput("String cannot be empty");
        }
        _;
    }

    modifier onlyExistingCourse(uint256 courseId) {
        if (courses[courseId].id == 0) {
            revert CourseNotFound(courseId);
        }
        _;
    }

    constructor(address cridContract) {
        CRID_CONTRACT = cridContract;
    }


    /**
     * @dev Add a new course (only callable by CRID contract)
     */
    function addCourse(
        uint256 id,
        string calldata name,
        string calldata description,
        uint8 credits,
        uint16 maxStudents,
        address agent
    ) external onlyCRID validString(name) validString(description) {
        if (courses[id].id != 0) {
            revert CourseAlreadyExists(id);
        }

        courses[id] = Course({
            id: id,
            name: name,
            description: description,
            credits: credits,
            maxStudents: maxStudents,
            isActive: true
        });
        courseCount++;

        emit CourseAdded(courses[id], agent);
    }

    /**
     * @dev Update an existing course (only callable by CRID contract)
     */
    function updateCourse(
        uint256 id,
        string calldata name,
        string calldata description,
        uint8 credits,
        uint16 maxStudents,
        address agent
    ) external onlyCRID validString(name) validString(description) onlyExistingCourse(id) {
        Course storage existingCourse = courses[id];
        Course memory oldCourse = existingCourse;
        existingCourse.name = name;
        existingCourse.description = description;
        existingCourse.credits = credits;
        existingCourse.maxStudents = maxStudents;
        emit CourseUpdated(oldCourse, existingCourse, agent);
    }

    /**
     * @dev Activate a course (only callable by CRID contract)
     */
    function activateCourse(uint256 courseId, address agent) external onlyCRID onlyExistingCourse(courseId) {
        Course storage course = courses[courseId];
        if (course.isActive) {
            revert CourseAlreadyActive(courseId);
        }
        course.isActive = true;
        emit CourseActivated(courseId, agent);
    }

    /**
     * @dev Deactivate a course (only callable by CRID contract)
     */
    function deactivateCourse(uint256 courseId, address agent) external onlyCRID onlyExistingCourse(courseId) {
        Course storage course = courses[courseId];
        if (!course.isActive) {
            revert CourseInactive(courseId);
        }
        course.isActive = false;
        emit CourseDeactivated(courseId, agent);
    }

    /**
     * @dev Get course details by ID
     */
    function getCourse(uint256 id) external view onlyExistingCourse(id) returns (Course memory course) {
        return courses[id];
    }

    /**
     * @dev Check if a course is active
     */
    function isCourseActive(uint256 courseId) external view onlyExistingCourse(courseId) returns (bool isActive) {
        return courses[courseId].isActive;
    }

    /**
     * @dev Check if a course exists
     */
    function courseExists(uint256 courseId) external view returns (bool exists) {
        return courses[courseId].id != 0;
    }
}
