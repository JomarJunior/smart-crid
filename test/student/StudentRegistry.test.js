const { expect } = require("chai");
const testHelpers = require("../fixtures/testHelpers");

describe("🎓 Student Context - StudentRegistry", function () {
  let studentRegistry;
  let accessControl;
  let accounts;
  let validData;
  let invalidData;

  this.beforeEach(async function () {
    const setup = await testHelpers.setupStudentRegistrySystem();
    studentRegistry = setup.studentRegistry;
    accessControl = setup.accessControl;
    accounts = setup.accounts;
    validData = testHelpers.getValidStudentData();
    invalidData = testHelpers.getInvalidStudentData();
  });

  describe("Deployment", function () {
    it("Should initialize with correct access control reference", async function () {
      expect(await studentRegistry.accessControl()).to.equal(accessControl.target);
    });

    it("Should start with zero registered students", async function () {
      expect(await studentRegistry.totalRegisteredStudents()).to.equal(0);
    });

    it("Should not be paused initially", async function () {
      expect(await accessControl.paused()).to.be.false;
    });
  });

  describe("Student Registration", function () {
    it("Should allow students with STUDENT_ROLE to register with valid data", async function () {
      const data = validData.student1;
      const tx = await testHelpers.registerStudentWithData(
        studentRegistry,
        accounts.student1,
        data
      );

      // Check event emission
      await expect(tx)
        .to.emit(studentRegistry, "StudentRegistered")
        .withArgs(data.id, accounts.student1.address);

      // Check storage
      expect(await studentRegistry.isRegistered(accounts.student1.address)).to.be.true;

      const studentData = await studentRegistry.getStudentByAddress(accounts.student1.address);
      expect(studentData.id).to.equal(data.id);
      expect(studentData.fullName).to.equal(data.name);
      expect(studentData.email).to.equal(data.email);
      expect(studentData.program).to.equal(data.program);
      expect(studentData.enrollmentYear).to.equal(data.year);
      expect(studentData.isActive).to.be.true;

      // Check total count
      expect(await studentRegistry.totalRegisteredStudents()).to.equal(1);
    });

    it("Should reject registration with empty student ID", async function () {
      const data = invalidData.emptyId;

      await expect(
        testHelpers.registerStudentWithData(studentRegistry, accounts.student1, data)
      ).to.be.revertedWithCustomError(studentRegistry, "InvalidInput");
    });

    it("Should reject registration with empty name", async function () {
      const data = invalidData.emptyName;

      await expect(
        testHelpers.registerStudentWithData(studentRegistry, accounts.student1, data)
      ).to.be.revertedWithCustomError(studentRegistry, "InvalidInput");
    });

    it("Should reject registration with empty email", async function () {
      const data = invalidData.emptyEmail;

      await expect(
        testHelpers.registerStudentWithData(studentRegistry, accounts.student1, data)
      ).to.be.revertedWithCustomError(studentRegistry, "InvalidInput");
    });

    it("Should reject registration with empty program", async function () {
      const data = invalidData.emptyProgram;

      await expect(
        testHelpers.registerStudentWithData(studentRegistry, accounts.student1, data)
      ).to.be.revertedWithCustomError(studentRegistry, "InvalidInput");
    });

    it("Should prevent duplicate student ID registrations", async function () {
      const data1 = validData.student1;
      const data2 = validData.student2;

      // First registration
      await testHelpers.registerStudentWithData(studentRegistry, accounts.student1, data1);

      // Second registration with same ID should fail
      const duplicateData = { ...data2, id: data1.id }; // Same ID, different student
      await expect(
        testHelpers.registerStudentWithData(studentRegistry, accounts.student2, duplicateData)
      ).to.be.revertedWithCustomError(studentRegistry, "DuplicateStudentId");
    });

    it("Should prevent duplicate address registrations", async function () {
      const data1 = validData.student1;
      const data2 = validData.student2;

      // First registration
      await testHelpers.registerStudentWithData(studentRegistry, accounts.student1, data1);

      // Second registration with same address should fail
      await expect(
        testHelpers.registerStudentWithData(studentRegistry, accounts.student1, data2)
      ).to.be.revertedWithCustomError(studentRegistry, "AlreadyRegistered");
    });

    it("Should reject registration from unauthorized users", async function () {
      const data = validData.student1;

      // User without STUDENT_ROLE cannot register
      await expect(
        testHelpers.registerStudentWithData(studentRegistry, accounts.other, data)
      ).to.be.revertedWithCustomError(studentRegistry, "Unauthorized");
    });

    it("Should reject registration from coordinators", async function () {
      const data = validData.student1;

      // Coordinators cannot self-register as students
      await expect(
        testHelpers.registerStudentWithData(studentRegistry, accounts.coordinator1, data)
      ).to.be.revertedWithCustomError(studentRegistry, "Unauthorized");
    });

    it("Should reject registration from admins", async function () {
      const data = validData.student1;

      // Admins cannot self-register as students
      await expect(
        testHelpers.registerStudentWithData(studentRegistry, accounts.admin, data)
      ).to.be.revertedWithCustomError(studentRegistry, "Unauthorized");
    });
  });

  describe("Student Queries", function () {
    this.beforeEach(async function () {
      // Register test students using helper data
      const data1 = validData.student1;
      const data2 = validData.student2;

      await testHelpers.registerStudentWithData(studentRegistry, accounts.student1, data1);
      await testHelpers.registerStudentWithData(studentRegistry, accounts.student2, data2);
    });

    it("Should retrieve student by ID correctly", async function () {
      const data = validData.student1;
      const studentData = await studentRegistry.getStudentById(data.id);

      expect(studentData.id).to.equal(data.id);
      expect(studentData.fullName).to.equal(data.name);
      expect(studentData.program).to.equal(data.program);
      expect(studentData.enrollmentYear).to.equal(data.year);
      expect(studentData.isActive).to.be.true;
    });

    it("Should retrieve student by address correctly", async function () {
      const data = validData.student2;
      const studentData = await studentRegistry.getStudentByAddress(accounts.student2.address);

      expect(studentData.id).to.equal(data.id);
      expect(studentData.fullName).to.equal(data.name);
      expect(studentData.program).to.equal(data.program);
      expect(studentData.enrollmentYear).to.equal(data.year);
      expect(studentData.isActive).to.be.true;
    });

    it("Should handle non-existent student queries by ID", async function () {
      await expect(studentRegistry.getStudentById("999999999")).to.be.revertedWithCustomError(
        studentRegistry,
        "NotRegistered"
      );
    });

    it("Should handle non-existent student queries by address", async function () {
      await expect(
        studentRegistry.getStudentByAddress(accounts.other.address)
      ).to.be.revertedWithCustomError(studentRegistry, "NotRegistered");
    });

    it("Should return correct registration status", async function () {
      expect(await studentRegistry.isRegistered(accounts.student1.address)).to.be.true;
      expect(await studentRegistry.isRegistered(accounts.student2.address)).to.be.true;
      expect(await studentRegistry.isRegistered(accounts.student3.address)).to.be.false;
      expect(await studentRegistry.isRegistered(accounts.other.address)).to.be.false;
    });

    it("Should return correct total count", async function () {
      expect(await studentRegistry.totalRegisteredStudents()).to.equal(2);
    });

    it("Should return correct student address by ID", async function () {
      const data1 = validData.student1;
      const data2 = validData.student2;

      expect(await studentRegistry.getStudentAddress(data1.id)).to.equal(accounts.student1.address);
      expect(await studentRegistry.getStudentAddress(data2.id)).to.equal(accounts.student2.address);
    });

    it("Should handle non-existent ID in getStudentAddress", async function () {
      await expect(studentRegistry.getStudentAddress("999999999")).to.be.revertedWithCustomError(
        studentRegistry,
        "NotRegistered"
      );
    });
  });

  describe("Privacy Controls", function () {
    this.beforeEach(async function () {
      const data = validData.student1;
      await testHelpers.registerStudentWithData(studentRegistry, accounts.student1, data);
    });

    it("Should allow students to view their own profile", async function () {
      const data = validData.student1;
      const profile = await studentRegistry
        .connect(accounts.student1)
        .getStudentByAddress(accounts.student1.address);

      expect(profile.fullName).to.equal(data.name);
      expect(profile.email).to.equal(data.email);
      expect(profile.program).to.equal(data.program);
    });

    it("Should allow coordinators to view any student profile", async function () {
      const data = validData.student1;
      const profile = await studentRegistry
        .connect(accounts.coordinator1)
        .getStudentByAddress(accounts.student1.address);

      expect(profile.fullName).to.equal(data.name);
      expect(profile.email).to.equal(data.email);
      expect(profile.program).to.equal(data.program);
    });

    it("Should allow admins to view any student profile", async function () {
      const data = validData.student1;
      const profile = await studentRegistry
        .connect(accounts.admin)
        .getStudentByAddress(accounts.student1.address);

      expect(profile.fullName).to.equal(data.name);
      expect(profile.email).to.equal(data.email);
      expect(profile.program).to.equal(data.program);
    });

    it("Should prevent unauthorized users from viewing profiles", async function () {
      await expect(
        studentRegistry.connect(accounts.other).getStudentByAddress(accounts.student1.address)
      ).to.be.revertedWithCustomError(studentRegistry, "Unauthorized");
    });

    it("Should prevent students from viewing other students' profiles", async function () {
      // Register second student
      const data2 = validData.student2;
      await testHelpers.registerStudentWithData(studentRegistry, accounts.student2, data2);

      // Student2 cannot view Student1's profile
      await expect(
        studentRegistry.connect(accounts.student2).getStudentByAddress(accounts.student1.address)
      ).to.be.revertedWithCustomError(studentRegistry, "Unauthorized");
    });

    it("Should allow coordinators to query by ID regardless of privacy", async function () {
      const data = validData.student1;
      const profile = await studentRegistry.connect(accounts.coordinator1).getStudentById(data.id);

      expect(profile.fullName).to.equal(data.name);
      expect(profile.email).to.equal(data.email);
    });

    it("Should allow admins to query by ID regardless of privacy", async function () {
      const data = validData.student1;
      const profile = await studentRegistry.connect(accounts.admin).getStudentById(data.id);

      expect(profile.fullName).to.equal(data.name);
      expect(profile.email).to.equal(data.email);
    });
  });

  describe("System Integration", function () {
    it("Should respect access control pause state", async function () {
      const data = validData.student1;

      // Pause the system
      await accessControl.connect(accounts.admin).pause();

      // Registration should fail when system is paused
      await expect(
        testHelpers.registerStudentWithData(studentRegistry, accounts.student1, data)
      ).to.be.revertedWithCustomError(accessControl, "SystemIsPaused");
    });

    it("Should validate access control integration", async function () {
      // Verify that studentRegistry references the correct access control
      expect(await studentRegistry.accessControl()).to.equal(accessControl.target);

      // Verify role checking works
      expect(await accessControl.hasRole(testHelpers.ROLES.STUDENT, accounts.student1.address)).to
        .be.true;
      expect(await accessControl.hasRole(testHelpers.ROLES.STUDENT, accounts.other.address)).to.be
        .false;
    });

    it("Should work with access control role changes", async function () {
      const data = validData.student1;

      // Register student successfully
      await testHelpers.registerStudentWithData(studentRegistry, accounts.student1, data);
      expect(await studentRegistry.isRegistered(accounts.student1.address)).to.be.true;

      // Remove student role
      await accessControl.connect(accounts.admin).removeStudent(accounts.student1.address);

      // Student should still be registered but cannot register others
      expect(await studentRegistry.isRegistered(accounts.student1.address)).to.be.true;

      // But new registrations should fail
      const data2 = validData.student2;
      await expect(
        testHelpers.registerStudentWithData(studentRegistry, accounts.student1, data2)
      ).to.be.revertedWithCustomError(studentRegistry, "Unauthorized");
    });
  });

  describe("Edge Cases and Error Handling", function () {
    it("Should handle multiple students registering simultaneously", async function () {
      const data1 = validData.student1;
      const data2 = validData.student2;

      // Register both students in parallel
      await Promise.all([
        testHelpers.registerStudentWithData(studentRegistry, accounts.student1, data1),
        testHelpers.registerStudentWithData(studentRegistry, accounts.student2, data2),
      ]);

      expect(await studentRegistry.totalRegisteredStudents()).to.equal(2);
      expect(await studentRegistry.isRegistered(accounts.student1.address)).to.be.true;
      expect(await studentRegistry.isRegistered(accounts.student2.address)).to.be.true;
    });

    it("Should handle gas limit scenarios", async function () {
      // Test with very long strings (but within reasonable limits)
      const longString = "A".repeat(1000);
      const data = {
        id: "LONG_TEST_ID",
        name: longString,
        email: "long@example.com",
        program: longString,
        year: 2024,
      };

      await expect(
        testHelpers.registerStudentWithData(studentRegistry, accounts.student1, data)
      ).to.not.be.reverted;

      const retrievedStudent = await studentRegistry
        .connect(accounts.student1)
        .getStudentByAddress(accounts.student1.address);
      expect(retrievedStudent.fullName).to.equal(longString);
    });

    it("Should maintain data integrity with special characters", async function () {
      const specialData = {
        id: "SPEC_ID_123",
        name: "José María Ñoño-Äöü",
        email: "josé.maría@université.fr",
        program: "Ingeniería de Sistemas Интелектуальні 智能系统",
        year: 2024,
      };

      await testHelpers.registerStudentWithData(studentRegistry, accounts.student1, specialData);

      const retrievedStudent = await studentRegistry
        .connect(accounts.student1)
        .getStudentByAddress(accounts.student1.address);
      
      expect(retrievedStudent.fullName).to.equal(specialData.name);
      expect(retrievedStudent.email).to.equal(specialData.email);
      expect(retrievedStudent.program).to.equal(specialData.program);
    });

    it("Should handle year edge cases", async function () {
      const currentYear = new Date().getFullYear();
      const futureYear = currentYear + 10;

      const data = {
        ...validData.student1,
        year: futureYear,
      };

      await expect(
        testHelpers.registerStudentWithData(studentRegistry, accounts.student1, data)
      ).to.not.be.reverted;

      const retrievedStudent = await studentRegistry
        .connect(accounts.student1)
        .getStudentByAddress(accounts.student1.address);
      expect(retrievedStudent.enrollmentYear).to.equal(futureYear);
    });

    it("Should handle empty string edge cases properly", async function () {
      const dataWithEmptyId = { ...validData.student1, id: "" };
      const dataWithEmptyName = { ...validData.student1, name: "" };
      const dataWithEmptyEmail = { ...validData.student1, email: "" };
      const dataWithEmptyProgram = { ...validData.student1, program: "" };

      await expect(
        testHelpers.registerStudentWithData(studentRegistry, accounts.student1, dataWithEmptyId)
      ).to.be.revertedWithCustomError(studentRegistry, "InvalidInput");

      await expect(
        testHelpers.registerStudentWithData(studentRegistry, accounts.student1, dataWithEmptyName)
      ).to.be.revertedWithCustomError(studentRegistry, "InvalidInput");

      await expect(
        testHelpers.registerStudentWithData(studentRegistry, accounts.student1, dataWithEmptyEmail)
      ).to.be.revertedWithCustomError(studentRegistry, "InvalidInput");

      await expect(
        testHelpers.registerStudentWithData(studentRegistry, accounts.student1, dataWithEmptyProgram)
      ).to.be.revertedWithCustomError(studentRegistry, "InvalidInput");
    });

    it("Should properly handle activation/deactivation edge cases", async function () {
      const data = validData.student1;
      await testHelpers.registerStudentWithData(studentRegistry, accounts.student1, data);

      // Initially student should be active
      expect(await studentRegistry.isStudentActive(accounts.student1.address)).to.be.true;

      // Test deactivating active student
      await expect(
        studentRegistry.connect(accounts.admin).deactivateStudent(data.id)
      ).to.not.be.reverted;
      expect(await studentRegistry.isStudentActive(accounts.student1.address)).to.be.false;

      // Try to deactivate already inactive student (should revert)
      await expect(
        studentRegistry.connect(accounts.admin).deactivateStudent(data.id)
      ).to.be.revertedWithCustomError(studentRegistry, "NotActive");

      // Test reactivating inactive student
      await expect(
        studentRegistry.connect(accounts.admin).reactivateStudent(data.id)
      ).to.not.be.reverted;
      expect(await studentRegistry.isStudentActive(accounts.student1.address)).to.be.true;

      // Try to reactivate already active student (should revert)
      await expect(
        studentRegistry.connect(accounts.admin).reactivateStudent(data.id)
      ).to.be.revertedWithCustomError(studentRegistry, "AlreadyActive");
    });

    it("Should handle zero year correctly", async function () {
      const data = { ...validData.student1, year: 0 };
      
      await expect(
        testHelpers.registerStudentWithData(studentRegistry, accounts.student1, data)
      ).to.not.be.reverted;

      const retrievedStudent = await studentRegistry
        .connect(accounts.student1)
        .getStudentByAddress(accounts.student1.address);
      expect(retrievedStudent.enrollmentYear).to.equal(0);
    });
  });

  describe("Advanced Integration Tests", function () {
    beforeEach(async function () {
      const data = validData.student1;
      await testHelpers.registerStudentWithData(studentRegistry, accounts.student1, data);
    });

    it("Should handle role changes correctly", async function () {
      const data = validData.student1;
      
      // Register a second student first
      const data2 = validData.student2;
      await testHelpers.registerStudentWithData(studentRegistry, accounts.student2, data2);
      
      // Initially student can access their data
      await expect(
        studentRegistry.connect(accounts.student1).getStudentByAddress(accounts.student1.address)
      ).to.not.be.reverted;

      // Remove student role
      await accessControl.connect(accounts.admin).removeStudent(accounts.student1.address);

      // Student can still access their own data (privacy control allows self-access)
      await expect(
        studentRegistry.connect(accounts.student1).getStudentByAddress(accounts.student1.address)
      ).to.not.be.reverted;

      // But they cannot access other students' data without proper role
      await expect(
        studentRegistry.connect(accounts.student1).getStudentByAddress(accounts.student2.address)
      ).to.be.revertedWithCustomError(studentRegistry, "Unauthorized");

      // Add coordinator role
      await accessControl.connect(accounts.admin).addCoordinator(accounts.student1.address);

      // Now they should be able to access other students' data as coordinator
      await expect(
        studentRegistry.connect(accounts.student1).getStudentByAddress(accounts.student2.address)
      ).to.not.be.reverted;
    });

    it("Should handle pause/unpause during operations", async function () {
      // Pause the system
      await accessControl.connect(accounts.admin).pause();

      // Registration should fail when paused
      const newData = validData.student2;
      await expect(
        testHelpers.registerStudentWithData(studentRegistry, accounts.student2, newData)
      ).to.be.revertedWithCustomError(studentRegistry, "SystemIsPaused");

      // Admin operations should also fail when paused
      await expect(
        studentRegistry.connect(accounts.admin).reactivateStudent(validData.student1.id)
      ).to.be.revertedWithCustomError(studentRegistry, "SystemIsPaused");

      // Unpause the system
      await accessControl.connect(accounts.admin).unpause();

      // Operations should work again
      await expect(
        testHelpers.registerStudentWithData(studentRegistry, accounts.student2, newData)
      ).to.not.be.reverted;
    });

    it("Should maintain consistency during complex operations", async function () {
      const initialCount = await studentRegistry.totalRegisteredStudents();

      // Register multiple students
      const studentsData = [validData.student2, validData.student3];
      for (let i = 0; i < studentsData.length; i++) {
        const data = studentsData[i];
        const account = i === 0 ? accounts.student2 : accounts.student3;
        await testHelpers.registerStudentWithData(studentRegistry, account, data);
      }

      // Verify count increased correctly
      expect(await studentRegistry.totalRegisteredStudents()).to.equal(
        Number(initialCount) + studentsData.length
      );

      // Deactivate some students
      await studentRegistry.connect(accounts.admin).deactivateStudent(validData.student2.id);

      // Verify the deactivated student is indeed inactive
      expect(await studentRegistry.isStudentActive(accounts.student2.address)).to.be.false;

      // But other students should still be active
      expect(await studentRegistry.isStudentActive(accounts.student1.address)).to.be.true;
      expect(await studentRegistry.isStudentActive(accounts.student3.address)).to.be.true;

      // Total count should remain the same
      expect(await studentRegistry.totalRegisteredStudents()).to.equal(
        Number(initialCount) + studentsData.length
      );
    });
  });
});
