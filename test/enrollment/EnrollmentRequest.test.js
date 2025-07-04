import { expect } from "chai";
import { testHelpers } from "../fixtures/testHelpers.js";

describe("📝 Enrollment Context - Enrollment Request", function () {
  let enrollmentRequest;
  let accounts;

  beforeEach(async () => {
    ({ enrollmentRequest, accounts } = await testHelpers.setupEnrollmentRequest());
  });

  describe("Deploymnent", function () {
    it("should store the admin contract address", async function () {
      expect(await enrollmentRequest.CRID_CONTRACT()).to.equal(accounts.admin.address);
    });
    it("should start with zero requests", async function () {
      expect(await enrollmentRequest.getEnrollmentRequestsCount()).to.equal(0);
    });
  });

  describe("Enrollment Request Creation and Cancellation", function () {
    it("should allow an agent to request enrollment in a course", async function () {
      expect(
        await enrollmentRequest.connect(accounts.admin).requestEnrollment(1, accounts.agent.address)
      )
        .to.emit(enrollmentRequest, "EnrollmentRequested")
        .withArgs(1, accounts.agent.address);
    });
    it("should revert if the caller is not the admin", async function () {
      await expect(
        enrollmentRequest.connect(accounts.agent).requestEnrollment(1, accounts.agent.address)
      ).to.be.revertedWithCustomError(enrollmentRequest, "OnlyCRIDContract");
    });
    it("should revert if the agent address is zero", async function () {
      await expect(
        enrollmentRequest.connect(accounts.admin).requestEnrollment(1, testHelpers.ADDRESS_ZERO)
      ).to.be.revertedWithCustomError(enrollmentRequest, "InvalidInput");
    });
    it("should revert if the agent already has an enrollment request for the course", async function () {
      await enrollmentRequest.connect(accounts.admin).requestEnrollment(1, accounts.agent.address);
      await expect(
        enrollmentRequest.connect(accounts.admin).requestEnrollment(1, accounts.agent.address)
      ).to.be.revertedWithCustomError(enrollmentRequest, "AlreadyRequested");
    });
    it("should allow an agent to cancel their pending enrollment request", async function () {
      await enrollmentRequest.connect(accounts.admin).requestEnrollment(1, accounts.agent.address);
      expect(
        await enrollmentRequest
          .connect(accounts.admin)
          .cancelEnrollmentRequest(1, accounts.agent.address)
      )
        .to.emit(enrollmentRequest, "EnrollmentRequestCancelled")
        .withArgs(1, accounts.agent.address);
    });
    it("should revert if the agent tries to cancel a request that does not exist", async function () {
      await expect(
        enrollmentRequest.connect(accounts.admin).cancelEnrollmentRequest(1, accounts.agent.address)
      ).to.be.revertedWithCustomError(enrollmentRequest, "RequestDoesNotExist");
    });
    it("should revert if the caller is not the admin", async function () {
      await enrollmentRequest.connect(accounts.admin).requestEnrollment(1, accounts.agent.address);
      await expect(
        enrollmentRequest.connect(accounts.agent).cancelEnrollmentRequest(1, accounts.agent.address)
      ).to.be.revertedWithCustomError(enrollmentRequest, "OnlyCRIDContract");
    });
    it("should revert if the agent address is zero", async function () {
      await enrollmentRequest.connect(accounts.admin).requestEnrollment(1, accounts.agent.address);
      await expect(
        enrollmentRequest
          .connect(accounts.admin)
          .cancelEnrollmentRequest(1, testHelpers.ADDRESS_ZERO)
      ).to.be.revertedWithCustomError(enrollmentRequest, "InvalidInput");
    });
    it("should revert if the agent tries to cancel a not pending request", async function () {
      await enrollmentRequest.connect(accounts.admin).requestEnrollment(1, accounts.agent.address);
      await enrollmentRequest
        .connect(accounts.admin)
        .cancelEnrollmentRequest(1, accounts.agent.address);
      await expect(
        enrollmentRequest.connect(accounts.admin).cancelEnrollmentRequest(1, accounts.agent.address)
      ).to.be.revertedWithCustomError(enrollmentRequest, "RequestNotPending");
    });
  });
  describe("Enrollment Request Approval and Rejection", function () {
    this.beforeEach(async () => {
      // Create an enrollment request before testing approval and rejection
      await enrollmentRequest.connect(accounts.admin).requestEnrollment(1, accounts.agent.address);
    });

    it("should allow the admin to approve an enrollment request", async function () {
      expect(
        await enrollmentRequest
          .connect(accounts.admin)
          .approveEnrollmentRequest(1, accounts.agent.address)
      )
        .to.emit(enrollmentRequest, "EnrollmentRequestApproved")
        .withArgs(1, accounts.agent.address);
    });
    it("should revert if the caller is not the admin", async function () {
      await expect(
        enrollmentRequest
          .connect(accounts.agent)
          .approveEnrollmentRequest(1, accounts.agent.address)
      ).to.be.revertedWithCustomError(enrollmentRequest, "OnlyCRIDContract");
    });
    it("should revert if the agent address is zero", async function () {
      await expect(
        enrollmentRequest
          .connect(accounts.admin)
          .approveEnrollmentRequest(1, testHelpers.ADDRESS_ZERO)
      ).to.be.revertedWithCustomError(enrollmentRequest, "InvalidInput");
    });
    it("should revert if the request does not exist", async function () {
      await expect(
        enrollmentRequest
          .connect(accounts.admin)
          .approveEnrollmentRequest(999, accounts.agent.address)
      ).to.be.revertedWithCustomError(enrollmentRequest, "RequestDoesNotExist");
    });
    it("should revert if the request is not pending", async function () {
      await enrollmentRequest
        .connect(accounts.admin)
        .approveEnrollmentRequest(1, accounts.agent.address);
      await expect(
        enrollmentRequest
          .connect(accounts.admin)
          .approveEnrollmentRequest(1, accounts.agent.address)
      ).to.be.revertedWithCustomError(enrollmentRequest, "RequestNotPending");
    });
    it("should allow the admin to reject an enrollment request", async function () {
      expect(
        await enrollmentRequest
          .connect(accounts.admin)
          .rejectEnrollmentRequest(1, accounts.agent.address)
      )
        .to.emit(enrollmentRequest, "EnrollmentRequestRejected")
        .withArgs(1, accounts.agent.address);
    });
    it("should revert if the caller is not the admin", async function () {
      await expect(
        enrollmentRequest.connect(accounts.agent).rejectEnrollmentRequest(1, accounts.agent.address)
      ).to.be.revertedWithCustomError(enrollmentRequest, "OnlyCRIDContract");
    });
    it("should revert if the agent address is zero", async function () {
      await expect(
        enrollmentRequest
          .connect(accounts.admin)
          .rejectEnrollmentRequest(1, testHelpers.ADDRESS_ZERO)
      ).to.be.revertedWithCustomError(enrollmentRequest, "InvalidInput");
    });
    it("should revert if the request does not exist", async function () {
      await expect(
        enrollmentRequest
          .connect(accounts.admin)
          .rejectEnrollmentRequest(999, accounts.agent.address)
      ).to.be.revertedWithCustomError(enrollmentRequest, "RequestDoesNotExist");
    });
    it("should revert if the request is not pending", async function () {
      await enrollmentRequest
        .connect(accounts.admin)
        .approveEnrollmentRequest(1, accounts.agent.address);
      await expect(
        enrollmentRequest.connect(accounts.admin).rejectEnrollmentRequest(1, accounts.agent.address)
      ).to.be.revertedWithCustomError(enrollmentRequest, "RequestNotPending");
    });
  });
  describe("Enrollment Request Queries", function () {
    this.beforeEach(async () => {
      const requests = await testHelpers.validEnrollmentRequestData();
      // Create an enrollment request before testing queries
      // Create requests with different statuses
      await enrollmentRequest
        .connect(accounts.admin)
        .requestEnrollment(requests.pending.courseId, requests.pending.studentAddress);
      await enrollmentRequest
        .connect(accounts.admin)
        .requestEnrollment(requests.approved.courseId, requests.approved.studentAddress);
      await enrollmentRequest
        .connect(accounts.admin)
        .requestEnrollment(requests.rejected.courseId, requests.rejected.studentAddress);
      await enrollmentRequest
        .connect(accounts.admin)
        .requestEnrollment(requests.canceled.courseId, requests.canceled.studentAddress);
      await enrollmentRequest
        .connect(accounts.admin)
        .requestEnrollment(requests.otherCourse.courseId, requests.otherCourse.studentAddress);

      // Approve and reject requests to set their statuses
      await enrollmentRequest
        .connect(accounts.admin)
        .approveEnrollmentRequest(requests.approved.id, accounts.admin.address);
      await enrollmentRequest
        .connect(accounts.admin)
        .rejectEnrollmentRequest(requests.rejected.id, accounts.admin.address);
      await enrollmentRequest
        .connect(accounts.admin)
        .cancelEnrollmentRequest(requests.canceled.id, requests.canceled.studentAddress);
    });

    it("should return the correct number of requests", async function () {
      expect(await enrollmentRequest.getEnrollmentRequestsCount()).to.equal(5);
    });
    it("should return the correct request IDs for a course", async function () {
      const courseId = 1;
      const requestIds = await enrollmentRequest.getEnrollmentRequestsByCourse(courseId);
      expect(requestIds.length).to.equal(3);
      expect(requestIds).to.include(1n); // pending
      expect(requestIds).to.include(2n); // approved
      expect(requestIds).to.include(3n); // rejected
    });
    it("should return the correct request IDs for a student", async function () {
      const studentAddress = accounts.agent.address;
      const requestIds = await enrollmentRequest.getEnrollmentRequestsByStudent(studentAddress);
      expect(requestIds.length).to.equal(2);
      expect(requestIds).to.include(1n); // pending
      expect(requestIds).to.include(4n); // canceled
    });
    it("should return the correct request details", async function () {
      const requestId = 1; // pending request
      const requestDetails = await enrollmentRequest.getEnrollmentRequest(requestId);
      expect(requestDetails.id).to.equal(BigInt(requestId));
      expect(requestDetails.student).to.equal(accounts.agent.address);
      expect(requestDetails.status).to.equal(0n); // enrollmentRequest.RequestStatus.Pending
      expect(requestDetails.courseId).to.equal(1n);
      // Cannot compare requestDate
      expect(requestDetails.requestDate).to.be.a("bigint");
    });
  });
});
