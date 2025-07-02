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
      const data3 = validData.student3;

      // Register multiple students
      await Promise.all([
        testHelpers.registerStudentWithData(studentRegistry, accounts.student1, data1),
        testHelpers.registerStudentWithData(studentRegistry, accounts.student2, data2),
        testHelpers.registerStudentWithData(studentRegistry, accounts.student3, data3),
      ]);

      expect(await studentRegistry.totalRegisteredStudents()).to.equal(3);
      expect(await studentRegistry.isRegistered(accounts.student1.address)).to.be.true;
      expect(await studentRegistry.isRegistered(accounts.student2.address)).to.be.true;
      expect(await studentRegistry.isRegistered(accounts.student3.address)).to.be.true;
    });

    it("Should handle gas limit scenarios", async function () {
      // This test ensures our contract doesn't hit gas limits with reasonable data
      const longName = "A".repeat(100); // 100 character name
      const longEmail = "a".repeat(90) + "@poli.ufrj.br"; // ~100 character email
      const longProgram = "B".repeat(100); // 100 character program

      const data = {
        id: "999999999",
        name: longName,
        email: longEmail,
        program: longProgram,
        year: 2024,
      };

      await testHelpers.registerStudentWithData(studentRegistry, accounts.student1, data);

      const retrieved = await studentRegistry.getStudentByAddress(accounts.student1.address);
      expect(retrieved.fullName).to.equal(longName);
      expect(retrieved.email).to.equal(longEmail);
      expect(retrieved.program).to.equal(longProgram);
    });

    it("Should maintain data integrity with special characters", async function () {
      const data = {
        id: "118210898",
        name: "José María Azpilicueta-González",
        email: "jose.azpilicueta@poli.ufrj.br",
        program: "Engenharia de Computação & Informação",
        year: 2024,
      };

      await testHelpers.registerStudentWithData(studentRegistry, accounts.student1, data);

      const retrieved = await studentRegistry.getStudentById(data.id);
      expect(retrieved.fullName).to.equal(data.name);
      expect(retrieved.email).to.equal(data.email);
      expect(retrieved.program).to.equal(data.program);
    });

    it("Should handle year edge cases", async function () {
      const currentYear = new Date().getFullYear();
      const futureYear = currentYear + 1;

      const data = {
        id: "118210898",
        name: "Future Student",
        email: "future@poli.ufrj.br",
        program: "Future Engineering",
        year: futureYear,
      };

      await testHelpers.registerStudentWithData(studentRegistry, accounts.student1, data);

      const retrieved = await studentRegistry.getStudentById(data.id);
      expect(retrieved.enrollmentYear).to.equal(futureYear);
    });
  });
});
