const { expect } = require("chai");
const { testHelpers } = require("../fixtures/testHelpers");

describe("🏛️ Coordination Context - Course Manager", function () {
  let courseManager;
  let accounts;
  let course;

  this.beforeEach(async function () {
    const setup = await testHelpers.setupCourseManager();
    courseManager = setup.courseManager;
    accounts = setup.accounts;
    const courseData = await testHelpers.validCourseData();
    course = courseData.course1;
  });

  describe("Deployment", function () {
    it("should deploy with the correct admin", async function () {
      const { admin } = accounts;
      expect(await courseManager.CRID_CONTRACT()).to.be.equal(admin.address);
    });

    it("should deploy with an empty course list", async function () {
      expect(await courseManager.courseCount()).to.equal(0);
    });
  });

  describe("Course Creation", function () {
    it("should add a new course", async function () {
      const { admin } = accounts;
      await expect(
        courseManager
          .connect(admin)
          .addCourse(
            course.id,
            course.name,
            course.description,
            course.credits,
            course.maxStudents,
            admin.address
          )
      ).to.emit(courseManager, "CourseAdded");

      const storedCourse = await courseManager.getCourse(course.id);
      expect(storedCourse.id).to.equal(course.id);
      expect(storedCourse.name).to.equal(course.name);
      expect(await courseManager.courseCount()).to.equal(1);
    });

    it("should revert when not called by the CRID contract", async function () {
      const { other } = accounts;
      await expect(
        courseManager
          .connect(other)
          .addCourse(
            course.id,
            course.name,
            course.description,
            course.credits,
            course.maxStudents,
            other.address
          )
      ).to.be.revertedWithCustomError(courseManager, "UnauthorizedCaller");
    });

    it("should revert when adding a course with an existing ID", async function () {
      const { admin } = accounts;
      await courseManager
        .connect(admin)
        .addCourse(
          course.id,
          course.name,
          course.description,
          course.credits,
          course.maxStudents,
          admin.address
        );

      await expect(
        courseManager
          .connect(admin)
          .addCourse(
            course.id,
            "Another Course",
            "Another Description",
            3,
            50,
            admin.address
          )
      ).to.be.revertedWithCustomError(courseManager, "CourseAlreadyExists");
    });

    it("should revert when name is empty", async function () {
      const { admin } = accounts;
      await expect(
        courseManager
          .connect(admin)
          .addCourse(
            course.id,
            "",
            course.description,
            course.credits,
            course.maxStudents,
            admin.address
          )
      ).to.be.revertedWithCustomError(courseManager, "InvalidInput");
    });

    it("should revert when description is empty", async function () {
      const { admin } = accounts;
      await expect(
        courseManager
          .connect(admin)
          .addCourse(
            course.id,
            course.name,
            "",
            course.credits,
            course.maxStudents,
            admin.address
          )
      ).to.be.revertedWithCustomError(courseManager, "InvalidInput");
    });
  });

  describe("Course Update", function () {
    beforeEach(async function () {
      const { admin } = accounts;
      await courseManager
        .connect(admin)
        .addCourse(
          course.id,
          course.name,
          course.description,
          course.credits,
          course.maxStudents,
          admin.address
        );
    });

    it("should update an existing course", async function () {
      const { admin } = accounts;
      const updatedName = "Advanced Solidity";
      const updatedDescription = "An advanced course on Solidity";
      const updatedCredits = 5;
      const updatedMaxStudents = 150;

      await expect(
        courseManager
          .connect(admin)
          .updateCourse(
            course.id,
            updatedName,
            updatedDescription,
            updatedCredits,
            updatedMaxStudents,
            admin.address
          )
      ).to.emit(courseManager, "CourseUpdated");

      const storedCourse = await courseManager.getCourse(course.id);
      expect(storedCourse.name).to.equal(updatedName);
      expect(storedCourse.description).to.equal(updatedDescription);
      expect(storedCourse.credits).to.equal(updatedCredits);
      expect(storedCourse.maxStudents).to.equal(updatedMaxStudents);
    });

    it("should revert when not called by the CRID contract", async function () {
      const { other } = accounts;
      await expect(
        courseManager
          .connect(other)
          .updateCourse(
            course.id,
            "New Name",
            "New Desc",
            4,
            120,
            other.address
          )
      ).to.be.revertedWithCustomError(courseManager, "UnauthorizedCaller");
    });

    it("should revert when updating a non-existent course", async function () {
      const { admin } = accounts;
      const nonExistentId = 999;
      await expect(
        courseManager
          .connect(admin)
          .updateCourse(
            nonExistentId,
            "New Name",
            "New Desc",
            4,
            120,
            admin.address
          )
      ).to.be.revertedWithCustomError(courseManager, "CourseNotFound");
    });
  });

  describe("Course Status Management", function () {
    beforeEach(async function () {
      const { admin } = accounts;
      await courseManager
        .connect(admin)
        .addCourse(
          course.id,
          course.name,
          course.description,
          course.credits,
          course.maxStudents,
          admin.address
        );
    });

    it("should deactivate an active course", async function () {
      const { admin } = accounts;
      await expect(
        courseManager.connect(admin).deactivateCourse(course.id, admin.address)
      ).to.emit(courseManager, "CourseDeactivated");
      expect(await courseManager.isCourseActive(course.id)).to.be.false;
    });

    it("should revert deactivating a non-existent course", async function () {
      const { admin } = accounts;
      await expect(
        courseManager.connect(admin).deactivateCourse(999, admin.address)
      ).to.be.revertedWithCustomError(courseManager, "CourseNotFound");
    });

    it("should revert deactivating an already inactive course", async function () {
      const { admin } = accounts;
      await courseManager
        .connect(admin)
        .deactivateCourse(course.id, admin.address);
      await expect(
        courseManager.connect(admin).deactivateCourse(course.id, admin.address)
      ).to.be.revertedWithCustomError(courseManager, "CourseInactive");
    });

    it("should activate an inactive course", async function () {
      const { admin } = accounts;
      await courseManager
        .connect(admin)
        .deactivateCourse(course.id, admin.address);
      await expect(
        courseManager.connect(admin).activateCourse(course.id, admin.address)
      ).to.emit(courseManager, "CourseActivated");
      expect(await courseManager.isCourseActive(course.id)).to.be.true;
    });

    it("should revert activating a non-existent course", async function () {
      const { admin } = accounts;
      await expect(
        courseManager.connect(admin).activateCourse(999, admin.address)
      ).to.be.revertedWithCustomError(courseManager, "CourseNotFound");
    });

    it("should revert activating an already active course", async function () {
      const { admin } = accounts;
      await expect(
        courseManager.connect(admin).activateCourse(course.id, admin.address)
      ).to.be.revertedWithCustomError(courseManager, "CourseAlreadyActive");
    });
  });

  describe("Course Queries", function () {
    beforeEach(async function () {
      const { admin } = accounts;
      await courseManager
        .connect(admin)
        .addCourse(
          course.id,
          course.name,
          course.description,
          course.credits,
          course.maxStudents,
          admin.address
        );
    });

    it("should return correct course data", async function () {
      const storedCourse = await courseManager.getCourse(course.id);
      expect(storedCourse.id).to.equal(course.id);
      expect(storedCourse.name).to.equal(course.name);
      expect(storedCourse.description).to.equal(course.description);
      expect(storedCourse.credits).to.equal(course.credits);
      expect(storedCourse.maxStudents).to.equal(course.maxStudents);
      expect(storedCourse.isActive).to.be.true;
    });

    it("should revert getting non-existent course data", async function () {
      await expect(courseManager.getCourse(999)).to.be.revertedWithCustomError(
        courseManager,
        "CourseNotFound"
      );
    });

    it("should return true for an existing course", async function () {
      expect(await courseManager.courseExists(course.id)).to.be.true;
    });

    it("should return false for a non-existent course", async function () {
      expect(await courseManager.courseExists(999)).to.be.false;
    });

    it("should return true for an active course", async function () {
      expect(await courseManager.isCourseActive(course.id)).to.be.true;
    });

    it("should return false for an inactive course", async function () {
      const { admin } = accounts;
      await courseManager
        .connect(admin)
        .deactivateCourse(course.id, admin.address);
      expect(await courseManager.isCourseActive(course.id)).to.be.false;
    });

    it("should revert checking active status of non-existent course", async function () {
      await expect(
        courseManager.isCourseActive(999)
      ).to.be.revertedWithCustomError(courseManager, "CourseNotFound");
    });
  });
});
