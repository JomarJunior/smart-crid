const { expect } = require("chai");
const testHelpers = require("../fixtures/testHelpers");

describe("📚 Student Context - Enrollment Request", function () {
  let enrollmentRequest;
  let accessControl;
  let studentRegistry;
  let courseManager;
  let accounts;
  let validCourseData;

  this.beforeEach(async function () {
    const setup = await testHelpers.setupEnrollmentRequestSystem();
    enrollmentRequest = setup.enrollmentRequest;
    accessControl = setup.accessControl;
    studentRegistry = setup.studentRegistry;
    courseManager = setup.courseManager;
    accounts = setup.accounts;
    validCourseData = testHelpers.getValidCourseData();
  });

  describe("Deployment", function () {
    it("Should initialize with correct access control reference", async function () {
      expect(await enrollmentRequest.getAccessControl()).to.equal(accessControl.target);
    });

    it("Should initialize with correct student registry reference", async function () {
      expect(await enrollmentRequest.getStudentRegistry()).to.equal(studentRegistry.target);
    });

    it("Should initialize with correct course manager reference", async function () {
      expect(await enrollmentRequest.getCourseManager()).to.equal(courseManager.target);
    });

    it("Should not be paused initially", async function () {
      const accessControlContract = await enrollmentRequest.getAccessControl();
      const accessControlInstance = await ethers.getContractAt("CRIDAccessControl", accessControlContract);
      expect(await accessControlInstance.paused()).to.be.false;
    });

    it("Should start with zero enrollment requests", async function () {
      expect(await enrollmentRequest.getEnrollmentRequestsCount()).to.equal(0);
    });
  });

  describe("Enrollment Request Submission", function () {
    beforeEach(async function () {
      // Add student to registry
      await testHelpers.registerStudentWithData(
        studentRegistry,
        accounts.student1,
        testHelpers.getValidStudentData().student1
      );

      // Add course to manager
      await testHelpers.addCourseToManager(courseManager, accounts.admin, validCourseData.course1);
    });

    it("Should allow active students to request enrollment in active courses", async function () {
      const tx = await enrollmentRequest
        .connect(accounts.student1)
        .requestEnrollment(validCourseData.course1.id);

      // Check event emission
      await expect(tx)
        .to.emit(enrollmentRequest, "EnrollmentRequested")
        .withArgs(testHelpers.getValidStudentData().student1.id, validCourseData.course1.id, "REQ-1"); // studentId is 1, requestId is "REQ-1"

      // Check storage
      const request = await enrollmentRequest.getEnrollmentRequest("REQ-1");
      expect(request.studentId).to.equal(testHelpers.getValidStudentData().student1.id);
      expect(request.courseId).to.equal(validCourseData.course1.id);
      expect(request.status).to.equal(testHelpers.ENROLLMENT_STATUS.PENDING);
      expect(request.requestDate).to.be.above(0);

      // Check total count
      expect(await enrollmentRequest.getEnrollmentRequestsCount()).to.equal(1);
    });

    it("Should reject enrollment requests for non-existent courses", async function () {
      const nonExistentCourseId = "NONEXISTENT";
      await expect(
        enrollmentRequest.connect(accounts.student1).requestEnrollment(nonExistentCourseId)
      ).to.be.revertedWithCustomError(courseManager, "CourseNotFound");
    });

    it("Should reject duplicate enrollment requests for same course", async function () {
      await enrollmentRequest
        .connect(accounts.student1)
        .requestEnrollment(validCourseData.course1.id);

      await expect(
        enrollmentRequest.connect(accounts.student1).requestEnrollment(validCourseData.course1.id)
      ).to.be.revertedWithCustomError(enrollmentRequest, "AlreadyRequested");
    });

    it("Should reject enrollment requests for inactive courses", async function () {
      await courseManager.connect(accounts.admin).deactivateCourse(validCourseData.course1.id);

      await expect(
        enrollmentRequest.connect(accounts.student1).requestEnrollment(validCourseData.course1.id)
      ).to.be.revertedWithCustomError(enrollmentRequest, "CourseNotActive");
    });

    it("Should reject enrollment requests from inactive students", async function () {
      await studentRegistry.connect(accounts.admin).deactivateStudent(testHelpers.getValidStudentData().student1.id);

      await expect(
        enrollmentRequest.connect(accounts.student1).requestEnrollment(validCourseData.course1.id)
      ).to.be.revertedWithCustomError(enrollmentRequest, "StudentNotActive");
    });

    it("Should reject enrollment requests when system is paused", async function () {
      const accessControlContract = await enrollmentRequest.getAccessControl();
      const accessControlInstance = await ethers.getContractAt("CRIDAccessControl", accessControlContract);
      await accessControlInstance.connect(accounts.admin).pause();

      await expect(
        enrollmentRequest.connect(accounts.student1).requestEnrollment(validCourseData.course1.id)
      ).to.be.revertedWithCustomError(enrollmentRequest, "SystemIsPaused");
    });

    it("Should reject enrollment requests from unregistered students", async function () {
      await expect(
        enrollmentRequest.connect(accounts.student2).requestEnrollment(validCourseData.course1.id)
      ).to.be.revertedWithCustomError(enrollmentRequest, "StudentNotActive");
    });
  });

  describe("Enrollment Request Cancellation", function () {
    beforeEach(async function () {
      // Add student and course
      await testHelpers.registerStudentWithData(
        studentRegistry,
        accounts.student1,
        testHelpers.getValidStudentData().student1
      );
      await testHelpers.addCourseToManager(courseManager, accounts.admin, validCourseData.course1);

      // Student submits enrollment request
      await enrollmentRequest
        .connect(accounts.student1)
        .requestEnrollment(validCourseData.course1.id);
    });

    it("Should allow students to cancel their pending enrollment requests", async function () {
      const tx = await enrollmentRequest.connect(accounts.student1).cancelEnrollmentRequest("REQ-1");

      // Check event emission
      await expect(tx).to.emit(enrollmentRequest, "EnrollmentRequestCancelled").withArgs("REQ-1");

      // Check storage
      const request = await enrollmentRequest.getEnrollmentRequest("REQ-1");
      expect(request.status).to.equal(testHelpers.ENROLLMENT_STATUS.CANCELLED);
    });

    it("Should reject cancellation of non-existent requests", async function () {
      const nonExistentRequestId = "REQ-99";
      await expect(
        enrollmentRequest.connect(accounts.student1).cancelEnrollmentRequest(nonExistentRequestId)
      ).to.be.revertedWithCustomError(enrollmentRequest, "RequestDoesNotExist");
    });

    it("Should reject cancellation by non-owners", async function () {
      await expect(
        enrollmentRequest.connect(accounts.student2).cancelEnrollmentRequest("REQ-1")
      ).to.be.revertedWithCustomError(enrollmentRequest, "NotRequestOwner");
    });

    it("Should reject cancellation of non-pending requests", async function () {
      // Admin processes the request (approve/reject)
      await enrollmentRequest.connect(accounts.admin).approveEnrollment("REQ-1");

      await expect(
        enrollmentRequest.connect(accounts.student1).cancelEnrollmentRequest("REQ-1")
      ).to.be.revertedWithCustomError(enrollmentRequest, "RequestNotPending");
    });

    it("Should reject cancellation when system is paused", async function () {
      const accessControlContract = await enrollmentRequest.getAccessControl();
      const accessControlInstance = await ethers.getContractAt("CRIDAccessControl", accessControlContract);
      await accessControlInstance.connect(accounts.admin).pause();

      await expect(
        enrollmentRequest.connect(accounts.student1).cancelEnrollmentRequest("REQ-1")
      ).to.be.revertedWithCustomError(enrollmentRequest, "SystemIsPaused");
    });
  });

  describe("Enrollment Request Queries", function () {
    beforeEach(async function () {
      // Add student to registry
      await testHelpers.registerStudentWithData(
        studentRegistry,
        accounts.student1,
        testHelpers.getValidStudentData().student1
      );

      // Add courses to manager
      await testHelpers.addCourseToManager(courseManager, accounts.admin, validCourseData.course1);
      await testHelpers.addCourseToManager(courseManager, accounts.admin, validCourseData.course2);

      // Student submits enrollment requests
      await enrollmentRequest
        .connect(accounts.student1)
        .requestEnrollment(validCourseData.course1.id);
      await enrollmentRequest
        .connect(accounts.student1)
        .requestEnrollment(validCourseData.course2.id);
    });

    it("Should return correct enrollment requests for a student", async function () {
      const requestIds = await enrollmentRequest.connect(accounts.student1).getMyEnrollmentRequests();

      expect(requestIds.length).to.equal(2);

      const request1 = await enrollmentRequest.getEnrollmentRequest(requestIds[0]);
      expect(request1.id).to.equal("REQ-1");
      expect(request1.courseId).to.equal(validCourseData.course1.id);
      expect(request1.status).to.equal(testHelpers.ENROLLMENT_STATUS.PENDING);

      const request2 = await enrollmentRequest.getEnrollmentRequest(requestIds[1]);
      expect(request2.id).to.equal("REQ-2");
      expect(request2.courseId).to.equal(validCourseData.course2.id);
      expect(request2.status).to.equal(testHelpers.ENROLLMENT_STATUS.PENDING);
    });

    it("Should return empty array for students with no requests", async function () {
      const requests = await enrollmentRequest.connect(accounts.student2).getMyEnrollmentRequests();
      expect(requests.length).to.equal(0);
    });

    it("Should return correct information for individual enrollment requests", async function () {
      const requestId = "REQ-1"; // First request ID
      const request = await enrollmentRequest.getEnrollmentRequest(requestId);

      expect(request.id).to.equal(requestId);
      expect(request.studentId).to.equal(testHelpers.getValidStudentData().student1.id);
      expect(request.courseId).to.equal(validCourseData.course1.id);
      expect(request.status).to.equal(testHelpers.ENROLLMENT_STATUS.PENDING);
      expect(request.requestDate).to.be.above(0);
    });

    it("Should reject queries for non-existent enrollment requests", async function () {
      const nonExistentRequestId = "REQ-99";
      await expect(
        enrollmentRequest.getEnrollmentRequest(nonExistentRequestId)
      ).to.be.revertedWithCustomError(enrollmentRequest, "RequestDoesNotExist");
    });
  });

  describe("Access Control Integration", function () {
    beforeEach(async function () {
      // Add course to manager
      await testHelpers.addCourseToManager(courseManager, accounts.admin, validCourseData.course1);
    });

    it("Should reject enrollment requests from users without STUDENT_ROLE", async function () {
      await expect(
        enrollmentRequest.connect(accounts.other).requestEnrollment(validCourseData.course1.id)
      ).to.be.revertedWithCustomError(enrollmentRequest, "StudentNotActive");
    });

    it("Should allow admin to approve enrollment requests", async function () {
      // Add student and create request
      await testHelpers.registerStudentWithData(
        studentRegistry,
        accounts.student1,
        testHelpers.getValidStudentData().student1
      );
      await enrollmentRequest
        .connect(accounts.student1)
        .requestEnrollment(validCourseData.course1.id);

      // Admin can approve
      await expect(enrollmentRequest.connect(accounts.admin).approveEnrollment("REQ-1")).to.not.be
        .reverted;

      // Non-admin cannot approve
      await expect(
        enrollmentRequest.connect(accounts.student1).approveEnrollment("REQ-1")
      ).to.be.revertedWithCustomError(enrollmentRequest, "InsufficientPermissions");
    });

    it("Should allow coordinators to approve enrollment requests", async function () {
      // Add student and create request
      await testHelpers.registerStudentWithData(
        studentRegistry,
        accounts.student1,
        testHelpers.getValidStudentData().student1
      );
      await enrollmentRequest
        .connect(accounts.student1)
        .requestEnrollment(validCourseData.course1.id);

      // Coordinator can approve
      await expect(enrollmentRequest.connect(accounts.coordinator1).approveEnrollment("REQ-1")).to.not.be
        .reverted;

      // Non-coordinator cannot approve
      await expect(
        enrollmentRequest.connect(accounts.student2).approveEnrollment("REQ-1")
      ).to.be.revertedWithCustomError(enrollmentRequest, "InsufficientPermissions");
    });
  });

  describe("System State Management", function () {
    beforeEach(async function () {
      // Add student and course
      await testHelpers.registerStudentWithData(
        studentRegistry,
        accounts.student1,
        testHelpers.getValidStudentData().student1
      );
      await testHelpers.addCourseToManager(courseManager, accounts.admin, validCourseData.course1);
    });

    it("Should maintain correct request count as requests are added", async function () {
      expect(await enrollmentRequest.getEnrollmentRequestsCount()).to.equal(0);

      await enrollmentRequest
        .connect(accounts.student1)
        .requestEnrollment(validCourseData.course1.id);
      expect(await enrollmentRequest.getEnrollmentRequestsCount()).to.equal(1);
    });

    it("Should handle multiple students requesting enrollment", async function () {
      // Add another student
      await testHelpers.registerStudentWithData(
        studentRegistry,
        accounts.student2,
        testHelpers.getValidStudentData().student2
      );

      // Both students request enrollment
      await enrollmentRequest
        .connect(accounts.student1)
        .requestEnrollment(validCourseData.course1.id);
      await enrollmentRequest
        .connect(accounts.student2)
        .requestEnrollment(validCourseData.course1.id);

      expect(await enrollmentRequest.getEnrollmentRequestsCount()).to.equal(2);
    });

    it("Should handle enrollment requests across multiple courses", async function () {
      // Add another course
      await testHelpers.addCourseToManager(courseManager, accounts.admin, validCourseData.course2);

      // Student requests enrollment in both courses
      await enrollmentRequest
        .connect(accounts.student1)
        .requestEnrollment(validCourseData.course1.id);
      await enrollmentRequest
        .connect(accounts.student1)
        .requestEnrollment(validCourseData.course2.id);

      expect(await enrollmentRequest.getEnrollmentRequestsCount()).to.equal(2);
    });

    it("Should correctly handle request status updates", async function () {
      // Student requests enrollment
      await enrollmentRequest
        .connect(accounts.student1)
        .requestEnrollment(validCourseData.course1.id);

      // Check initial status
      const initialRequest = await enrollmentRequest.getEnrollmentRequest("REQ-1");
      expect(initialRequest.status).to.equal(testHelpers.ENROLLMENT_STATUS.PENDING);

      // Admin approves request
      await enrollmentRequest.connect(accounts.admin).approveEnrollment("REQ-1");

      // Check updated status
      const request = await enrollmentRequest.getEnrollmentRequest("REQ-1");
      expect(request.status).to.equal(testHelpers.ENROLLMENT_STATUS.APPROVED);

      // Add a new course (course2)
      await testHelpers.addCourseToManager(courseManager, accounts.admin, validCourseData.course2);

      // Student requests another enrollment
      await enrollmentRequest
        .connect(accounts.student1)
        .requestEnrollment(validCourseData.course2.id);

      // Admin rejects the second request
      await enrollmentRequest.connect(accounts.admin).rejectEnrollment("REQ-2");

      // Check updated status
      const secondRequest = await enrollmentRequest.getEnrollmentRequest("REQ-2");
      expect(secondRequest.status).to.equal(testHelpers.ENROLLMENT_STATUS.REJECTED);
    });
  });
});
