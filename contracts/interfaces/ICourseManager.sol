// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @title ICourseManager
 * @dev Public interface for course management in the CRID system
 * @notice All functions should only be callable by the CRID orchestrator
 */
interface ICourseManager {
    // Struct to represent a course
    struct Course {
        uint256 id; // Unique identifier for the course
        string name; // Name of the course
        string description; // Description of the course
        uint16 credits; // Number of credits for the course
        uint16 maxStudents; // Maximum number of students allowed in the course
        bool isActive; // Whether the course is currently active
    }

    // Events
    event CourseAdded(Course course, address indexed agent);
    event CourseUpdated(Course oldCourse, Course newCourse, address indexed agent);
    event CourseActivated(uint256 indexed courseId, address indexed agent);
    event CourseDeactivated(uint256 indexed courseId, address indexed agent);

    // Errors
    error CourseNotFound(uint256 courseId);
    error CourseAlreadyExists(uint256 courseId);
    error UnauthorizedCaller();
    error InvalidInput(string message);
    error CourseInactive(uint256 courseId);
    error CourseAlreadyActive(uint256 courseId);

    // Course management functions (only callable by CRID)
    function addCourse(
        uint256 id,
        string calldata name,
        string calldata description,
        uint8 credits,
        uint16 maxStudents,
        address agent
    ) external;

    function updateCourse(
        uint256 id,
        string calldata name,
        string calldata description,
        uint8 credits,
        uint16 maxStudents,
        address agent
    ) external;

    function activateCourse(uint256 courseId, address agent) external;
    function deactivateCourse(uint256 courseId, address agent) external;

    // View functions
    function listAllCourses() external view returns (Course[] memory courses);
    function getCourse(uint256 id) external view returns (Course memory course);
    function isCourseActive(uint256 courseId) external view returns (bool isActive);
    function courseExists(uint256 courseId) external view returns (bool exists);
}
