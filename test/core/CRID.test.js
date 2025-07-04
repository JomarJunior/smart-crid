const { expect } = require("chai");
const { ethers } = require("hardhat");
const { testHelpers } = require("../fixtures/testHelpers.js");

describe("🏗️ Core Context - CRID Orchestrator", function () {
  let crid;
  let accessControl;
  let studentRegistry;
  let courseManager;
  let enrollmentRequest;
  let accounts;

  beforeEach(async function () {
    const setup = await testHelpers.setupCRID();
    ({ crid, accessControl, studentRegistry, courseManager, enrollmentRequest, accounts } = setup);
  });

  describe("Deployment", function () {
    it("should deploy with correct access control reference", async function () {
      expect(await crid.ACCESS_CONTROL()).to.equal(accessControl.target);
    });

    it("should deploy with correct initial version", async function () {
      expect(await crid.systemVersion()).to.equal(1);
    });

    it("should deploy with system initialized as true", async function () {
      expect(await crid.systemInitialized()).to.be.true;
    });

    it("should revert deployment with zero address access control", async function () {
      const CRID = await ethers.getContractFactory("CRID");
      await expect(
        CRID.connect(accounts.admin).deploy(testHelpers.ADDRESS_ZERO)
      ).to.be.revertedWithCustomError(crid, "InvalidAccessControlAddress");
    });
  });

  describe("System Initialization", function () {
    it("should not allow re-initialization", async function () {
      await expect(
        crid
          .connect(accounts.admin)
          .initializeSystem(studentRegistry.target, courseManager.target, enrollmentRequest.target)
      ).to.be.revertedWithCustomError(crid, "SystemAlreadyInitialized");
    });

    it("should not allow non-admin to initialize system", async function () {
      // Deploy a fresh CRID without initialization
      const accessControlFresh = await testHelpers.deployAccessControl();
      const cridFresh = await testHelpers.deployCRID(accessControlFresh.target);

      await expect(
        cridFresh
          .connect(accounts.student1)
          .initializeSystem(studentRegistry.target, courseManager.target, enrollmentRequest.target)
      ).to.be.reverted; // Should be reverted by onlyAdmin modifier
    });

    it("should not allow initialization with zero addresses", async function () {
      // Deploy a fresh CRID without initialization
      const accessControlFresh = await testHelpers.deployAccessControl();
      const cridFresh = await testHelpers.deployCRID(accessControlFresh.target);

      await expect(
        cridFresh
          .connect(accounts.admin)
          .initializeSystem(
            testHelpers.ADDRESS_ZERO,
            courseManager.target,
            enrollmentRequest.target
          )
      ).to.be.revertedWithCustomError(cridFresh, "InvalidContract");

      await expect(
        cridFresh
          .connect(accounts.admin)
          .initializeSystem(
            studentRegistry.target,
            testHelpers.ADDRESS_ZERO,
            enrollmentRequest.target
          )
      ).to.be.revertedWithCustomError(cridFresh, "InvalidContract");

      await expect(
        cridFresh
          .connect(accounts.admin)
          .initializeSystem(studentRegistry.target, courseManager.target, testHelpers.ADDRESS_ZERO)
      ).to.be.revertedWithCustomError(cridFresh, "InvalidContract");
    });

    it("should emit SystemInitialized event", async function () {
      // Deploy a fresh CRID without initialization
      const accessControlFresh = await testHelpers.deployAccessControl();
      const cridFresh = await testHelpers.deployCRID(accessControlFresh.target);

      await expect(
        cridFresh
          .connect(accounts.admin)
          .initializeSystem(studentRegistry.target, courseManager.target, enrollmentRequest.target)
      )
        .to.emit(cridFresh, "SystemInitialized")
        .withArgs(accounts.admin.address);
    });
  });

  describe("Student Context Operations", function () {
    describe("Student Registration", function () {
      it("should allow students to register themselves", async function () {
        const studentData = await testHelpers.validStudentData();

        await expect(
          crid
            .connect(accounts.student1)
            .registerStudent(
              studentData.student1.id,
              studentData.student1.fullName,
              studentData.student1.email,
              studentData.student1.program,
              studentData.student1.enrollmentYear
            )
        )
          .to.emit(studentRegistry, "RegisterStudentCalled")
          .withArgs(
            accounts.student1.address,
            studentData.student1.id,
            studentData.student1.fullName,
            studentData.student1.email,
            studentData.student1.program,
            studentData.student1.enrollmentYear,
            accounts.student1.address
          );
      });

      it("should not allow non-students to register", async function () {
        const studentData = await testHelpers.validStudentData();

        await expect(
          crid
            .connect(accounts.guest)
            .registerStudent(
              studentData.student2.id,
              studentData.student2.fullName,
              studentData.student2.email,
              studentData.student2.program,
              studentData.student2.enrollmentYear
            )
        ).to.be.reverted; // Should be reverted by onlyStudent modifier
      });

      it("should not allow registration when paused", async function () {
        const studentData = await testHelpers.validStudentData();

        // Pause the system
        await accessControl.connect(accounts.admin).pause();

        await expect(
          crid
            .connect(accounts.student2)
            .registerStudent(
              studentData.student2.id,
              studentData.student2.fullName,
              studentData.student2.email,
              studentData.student2.program,
              studentData.student2.enrollmentYear
            )
        ).to.be.reverted; // Should be reverted by whenNotPaused modifier
      });
    });

    describe("Student Status Management", function () {
      beforeEach(async function () {
        // Register a test student for status management tests
        const studentData = await testHelpers.validStudentData();
        await crid
          .connect(accounts.student1)
          .registerStudent(
            studentData.student1.id,
            studentData.student1.fullName,
            studentData.student1.email,
            studentData.student1.program,
            studentData.student1.enrollmentYear
          );
      });

      it("should allow admin to set student status", async function () {
        const studentData = await testHelpers.validStudentData();

        await expect(crid.connect(accounts.admin).setStudentStatus(studentData.student1.id, false))
          .to.emit(studentRegistry, "DeactivateStudentByIdCalled")
          .withArgs(studentData.student1.id, accounts.admin.address);

        await expect(crid.connect(accounts.admin).setStudentStatus(studentData.student1.id, true))
          .to.emit(studentRegistry, "ActivateStudentByIdCalled")
          .withArgs(studentData.student1.id, accounts.admin.address);
      });

      it("should not allow non-admin to set student status", async function () {
        const studentData = await testHelpers.validStudentData();

        await expect(
          crid.connect(accounts.coordinator1).setStudentStatus(studentData.student1.id, false)
        ).to.be.reverted; // Should be reverted by onlyAdmin modifier
      });

      it("should not allow setting status when paused", async function () {
        const studentData = await testHelpers.validStudentData();

        // Pause the system
        await accessControl.connect(accounts.admin).pause();

        await expect(crid.connect(accounts.admin).setStudentStatus(studentData.student1.id, false))
          .to.be.reverted; // Should be reverted by whenNotPaused modifier
      });
    });

    describe("Student Information Retrieval", function () {
      beforeEach(async function () {
        // Register a test student for information retrieval tests
        const studentData = await testHelpers.validStudentData();
        await crid
          .connect(accounts.student1)
          .registerStudent(
            studentData.student1.id,
            studentData.student1.fullName,
            studentData.student1.email,
            studentData.student1.program,
            studentData.student1.enrollmentYear
          );
      });

      it("should allow students to view their own profile", async function () {
        const student = await crid
          .connect(accounts.student1)
          .getStudentByAddress(accounts.student1.address);
        expect(student.id).to.be.a("string");
        expect(student.fullName).to.be.a("string");
        expect(student.email).to.be.a("string");
        expect(student.program).to.be.a("string");
        expect(student.enrollmentYear).to.be.a("bigint");
        expect(student.isActive).to.be.a("boolean");
      });

      it("should allow coordinators to view any student profile", async function () {
        const student = await crid
          .connect(accounts.coordinator1)
          .getStudentByAddress(accounts.student1.address);
        expect(student.id).to.be.a("string");
        expect(student.fullName).to.be.a("string");
        expect(student.email).to.be.a("string");
        expect(student.program).to.be.a("string");
        expect(student.enrollmentYear).to.be.a("bigint");
        expect(student.isActive).to.be.a("boolean");
      });

      it("should allow admins to view any student profile", async function () {
        const student = await crid
          .connect(accounts.admin)
          .getStudentByAddress(accounts.student1.address);
        expect(student.id).to.be.a("string");
        expect(student.fullName).to.be.a("string");
        expect(student.email).to.be.a("string");
        expect(student.program).to.be.a("string");
        expect(student.enrollmentYear).to.be.a("bigint");
        expect(student.isActive).to.be.a("boolean");
      });

      it("should not allow students to view other students' profiles", async function () {
        await expect(
          crid.connect(accounts.student2).getStudentByAddress(accounts.student1.address)
        ).to.be.revertedWithCustomError(crid, "UnauthorizedAccess");
      });

      it("should not allow guests to view student profiles", async function () {
        await expect(
          crid.connect(accounts.guest).getStudentByAddress(accounts.student1.address)
        ).to.be.revertedWithCustomError(crid, "UnauthorizedAccess");
      });

      it("should allow coordinators and admins to get student by ID", async function () {
        const studentData = await testHelpers.validStudentData();

        const studentByCoordinator = await crid
          .connect(accounts.coordinator1)
          .getStudentById(studentData.student1.id);
        expect(studentByCoordinator.id).to.equal(studentData.student1.id);

        const studentByAdmin = await crid
          .connect(accounts.admin)
          .getStudentById(studentData.student1.id);
        expect(studentByAdmin.id).to.equal(studentData.student1.id);
      });

      it("should not allow students to get student by ID", async function () {
        const studentData = await testHelpers.validStudentData();

        await expect(crid.connect(accounts.student1).getStudentById(studentData.student1.id)).to.be
          .reverted; // Should be reverted by onlyCoordinatorOrAdmin modifier
      });
    });
  });

  describe("Course Management Operations", function () {
    describe("Course Addition", function () {
      it("should allow coordinators to add courses", async function () {
        const courseData = await testHelpers.validCourseData();

        await expect(
          crid
            .connect(accounts.coordinator1)
            .addCourse(
              courseData.course1.id,
              courseData.course1.name,
              courseData.course1.description,
              courseData.course1.credits,
              courseData.course1.maxStudents
            )
        )
          .to.emit(courseManager, "AddCourseCalled")
          .withArgs(
            courseData.course1.id,
            courseData.course1.name,
            courseData.course1.description,
            courseData.course1.credits,
            courseData.course1.maxStudents,
            accounts.coordinator1.address
          );
      });

      it("should allow admins to add courses", async function () {
        const courseData = await testHelpers.validCourseData();

        await expect(
          crid
            .connect(accounts.admin)
            .addCourse(
              courseData.course1.id,
              courseData.course1.name,
              courseData.course1.description,
              courseData.course1.credits,
              courseData.course1.maxStudents
            )
        )
          .to.emit(courseManager, "AddCourseCalled")
          .withArgs(
            courseData.course1.id,
            courseData.course1.name,
            courseData.course1.description,
            courseData.course1.credits,
            courseData.course1.maxStudents,
            accounts.admin.address
          );
      });

      it("should not allow students to add courses", async function () {
        const courseData = await testHelpers.validCourseData();

        await expect(
          crid
            .connect(accounts.student1)
            .addCourse(
              courseData.course1.id,
              courseData.course1.name,
              courseData.course1.description,
              courseData.course1.credits,
              courseData.course1.maxStudents
            )
        ).to.be.reverted; // Should be reverted by onlyCoordinatorOrAdmin modifier
      });

      it("should not allow adding courses when paused", async function () {
        const courseData = await testHelpers.validCourseData();

        // Pause the system
        await accessControl.connect(accounts.admin).pause();

        await expect(
          crid
            .connect(accounts.coordinator1)
            .addCourse(
              courseData.course1.id,
              courseData.course1.name,
              courseData.course1.description,
              courseData.course1.credits,
              courseData.course1.maxStudents
            )
        ).to.be.reverted; // Should be reverted by whenNotPaused modifier
      });
    });

    describe("Course Status Management", function () {
      beforeEach(async function () {
        // Add a test course
        const courseData = await testHelpers.validCourseData();
        await crid
          .connect(accounts.coordinator1)
          .addCourse(
            courseData.course1.id,
            courseData.course1.name,
            courseData.course1.description,
            courseData.course1.credits,
            courseData.course1.maxStudents
          );
      });

      it("should allow coordinators to set course status", async function () {
        const courseData = await testHelpers.validCourseData();

        await expect(
          crid.connect(accounts.coordinator1).setCourseStatus(courseData.course1.id, false)
        )
          .to.emit(courseManager, "DeactivateCourseCalled")
          .withArgs(courseData.course1.id, accounts.coordinator1.address);

        await expect(
          crid.connect(accounts.coordinator1).setCourseStatus(courseData.course1.id, true)
        )
          .to.emit(courseManager, "ActivateCourseCalled")
          .withArgs(courseData.course1.id, accounts.coordinator1.address);
      });

      it("should allow admins to set course status", async function () {
        const courseData = await testHelpers.validCourseData();

        await expect(crid.connect(accounts.admin).setCourseStatus(courseData.course1.id, false))
          .to.emit(courseManager, "DeactivateCourseCalled")
          .withArgs(courseData.course1.id, accounts.admin.address);
      });

      it("should not allow students to set course status", async function () {
        const courseData = await testHelpers.validCourseData();

        await expect(crid.connect(accounts.student1).setCourseStatus(courseData.course1.id, false))
          .to.be.reverted; // Should be reverted by onlyCoordinatorOrAdmin modifier
      });
    });

    describe("Course Information Retrieval", function () {
      beforeEach(async function () {
        // Add a test course
        const courseData = await testHelpers.validCourseData();
        await crid
          .connect(accounts.coordinator1)
          .addCourse(
            courseData.course1.id,
            courseData.course1.name,
            courseData.course1.description,
            courseData.course1.credits,
            courseData.course1.maxStudents
          );
      });

      it("should allow anyone to get course information", async function () {
        const course = await crid.connect(accounts.student1).getCourse(1);
        expect(course.id).to.be.a("bigint");
        expect(course.name).to.be.a("string");
        expect(course.description).to.be.a("string");
        expect(course.credits).to.be.a("bigint");
        expect(course.maxStudents).to.be.a("bigint");
        expect(course.isActive).to.be.a("boolean");

        const courseByCoordinator = await crid.connect(accounts.coordinator1).getCourse(1);

        expect(courseByCoordinator.id).to.be.a("bigint");
        expect(courseByCoordinator.name).to.be.a("string");
        expect(courseByCoordinator.description).to.be.a("string");
        expect(courseByCoordinator.credits).to.be.a("bigint");
        expect(courseByCoordinator.maxStudents).to.be.a("bigint");
        expect(courseByCoordinator.isActive).to.be.a("boolean");

        const courseByGuest = await crid.connect(accounts.guest).getCourse(1);
        expect(courseByGuest.id).to.be.a("bigint");
        expect(courseByGuest.name).to.be.a("string");
        expect(courseByGuest.description).to.be.a("string");
        expect(courseByGuest.credits).to.be.a("bigint");
        expect(courseByGuest.maxStudents).to.be.a("bigint");
        expect(courseByGuest.isActive).to.be.a("boolean");
      });
    });
  });

  describe("Enrollment Operations", function () {
    beforeEach(async function () {
      // Setup students and courses
      const studentData = await testHelpers.validStudentData();
      const courseData = await testHelpers.validCourseData();

      // Register students first
      await crid
        .connect(accounts.student1)
        .registerStudent(
          studentData.student1.id,
          studentData.student1.fullName,
          studentData.student1.email,
          studentData.student1.program,
          studentData.student1.enrollmentYear
        );

      await crid
        .connect(accounts.student2)
        .registerStudent(
          studentData.student2.id,
          studentData.student2.fullName,
          studentData.student2.email,
          studentData.student2.program,
          studentData.student2.enrollmentYear
        );

      // Add course
      await crid
        .connect(accounts.coordinator1)
        .addCourse(
          courseData.course1.id,
          courseData.course1.name,
          courseData.course1.description,
          courseData.course1.credits,
          courseData.course1.maxStudents
        );
    });

    describe("Enrollment Request Submission", function () {
      it("should allow active students to request enrollment", async function () {
        const courseData = await testHelpers.validCourseData();
        const studentData = await testHelpers.validStudentData();

        // Activate student
        await studentRegistry
          .connect(accounts.admin)
          .activateStudentById(studentData.student1.id, accounts.student1.address);

        // Activate course
        await crid.connect(accounts.coordinator1).setCourseStatus(courseData.course1.id, true);

        await expect(crid.connect(accounts.student1).requestEnrollment(courseData.course1.id))
          .to.emit(enrollmentRequest, "RequestEnrollmentCalled")
          .withArgs(courseData.course1.id, accounts.student1.address);
      });

      it("should not allow non-students to request enrollment", async function () {
        const courseData = await testHelpers.validCourseData();

        await expect(crid.connect(accounts.guest).requestEnrollment(courseData.course1.id)).to.be
          .reverted; // Should be reverted by onlyStudent modifier
      });

      it("should not allow inactive students to request enrollment", async function () {
        const studentData = await testHelpers.validStudentData();
        const courseData = await testHelpers.validCourseData();

        // Deactivate student
        await studentRegistry
          .connect(accounts.admin)
          .deactivateStudentById(studentData.student1.id, accounts.student1.address);

        // Activate course
        await courseManager
          .connect(accounts.coordinator1)
          .activateCourse(courseData.course1.id, accounts.coordinator1.address);

        await expect(
          crid.connect(accounts.student1).requestEnrollment(courseData.course1.id)
        ).to.be.revertedWithCustomError(crid, "UnauthorizedAccess");
      });

      it("should not allow enrollment in inactive courses", async function () {
        const courseData = await testHelpers.validCourseData();
        const studentData = await testHelpers.validStudentData();

        // Activate student
        await studentRegistry
          .connect(accounts.admin)
          .activateStudentById(studentData.student1.id, accounts.student1.address);

        // Deactivate course
        await crid.connect(accounts.coordinator1).setCourseStatus(courseData.course1.id, false);

        await expect(
          crid.connect(accounts.student1).requestEnrollment(courseData.course1.id)
        ).to.be.revertedWithCustomError(crid, "InvalidInput");
      });

      it("should not allow enrollment requests when paused", async function () {
        const courseData = await testHelpers.validCourseData();

        // Pause the system
        await accessControl.connect(accounts.admin).pause();

        await expect(crid.connect(accounts.student1).requestEnrollment(courseData.course1.id)).to.be
          .reverted; // Should be reverted by whenNotPaused modifier
      });
    });

    describe("Enrollment Request Management", function () {
      beforeEach(async function () {
        // Activate student and course for enrollment request management tests
        const studentData = await testHelpers.validStudentData();
        const courseData = await testHelpers.validCourseData();

        await studentRegistry
          .connect(accounts.admin)
          .activateStudentById(studentData.student1.id, accounts.student1.address);
        await courseManager
          .connect(accounts.coordinator1)
          .activateCourse(courseData.course1.id, accounts.coordinator1.address);

        // Create an enrollment request
        await crid.connect(accounts.student1).requestEnrollment(courseData.course1.id);
      });

      it("should allow students to cancel their own requests", async function () {
        await expect(crid.connect(accounts.student1).cancelEnrollmentRequest(1))
          .to.emit(enrollmentRequest, "CancelEnrollmentRequestCalled")
          .withArgs(1, accounts.student1.address);
      });

      it("should allow coordinators to approve enrollment requests", async function () {
        await expect(crid.connect(accounts.coordinator1).approveEnrollmentRequest(1))
          .to.emit(enrollmentRequest, "ApproveEnrollmentRequestCalled")
          .withArgs(1, accounts.coordinator1.address);
      });

      it("should allow admins to approve enrollment requests", async function () {
        await expect(crid.connect(accounts.admin).approveEnrollmentRequest(1))
          .to.emit(enrollmentRequest, "ApproveEnrollmentRequestCalled")
          .withArgs(1, accounts.admin.address);
      });

      it("should allow coordinators to reject enrollment requests", async function () {
        await expect(crid.connect(accounts.coordinator1).rejectEnrollmentRequest(1))
          .to.emit(enrollmentRequest, "RejectEnrollmentRequestCalled")
          .withArgs(1, accounts.coordinator1.address);
      });

      it("should not allow students to approve requests", async function () {
        await expect(crid.connect(accounts.student1).approveEnrollmentRequest(1)).to.be.reverted; // Should be reverted by onlyCoordinatorOrAdmin modifier
      });

      it("should not allow students to reject requests", async function () {
        await expect(crid.connect(accounts.student1).rejectEnrollmentRequest(1)).to.be.reverted; // Should be reverted by onlyCoordinatorOrAdmin modifier
      });
    });

    describe("Enrollment Request Information Retrieval", function () {
      beforeEach(async function () {
        // Activate student and course for enrollment request information retrieval tests
        const studentData = await testHelpers.validStudentData();
        const courseData = await testHelpers.validCourseData();

        await studentRegistry
          .connect(accounts.admin)
          .activateStudentById(studentData.student1.id, accounts.student1.address);
        await courseManager
          .connect(accounts.coordinator1)
          .activateCourse(courseData.course1.id, accounts.coordinator1.address);

        // Create an enrollment request
        await crid.connect(accounts.student1).requestEnrollment(courseData.course1.id);
      });

      it("should allow students to view their own requests", async function () {
        const request = await crid.connect(accounts.student1).getEnrollmentRequest(1);
        expect(request.id).to.be.a("bigint");
        expect(request.student).to.be.a("string");
        expect(request.courseId).to.be.a("bigint");
        expect(request.status).to.be.a("bigint");
        expect(request.requestDate).to.be.a("bigint");
      });

      it("should allow coordinators to view any request", async function () {
        const request = await crid.connect(accounts.coordinator1).getEnrollmentRequest(1);
        expect(request.id).to.be.a("bigint");
        expect(request.student).to.be.a("string");
        expect(request.courseId).to.be.a("bigint");
        expect(request.status).to.be.a("bigint");
        expect(request.requestDate).to.be.a("bigint");
      });

      it("should allow admins to view any request", async function () {
        const request = await crid.connect(accounts.admin).getEnrollmentRequest(1);
        expect(request.id).to.be.a("bigint");
        expect(request.student).to.be.a("string");
        expect(request.courseId).to.be.a("bigint");
        expect(request.status).to.be.a("bigint");
        expect(request.requestDate).to.be.a("bigint");
      });

      it("should not allow other students to view requests", async function () {
        await expect(
          crid.connect(accounts.student2).getEnrollmentRequest(1)
        ).to.be.revertedWithCustomError(crid, "UnauthorizedAccess");
      });

      it("should allow students to view their own request list", async function () {
        const requests = await crid
          .connect(accounts.student1)
          .getEnrollmentRequestsByStudent(accounts.student1.address);
        expect(requests).to.be.an("array");
      });

      it("should not allow students to view other students' request lists", async function () {
        await expect(
          crid.connect(accounts.student2).getEnrollmentRequestsByStudent(accounts.student1.address)
        ).to.be.revertedWithCustomError(crid, "UnauthorizedAccess");
      });

      it("should allow anyone to get total enrollment requests count", async function () {
        const count = await crid.connect(accounts.guest).getEnrollmentRequestsCount();
        expect(count).to.be.a("bigint");
      });
    });
  });

  describe("System Management", function () {
    describe("Contract Updates", function () {
      it("should allow admin to update contract addresses", async function () {
        const newStudentRegistry = await testHelpers.deployStudentRegistry();

        await expect(
          crid.connect(accounts.admin).updateContract("studentRegistry", newStudentRegistry.target)
        )
          .to.emit(crid, "ContractUpdated")
          .withArgs("studentRegistry", newStudentRegistry.target, accounts.admin.address);
      });

      it("should not allow non-admin to update contracts", async function () {
        const newStudentRegistry = await testHelpers.deployStudentRegistry();

        await expect(
          crid
            .connect(accounts.coordinator1)
            .updateContract("studentRegistry", newStudentRegistry.target)
        ).to.be.reverted; // Should be reverted by onlyAdmin modifier
      });

      it("should not allow updating with zero address", async function () {
        await expect(
          crid.connect(accounts.admin).updateContract("studentRegistry", testHelpers.ADDRESS_ZERO)
        ).to.be.revertedWithCustomError(crid, "InvalidContract");
      });

      it("should not allow updating with invalid contract name", async function () {
        const newStudentRegistry = await testHelpers.deployStudentRegistry();

        await expect(
          crid.connect(accounts.admin).updateContract("invalidContract", newStudentRegistry.target)
        ).to.be.revertedWithCustomError(crid, "InvalidInput");
      });
    });

    describe("System Status", function () {
      it("should return correct system status", async function () {
        const status = await crid.getSystemStatus();

        expect(status.initialized).to.be.true;
        expect(status.paused).to.be.false;
        expect(status.version).to.equal(1);
        expect(status.totalStudents).to.be.a("bigint");
        expect(status.totalRequests).to.be.a("bigint");
      });

      it("should return paused status correctly", async function () {
        // Pause the system
        await accessControl.connect(accounts.admin).pause();

        const status = await crid.getSystemStatus();
        expect(status.paused).to.be.true;
      });
    });

    describe("System Upgrade", function () {
      it("should allow admin to upgrade system", async function () {
        await expect(crid.connect(accounts.admin).upgradeSystem())
          .to.emit(crid, "SystemUpgraded")
          .withArgs(2, accounts.admin.address);

        expect(await crid.systemVersion()).to.equal(2);
      });

      it("should not allow non-admin to upgrade system", async function () {
        await expect(crid.connect(accounts.coordinator1).upgradeSystem()).to.be.reverted; // Should be reverted by onlyAdmin modifier
      });
    });
  });

  describe("Edge Cases", function () {
    it("should handle uninitialized system correctly", async function () {
      // Deploy a fresh CRID without initialization
      const accessControlFresh = await testHelpers.deployAccessControl();

      // Add student role first
      await accessControlFresh.connect(accounts.admin).addStudent(accounts.student1.address);

      const cridFresh = await testHelpers.deployCRID(accessControlFresh.target);

      await expect(
        cridFresh
          .connect(accounts.student1)
          .registerStudent("123", "Test", "test@test.com", "Test", 2023)
      ).to.be.revertedWithCustomError(cridFresh, "SystemNotInitialized");
    });

    it("should handle multiple contract updates correctly", async function () {
      const newStudentRegistry = await testHelpers.deployStudentRegistry();
      const newCourseManager = await testHelpers.deployMockCourseManager(crid.target);
      const newEnrollmentRequest = await testHelpers.deployEnrollmentRequest();

      await crid
        .connect(accounts.admin)
        .updateContract("studentRegistry", newStudentRegistry.target);
      await crid.connect(accounts.admin).updateContract("courseManager", newCourseManager.target);
      await crid
        .connect(accounts.admin)
        .updateContract("enrollmentRequest", newEnrollmentRequest.target);

      expect(await crid.studentRegistry()).to.equal(newStudentRegistry.target);
      expect(await crid.courseManager()).to.equal(newCourseManager.target);
      expect(await crid.enrollmentRequest()).to.equal(newEnrollmentRequest.target);
    });

    it("should handle multiple system upgrades correctly", async function () {
      await crid.connect(accounts.admin).upgradeSystem();
      await crid.connect(accounts.admin).upgradeSystem();
      await crid.connect(accounts.admin).upgradeSystem();

      expect(await crid.systemVersion()).to.equal(4);
    });
  });
});
