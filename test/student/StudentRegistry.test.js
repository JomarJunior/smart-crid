import { expect } from "chai";
import { testHelpers } from "../fixtures/testHelpers.js";

describe("🎓 Student Context - Student Registry", function () {
  let studentRegistry;
  let accounts;

  this.beforeEach(async function () {
    const setup = await testHelpers.setupStudentRegistry();
    studentRegistry = setup.studentRegistry;
    accounts = setup.accounts;
  });

  describe("Deployment", function () {
    it("should deploy with empty student list", async function () {
      expect(await studentRegistry.getRegisteredStudentsCount()).to.equal(0);
    });

    it("should deploy with the correct admin", async function () {
      const { admin } = accounts;
      expect(await studentRegistry.CRID_CONTRACT()).to.be.equal(admin.address);
    });
  });

  describe("Student Registration", function () {
    it("should register a new student", async function () {
      const { admin } = accounts;
      const { student1 } = await testHelpers.validStudentData();
      expect(
        await studentRegistry
          .connect(admin)
          .registerStudent(
            student1.studentAddress,
            student1.id,
            student1.fullName,
            student1.email,
            student1.program,
            student1.enrollmentYear,
            admin.address
          )
      ).to.emit(studentRegistry, "StudentRegistered");
    });
    it("should handle accents in student names", async function () {
      const { admin } = accounts;
      const { accentedFullName } = await testHelpers.edgeCasesStudentData();
      expect(
        await studentRegistry
          .connect(admin)
          .registerStudent(
            accentedFullName.studentAddress,
            accentedFullName.id,
            accentedFullName.fullName,
            accentedFullName.email,
            accentedFullName.program,
            accentedFullName.enrollmentYear,
            admin.address
          )
      ).to.emit(studentRegistry, "StudentRegistered");
    });
    it("should handle accents in student programs", async function () {
      const { admin } = accounts;
      const { accentedProgram } = await testHelpers.edgeCasesStudentData();
      expect(
        await studentRegistry
          .connect(admin)
          .registerStudent(
            accentedProgram.studentAddress,
            accentedProgram.id,
            accentedProgram.fullName,
            accentedProgram.email,
            accentedProgram.program,
            accentedProgram.enrollmentYear,
            admin.address
          )
      ).to.emit(studentRegistry, "StudentRegistered");
    });

    it("should not allow duplicate student id registration", async function () {
      const { admin } = accounts;
      const { student1 } = await testHelpers.validStudentData();
      await studentRegistry
        .connect(admin)
        .registerStudent(
          student1.studentAddress,
          student1.id,
          student1.fullName,
          student1.email,
          student1.program,
          student1.enrollmentYear,
          admin.address
        );

      await expect(
        studentRegistry
          .connect(admin)
          .registerStudent(
            student1.studentAddress,
            student1.id,
            student1.fullName,
            student1.email,
            student1.program,
            student1.enrollmentYear,
            admin.address
          )
      ).to.be.revertedWithCustomError(studentRegistry, "DuplicateStudentId");
    });

    it("should not allow duplicate student address registration", async function () {
      const { admin } = accounts;
      const { student1 } = await testHelpers.validStudentData();
      await studentRegistry
        .connect(admin)
        .registerStudent(
          student1.studentAddress,
          student1.id,
          student1.fullName,
          student1.email,
          student1.program,
          student1.enrollmentYear,
          admin.address
        );

      await expect(
        studentRegistry.connect(admin).registerStudent(
          student1.studentAddress,
          "123456789", // Different ID
          student1.fullName,
          student1.email,
          student1.program,
          student1.enrollmentYear,
          admin.address
        )
      ).to.be.revertedWithCustomError(studentRegistry, "AlreadyRegistered");
    });

    it("should revert when trying to register with zero address", async function () {
      const { admin } = accounts;
      const { zeroAddress } = await testHelpers.invalidStudentData();
      await expect(
        studentRegistry
          .connect(admin)
          .registerStudent(
            zeroAddress.studentAddress,
            zeroAddress.id,
            zeroAddress.fullName,
            zeroAddress.email,
            zeroAddress.program,
            zeroAddress.enrollmentYear,
            admin.address
          )
      ).to.be.revertedWithCustomError(studentRegistry, "InvalidInput");
    });

    it("should revert when trying to register with empty ID", async function () {
      const { admin } = accounts;
      const { emptyId } = await testHelpers.invalidStudentData();
      await expect(
        studentRegistry
          .connect(admin)
          .registerStudent(
            emptyId.studentAddress,
            emptyId.id,
            emptyId.fullName,
            emptyId.email,
            emptyId.program,
            emptyId.enrollmentYear,
            admin.address
          )
      ).to.be.revertedWithCustomError(studentRegistry, "InvalidInput");
    });

    it("should revert when trying to register with empty full name", async function () {
      const { admin } = accounts;
      const { emptyFullName } = await testHelpers.invalidStudentData();
      await expect(
        studentRegistry
          .connect(admin)
          .registerStudent(
            emptyFullName.studentAddress,
            emptyFullName.id,
            emptyFullName.fullName,
            emptyFullName.email,
            emptyFullName.program,
            emptyFullName.enrollmentYear,
            admin.address
          )
      ).to.be.revertedWithCustomError(studentRegistry, "InvalidInput");
    });
    it("should revert when trying to register with empty email", async function () {
      const { admin } = accounts;
      const { emptyEmail } = await testHelpers.invalidStudentData();
      await expect(
        studentRegistry
          .connect(admin)
          .registerStudent(
            emptyEmail.studentAddress,
            emptyEmail.id,
            emptyEmail.fullName,
            emptyEmail.email,
            emptyEmail.program,
            emptyEmail.enrollmentYear,
            admin.address
          )
      ).to.be.revertedWithCustomError(studentRegistry, "InvalidInput");
    });
    it("should revert when trying to register with empty program", async function () {
      const { admin } = accounts;
      const { emptyProgram } = await testHelpers.invalidStudentData();
      await expect(
        studentRegistry
          .connect(admin)
          .registerStudent(
            emptyProgram.studentAddress,
            emptyProgram.id,
            emptyProgram.fullName,
            emptyProgram.email,
            emptyProgram.program,
            emptyProgram.enrollmentYear,
            admin.address
          )
      ).to.be.revertedWithCustomError(studentRegistry, "InvalidInput");
    });

    it("should revert when not being called by the admin", async function () {
      const { student1 } = accounts;
      const { student2 } = await testHelpers.validStudentData();
      await expect(
        studentRegistry
          .connect(student1)
          .registerStudent(
            student2.studentAddress,
            student2.id,
            student2.fullName,
            student2.email,
            student2.program,
            student2.enrollmentYear,
            student1.address
          )
      ).to.be.revertedWithCustomError(studentRegistry, "OnlyCRIDContract");
    });
  });

  describe("Student Status Management", function () {
    it("should register a student with active status", async function () {
      const { admin } = accounts;
      const { student1 } = await testHelpers.validStudentData();
      await studentRegistry
        .connect(admin)
        .registerStudent(
          student1.studentAddress,
          student1.id,
          student1.fullName,
          student1.email,
          student1.program,
          student1.enrollmentYear,
          admin.address
        );

      const student = await studentRegistry.getStudentByAddress(student1.studentAddress);
      expect(student.isActive).to.equal(true);
    });
    it("should be able to deactivate a student", async function () {
      const { admin } = accounts;
      const { student1 } = await testHelpers.validStudentData();
      await studentRegistry
        .connect(admin)
        .registerStudent(
          student1.studentAddress,
          student1.id,
          student1.fullName,
          student1.email,
          student1.program,
          student1.enrollmentYear,
          admin.address
        );

      expect(
        await studentRegistry.connect(admin).deactivateStudentById(student1.id, admin.address)
      ).to.emit(studentRegistry, "StudentDeactivated");

      const student = await studentRegistry.getStudentByAddress(student1.studentAddress);
      expect(student.isActive).to.equal(false);
    });

    it("should be able to reactivate a student", async function () {
      const { admin } = accounts;
      const { student1 } = await testHelpers.validStudentData();
      await studentRegistry
        .connect(admin)
        .registerStudent(
          student1.studentAddress,
          student1.id,
          student1.fullName,
          student1.email,
          student1.program,
          student1.enrollmentYear,
          admin.address
        );

      await studentRegistry.connect(admin).deactivateStudentById(student1.id, admin.address);

      expect(
        await studentRegistry.connect(admin).activateStudentById(student1.id, admin.address)
      ).to.emit(studentRegistry, "StudentReactivated");

      const student = await studentRegistry.getStudentByAddress(student1.studentAddress);
      expect(student.isActive).to.equal(true);
    });
    it("should revert when trying to deactivate a non-existent student", async function () {
      const { admin } = accounts;
      const { student1 } = await testHelpers.validStudentData();
      await expect(
        studentRegistry.connect(admin).deactivateStudentById(student1.id, admin.address)
      ).to.be.revertedWithCustomError(studentRegistry, "NotRegistered");
    });
    it("should revert when trying to reactivate a non-existent student", async function () {
      const { admin } = accounts;
      const { student1 } = await testHelpers.validStudentData();
      await expect(
        studentRegistry.connect(admin).activateStudentById(student1.id, admin.address)
      ).to.be.revertedWithCustomError(studentRegistry, "NotRegistered");
    });
    it("should revert when trying to deactivate an already deactivated student", async function () {
      const { admin } = accounts;
      const { student1 } = await testHelpers.validStudentData();
      await studentRegistry
        .connect(admin)
        .registerStudent(
          student1.studentAddress,
          student1.id,
          student1.fullName,
          student1.email,
          student1.program,
          student1.enrollmentYear,
          admin.address
        );

      await studentRegistry.connect(admin).deactivateStudentById(student1.id, admin.address);

      await expect(
        studentRegistry.connect(admin).deactivateStudentById(student1.id, admin.address)
      ).to.be.revertedWithCustomError(studentRegistry, "NotActive");
    });
    it("should revert when trying to reactivate an already active student", async function () {
      const { admin } = accounts;
      const { student1 } = await testHelpers.validStudentData();
      await studentRegistry
        .connect(admin)
        .registerStudent(
          student1.studentAddress,
          student1.id,
          student1.fullName,
          student1.email,
          student1.program,
          student1.enrollmentYear,
          admin.address
        );

      await expect(
        studentRegistry.connect(admin).activateStudentById(student1.id, admin.address)
      ).to.be.revertedWithCustomError(studentRegistry, "AlreadyActive");
    });
  });

  describe("Student Queries", function () {
    it("should return the correct student data by address", async function () {
      const { admin } = accounts;
      const { student1 } = await testHelpers.validStudentData();
      await studentRegistry
        .connect(admin)
        .registerStudent(
          student1.studentAddress,
          student1.id,
          student1.fullName,
          student1.email,
          student1.program,
          student1.enrollmentYear,
          admin.address
        );

      const student = await studentRegistry.getStudentByAddress(student1.studentAddress);
      expect(student.id).to.equal(student1.id);
      expect(student.fullName).to.equal(student1.fullName);
      expect(student.email).to.equal(student1.email);
      expect(student.program).to.equal(student1.program);
      expect(student.enrollmentYear).to.equal(student1.enrollmentYear);
    });
    it("should revert when trying to get a student by address that is not registered", async function () {
      const { admin } = accounts;
      const { student1 } = await testHelpers.validStudentData();
      await expect(
        studentRegistry.getStudentByAddress(student1.studentAddress)
      ).to.be.revertedWithCustomError(studentRegistry, "NotRegistered");
    });
    it("should return the correct student data by ID", async function () {
      const { admin } = accounts;
      const { student1 } = await testHelpers.validStudentData();
      await studentRegistry
        .connect(admin)
        .registerStudent(
          student1.studentAddress,
          student1.id,
          student1.fullName,
          student1.email,
          student1.program,
          student1.enrollmentYear,
          admin.address
        );

      const student = await studentRegistry.getStudentById(student1.id);
      expect(student.fullName).to.equal(student1.fullName);
      expect(student.email).to.equal(student1.email);
      expect(student.program).to.equal(student1.program);
      expect(student.enrollmentYear).to.equal(student1.enrollmentYear);
    });
    it("should revert when trying to get a student by ID that is not registered", async function () {
      const { admin } = accounts;
      const { student1 } = await testHelpers.validStudentData();
      await expect(studentRegistry.getStudentById(student1.id)).to.be.revertedWithCustomError(
        studentRegistry,
        "NotRegistered"
      );
    });
    it("should return if the student is active", async function () {
      const { admin } = accounts;
      const { student1 } = await testHelpers.validStudentData();
      await studentRegistry
        .connect(admin)
        .registerStudent(
          student1.studentAddress,
          student1.id,
          student1.fullName,
          student1.email,
          student1.program,
          student1.enrollmentYear,
          admin.address
        );

      const isActive = await studentRegistry.isStudentActive(student1.studentAddress);
      expect(isActive).to.equal(true);
    });
    it("should revert when checking if a student is active that is not registered", async function () {
      const { admin } = accounts;
      const { student1 } = await testHelpers.validStudentData();
      await expect(
        studentRegistry.isStudentActive(student1.studentAddress)
      ).to.be.revertedWithCustomError(studentRegistry, "NotRegistered");
    });
    it("should return if the student is registered", async function () {
      const { admin } = accounts;
      const { student1 } = await testHelpers.validStudentData();
      await studentRegistry
        .connect(admin)
        .registerStudent(
          student1.studentAddress,
          student1.id,
          student1.fullName,
          student1.email,
          student1.program,
          student1.enrollmentYear,
          admin.address
        );

      const isRegistered = await studentRegistry.isRegistered(student1.studentAddress);
      expect(isRegistered).to.equal(true);
    });
    it("should revert when checking if a student is registered with zero address", async function () {
      const { admin } = accounts;
      const { zeroAddress } = await testHelpers.invalidStudentData();
      await expect(
        studentRegistry.isRegistered(zeroAddress.studentAddress)
      ).to.be.revertedWithCustomError(studentRegistry, "InvalidInput");
    });
    it("should return the registered students count correctly", async function () {
      const { admin } = accounts;
      const { student1, student2 } = await testHelpers.validStudentData();
      await studentRegistry
        .connect(admin)
        .registerStudent(
          student1.studentAddress,
          student1.id,
          student1.fullName,
          student1.email,
          student1.program,
          student1.enrollmentYear,
          admin.address
        );
      expect(await studentRegistry.getRegisteredStudentsCount()).to.equal(1);

      await studentRegistry
        .connect(admin)
        .registerStudent(
          student2.studentAddress,
          student2.id,
          student2.fullName,
          student2.email,
          student2.program,
          student2.enrollmentYear,
          admin.address
        );

      expect(await studentRegistry.getRegisteredStudentsCount()).to.equal(2);
    });
    it("should return the id of a student by address", async function () {
      const { admin } = accounts;
      const { student1 } = await testHelpers.validStudentData();
      await studentRegistry
        .connect(admin)
        .registerStudent(
          student1.studentAddress,
          student1.id,
          student1.fullName,
          student1.email,
          student1.program,
          student1.enrollmentYear,
          admin.address
        );

      const id = await studentRegistry.getStudentId(student1.studentAddress);
      expect(id).to.equal(student1.id);
    });
    it("should return the address of a student by ID", async function () {
      const { admin } = accounts;
      const { student1 } = await testHelpers.validStudentData();
      await studentRegistry
        .connect(admin)
        .registerStudent(
          student1.studentAddress,
          student1.id,
          student1.fullName,
          student1.email,
          student1.program,
          student1.enrollmentYear,
          admin.address
        );

      const address = await studentRegistry.getStudentAddressById(student1.id);
      expect(address).to.equal(student1.studentAddress);
    });
    it("should revert when trying to get the address of a student by ID that is not registered", async function () {
      const { admin } = accounts;
      const { student1 } = await testHelpers.validStudentData();
      await expect(
        studentRegistry.getStudentAddressById(student1.id)
      ).to.be.revertedWithCustomError(studentRegistry, "NotRegistered");
    });
  });
});
