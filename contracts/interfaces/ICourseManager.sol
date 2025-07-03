// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @title ICourseManager
 * @dev Public interface for course management in the CRID system
 */
interface ICourseManager {
    // Struct to represent a course
    struct Course {
        string id; // Unique identifier for the course
        string name; // Name of the course
        string description; // Description of the course
        uint16 credits; // Number of credits for the course
        uint16 maxStudents; // Maximum number of students allowed in the course
        bool isActive; // Whether the course is currently active
    }

    // Errors
    error CourseNotFound(string courseId);

    // Functions
    function getCourse(string calldata id) external view returns (Course memory course);
}
