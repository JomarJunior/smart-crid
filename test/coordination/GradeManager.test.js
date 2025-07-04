const { expect } = require("chai");
const { testHelpers } = require("../fixtures/testHelpers");

describe("💯 Coordination Context - Grade Manager", function () {
  let gradeManager;
  let accounts;

  this.beforeEach(async function () {
    const setup = await testHelpers.setupGradeManager();
    gradeManager = setup.gradeManager;
    accounts = setup.accounts;
  });

  describe("Deployment", function () {
    it("should deploy with the correct admin", async function () {
      const { admin } = accounts;
      expect(await gradeManager.CRID_ADDRESS()).to.be.equal(admin.address);
    });

    it("should deploy with an initial nextGradeId of 1", async function () {
      expect(await gradeManager.nextGradeId()).to.equal(1);
    });
  });

  describe("Grade Management", function () {
    it("should add a new grade for a student", async function () {
      const { admin, student1 } = accounts;
      const courseId = 1;
      const grade = 85;

      await expect(
        gradeManager.connect(admin).addGrade(student1.address, courseId, grade, admin.address)
      )
        .to.emit(gradeManager, "GradeAdded")
        .withArgs(student1.address, courseId, grade, admin.address);

      const storedGrade = await gradeManager.getGrade(student1.address, courseId);
      expect(storedGrade).to.equal(grade);
      expect(await gradeManager.nextGradeId()).to.equal(2);
    });

    it("should revert if a non-CRID address tries to add a grade", async function () {
      const { student1, other } = accounts;
      await expect(
        gradeManager.connect(other).addGrade(student1.address, 1, 85, other.address)
      ).to.be.revertedWithCustomError(gradeManager, "UnauthorizedAccess");
    });

    it("should revert if the grade value is invalid", async function () {
      const { admin, student1 } = accounts;
      await expect(
        gradeManager.connect(admin).addGrade(student1.address, 1, 101, admin.address)
      ).to.be.revertedWithCustomError(gradeManager, "InvalidGrade");
    });

    it("should remove an existing grade", async function () {
      const { admin, student1 } = accounts;
      const courseId = 1;
      const grade = 90;
      await gradeManager.connect(admin).addGrade(student1.address, courseId, grade, admin.address);
      const gradeId = 1; // First grade has ID 1

      await expect(gradeManager.connect(admin).removeGrade(gradeId, admin.address))
        .to.emit(gradeManager, "GradeRemoved")
        .withArgs(student1.address, courseId, admin.address);

      const storedGrade = await gradeManager.getGrade(student1.address, courseId);
      // A deleted grade in the mapping returns the default value, which is 0
      expect(storedGrade).to.equal(0);
    });

    it("should revert when trying to remove a non-existent grade", async function () {
      const { admin } = accounts;
      await expect(gradeManager.connect(admin).removeGrade(999, admin.address))
        .to.be.revertedWithCustomError(gradeManager, "GradeNotFound");
    });
  });

  describe("Grade Queries", function () {
    beforeEach(async function () {
      const { admin, student1, student2 } = accounts;
      await gradeManager.connect(admin).addGrade(student1.address, 1, 85, admin.address);
      await gradeManager.connect(admin).addGrade(student1.address, 2, 95, admin.address);
      await gradeManager.connect(admin).addGrade(student2.address, 1, 75, admin.address);
    });

    it("should return the correct grade for a student in a course", async function () {
      const { student1 } = accounts;
      expect(await gradeManager.getGrade(student1.address, 1)).to.equal(85);
      expect(await gradeManager.getGrade(student1.address, 2)).to.equal(95);
    });

    it("should return all grades for a specific student", async function () {
      const { student1 } = accounts;
      const [courseIds, grades] = await gradeManager.getGradesByStudent(student1.address);

      expect(courseIds).to.have.lengthOf(2);
      expect(grades).to.have.lengthOf(2);
      // Note: The order is not guaranteed, so we check for inclusion
      expect(courseIds).to.deep.include(1n);
      expect(courseIds).to.deep.include(2n);
      expect(grades).to.deep.include(85n);
      expect(grades).to.deep.include(95n);
    });

    it("should return all grades for a specific course", async function () {
      const { student1, student2 } = accounts;
      const [students, grades] = await gradeManager.getGradesByCourse(1);

      expect(students).to.have.lengthOf(2);
      expect(grades).to.have.lengthOf(2);
      expect(students).to.include(student1.address);
      expect(students).to.include(student2.address);
      expect(grades).to.deep.include(85n);
      expect(grades).to.deep.include(75n);
    });

    it("should return empty arrays for a student with no grades", async function () {
      const { other } = accounts;
      const [courseIds, grades] = await gradeManager.getGradesByStudent(other.address);
      expect(courseIds).to.be.an("array").that.is.empty;
      expect(grades).to.be.an("array").that.is.empty;
    });

    it("should return empty arrays for a course with no grades", async function () {
      const [students, grades] = await gradeManager.getGradesByCourse(999);
      expect(students).to.be.an("array").that.is.empty;
      expect(grades).to.be.an("array").that.is.empty;
    });
  });
});
