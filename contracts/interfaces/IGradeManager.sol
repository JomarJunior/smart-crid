// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @title IGradeManager
 * @dev Interface for managing student grades in the CRID system
 */

interface IGradeManager {
    // Structures
    struct Grade {
        uint256 id;
        uint256 courseId;
        uint8 value;
        address student;
    }

    // Events
    event GradeAdded(address indexed student, uint256 indexed courseId, uint8 grade, address indexed agent);
    event GradeUpdated(address indexed student, uint256 indexed courseId, uint8 newGrade, address indexed agent);
    event GradeRemoved(address indexed student, uint256 indexed courseId, address indexed agent);

    // Custom errors
    error UnauthorizedAccess();
    error InvalidGrade();
    error GradeNotFound();
    error StudentNotFound();
    error CourseNotFound();

    // Functions
    function addGrade(address student, uint256 courseId, uint8 grade, address agent) external;
    function removeGrade(uint256 gradeId, address agent) external;

    function getGrade(address student, uint256 courseId) external view returns (uint8 grade);
    function getGradesByStudent(
        address student
    ) external view returns (uint256[] memory courseIds, uint8[] memory grades);
    function getGradesByCourse(
        uint256 courseId
    ) external view returns (address[] memory studentIds, uint8[] memory grades);
}
