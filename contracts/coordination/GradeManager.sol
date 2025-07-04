// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IGradeManager} from "../interfaces/IGradeManager.sol";

/**
 * @title GradeManager
 * @dev Implementation of the IGradeManager interface for managing student grades
 */
contract GradeManager is IGradeManager {
    // State variables
    address public immutable CRID_ADDRESS;
    mapping(uint256 gradeId => Grade grade) public grades; // Maps gradeId to Grade
    mapping(address studentId => uint256[] gradeIds) public studentGrades; // Maps studentId to gradeIds
    mapping(uint256 courseId => uint256[] gradeIds) public courseGrades; // Maps courseId to gradeIds
    mapping(address studentId => mapping(uint256 courseId => uint8 grade)) public studentCourseGrades;
    uint256 public nextGradeId = 1;

    // Modifiers
    modifier onlyCRID() {
        if (msg.sender != CRID_ADDRESS) {
            revert UnauthorizedAccess();
        }
        _;
    }

    modifier validGradeValue(uint256 gradeValue) {
        if (gradeValue < 0 || gradeValue > 100) {
            revert InvalidGrade();
        }
        _;
    }

    modifier gradeExists(address studentId, uint256 courseId) {
        if (studentCourseGrades[studentId][courseId] == 0) {
            revert StudentNotFound();
        }
        _;
    }

    // Constructor
    constructor(address cridAddress) {
        CRID_ADDRESS = cridAddress;
    }

    // Functions
    function addGrade(
        address student,
        uint256 courseId,
        uint8 grade,
        address agent
    ) external onlyCRID validGradeValue(grade) {
        grades[nextGradeId] = Grade(nextGradeId, courseId, grade, student);
        studentGrades[student].push(nextGradeId);
        courseGrades[courseId].push(nextGradeId);
        studentCourseGrades[student][courseId] = grade;

        emit GradeAdded(student, courseId, grade, agent);
        nextGradeId++;
    }

    function removeGrade(uint256 gradeId, address agent) external onlyCRID {
        Grade storage grade = grades[gradeId];
        if (grade.id == 0) {
            revert GradeNotFound();
        }

        // Read values before deleting the grade
        address student = grade.student;
        uint256 courseId = grade.courseId;

        delete grades[gradeId];
        delete studentCourseGrades[student][courseId];

        // Remove from studentGrades and courseGrades mappings
        uint256[] storage studentGradeIds = studentGrades[student];
        uint256[] storage courseGradeIds = courseGrades[courseId];

        // Find and remove the gradeId from studentGrades
        uint256 studentGradeIdsLength = studentGradeIds.length;
        for (uint256 i = 0; i < studentGradeIdsLength; i++) {
            if (studentGradeIds[i] == gradeId) {
                studentGradeIds[i] = studentGradeIds[studentGradeIdsLength - 1];
                studentGradeIds.pop();
                break;
            }
        }

        // Find and remove the grade from courseGrades
        uint256 courseGradeIdsLength = courseGradeIds.length;
        for (uint256 i = 0; i < courseGradeIdsLength; i++) {
            if (courseGradeIds[i] == gradeId) {
                courseGradeIds[i] = courseGradeIds[courseGradeIdsLength - 1];
                courseGradeIds.pop();
                break;
            }
        }

        emit GradeRemoved(student, courseId, agent);
    }

    function getGrade(address student, uint256 courseId) 
        external 
        view 
        returns (uint8 grade) 
    {
        return studentCourseGrades[student][courseId];
    }

    function getGradesByStudent(address student) 
        external 
        view 
        returns (uint256[] memory courseIds, uint8[] memory _grades) 
    {
        uint256[] storage gradeIds = studentGrades[student];
        uint256 length = gradeIds.length;
        courseIds = new uint256[](length);
        _grades = new uint8[](length);

        for (uint256 i = 0; i < length; i++) {
            Grade storage grade = grades[gradeIds[i]];
            courseIds[i] = grade.courseId;
            _grades[i] = grade.value;
        }
    }

    function getGradesByCourse(uint256 courseId) 
        external 
        view 
        returns (address[] memory students, uint8[] memory _grades) 
    {
        uint256[] storage gradeIds = courseGrades[courseId];
        uint256 length = gradeIds.length;
        students = new address[](length);
        _grades = new uint8[](length);

        for (uint256 i = 0; i < length; i++) {
            Grade storage grade = grades[gradeIds[i]];
            students[i] = grade.student;
            _grades[i] = grade.value;
        }
    }
}