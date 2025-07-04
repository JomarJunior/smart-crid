const { expect } = require("chai");
const testHelpers = require("../fixtures/testHelpers");

describe("🧪 Test Context - MockCourseManager", function () {
  let courseManager;
  let accounts;
  let validCourseData;

  beforeEach(async function () {
    courseManager = await testHelpers.deployMockCourseManager();
    accounts = await testHelpers.getTestAccounts();
    validCourseData = testHelpers.getValidCourseData();
  });

  describe("Course Management", function () {
    it("Should allow adding new courses", async function () {
      const course = validCourseData.course1;
      
      await expect(
        courseManager.addCourse(course.id, course.name, course.description, course.credits, course.maxStudents)
      ).to.not.be.reverted;

      const addedCourse = await courseManager.getCourse(course.id);
      expect(addedCourse.id).to.equal(course.id);
      expect(addedCourse.name).to.equal(course.name);
      expect(addedCourse.description).to.equal(course.description);
      expect(addedCourse.credits).to.equal(course.credits);
      expect(addedCourse.maxStudents).to.equal(course.maxStudents);
      expect(addedCourse.isActive).to.be.true;
    });

    it("Should reject adding duplicate courses", async function () {
      const course = validCourseData.course1;
      
      await courseManager.addCourse(course.id, course.name, course.description, course.credits, course.maxStudents);
      
      await expect(
        courseManager.addCourse(course.id, course.name, course.description, course.credits, course.maxStudents)
      ).to.be.revertedWithCustomError(courseManager, "CourseAlreadyExists");
    });

    it("Should allow deactivating existing courses", async function () {
      const course = validCourseData.course1;
      
      await courseManager.addCourse(course.id, course.name, course.description, course.credits, course.maxStudents);
      await courseManager.deactivateCourse(course.id);
      
      const deactivatedCourse = await courseManager.getCourse(course.id);
      expect(deactivatedCourse.isActive).to.be.false;
    });

    it("Should reject deactivating non-existent courses", async function () {
      await expect(
        courseManager.deactivateCourse("NONEXISTENT")
      ).to.be.revertedWithCustomError(courseManager, "CourseDoesNotExist");
    });

    it("Should allow activating existing courses", async function () {
      const course = validCourseData.course1;
      
      await courseManager.addCourse(course.id, course.name, course.description, course.credits, course.maxStudents);
      await courseManager.deactivateCourse(course.id);
      await courseManager.activateCourse(course.id);
      
      const activatedCourse = await courseManager.getCourse(course.id);
      expect(activatedCourse.isActive).to.be.true;
    });

    it("Should reject activating non-existent courses", async function () {
      await expect(
        courseManager.activateCourse("NONEXISTENT")
      ).to.be.revertedWithCustomError(courseManager, "CourseDoesNotExist");
    });
  });

  describe("Course Queries", function () {
    beforeEach(async function () {
      const course = validCourseData.course1;
      await courseManager.addCourse(course.id, course.name, course.description, course.credits, course.maxStudents);
    });

    it("Should retrieve course information correctly", async function () {
      const course = validCourseData.course1;
      const retrievedCourse = await courseManager.getCourse(course.id);
      
      expect(retrievedCourse.id).to.equal(course.id);
      expect(retrievedCourse.name).to.equal(course.name);
      expect(retrievedCourse.description).to.equal(course.description);
      expect(retrievedCourse.credits).to.equal(course.credits);
      expect(retrievedCourse.maxStudents).to.equal(course.maxStudents);
      expect(retrievedCourse.isActive).to.be.true;
    });

    it("Should reject queries for non-existent courses", async function () {
      await expect(
        courseManager.getCourse("NONEXISTENT")
      ).to.be.revertedWithCustomError(courseManager, "CourseNotFound");
    });

    it("Should correctly check course existence", async function () {
      const course = validCourseData.course1;
      
      expect(await courseManager.courseExistsById(course.id)).to.be.true;
      expect(await courseManager.courseExistsById("NONEXISTENT")).to.be.false;
    });

    it("Should correctly check course active status", async function () {
      const course = validCourseData.course1;
      
      expect(await courseManager.isCourseActive(course.id)).to.be.true;
      
      await courseManager.deactivateCourse(course.id);
      expect(await courseManager.isCourseActive(course.id)).to.be.false;
      
      await courseManager.activateCourse(course.id);
      expect(await courseManager.isCourseActive(course.id)).to.be.true;
    });

    it("Should reject active status check for non-existent courses", async function () {
      await expect(
        courseManager.isCourseActive("NONEXISTENT")
      ).to.be.revertedWithCustomError(courseManager, "CourseDoesNotExist");
    });
  });

  describe("Edge Cases", function () {
    it("Should handle courses with empty strings", async function () {
      await expect(
        courseManager.addCourse("", "", "", 0, 0)
      ).to.not.be.reverted;
      
      const course = await courseManager.getCourse("");
      expect(course.id).to.equal("");
      expect(course.name).to.equal("");
      expect(course.description).to.equal("");
      expect(course.credits).to.equal(0);
      expect(course.maxStudents).to.equal(0);
    });

    it("Should handle courses with maximum values", async function () {
      const maxUint16 = 65535;
      await expect(
        courseManager.addCourse("MAX_COURSE", "Max Course", "Max Description", maxUint16, maxUint16)
      ).to.not.be.reverted;
      
      const course = await courseManager.getCourse("MAX_COURSE");
      expect(course.credits).to.equal(maxUint16);
      expect(course.maxStudents).to.equal(maxUint16);
    });

    it("Should handle special characters in course data", async function () {
      const specialId = "COURSE-123_ÁÉÍ@#$";
      const specialName = "Курс Тест 测试 🎓";
      const specialDesc = "Description with émojis 🚀 and spëcial chars!";
      
      await expect(
        courseManager.addCourse(specialId, specialName, specialDesc, 3, 30)
      ).to.not.be.reverted;
      
      const course = await courseManager.getCourse(specialId);
      expect(course.id).to.equal(specialId);
      expect(course.name).to.equal(specialName);
      expect(course.description).to.equal(specialDesc);
    });

    it("Should handle multiple course operations", async function () {
      const courses = [validCourseData.course1, validCourseData.course2];
      
      // Add multiple courses
      for (const course of courses) {
        await courseManager.addCourse(course.id, course.name, course.description, course.credits, course.maxStudents);
      }
      
      // Verify all courses exist
      for (const course of courses) {
        expect(await courseManager.courseExistsById(course.id)).to.be.true;
        expect(await courseManager.isCourseActive(course.id)).to.be.true;
      }
      
      // Deactivate one course
      await courseManager.deactivateCourse(courses[0].id);
      expect(await courseManager.isCourseActive(courses[0].id)).to.be.false;
      expect(await courseManager.isCourseActive(courses[1].id)).to.be.true;
    });
  });
});
