import { expect } from "chai";
import { testHelpers } from "../fixtures/testHelpers.js";

describe("🔐 Security Context - CRIDAccessControl", function () {
  let accessControl;
  let accounts;

  this.beforeEach(async function () {
    const setup = await testHelpers.setupAccessControl();
    accessControl = setup.accessControl;
    accounts = setup.accounts;
  });

  describe("Deployment", function () {
    it("should deploy with the correct admin", async function () {
      const { admin } = accounts;
      expect(await accessControl.systemAdmin()).to.equal(admin.address);

      expect(await accessControl.hasRole(await accessControl.ADMIN_ROLE(), admin.address)).to.be
        .true;
    });

    it("should deploy with the correct coordinators", async function () {
      const { coordinator1, coordinator2, coordinator3 } = accounts;
      expect(
        await accessControl.hasRole(await accessControl.COORDINATOR_ROLE(), coordinator1.address)
      ).to.be.true;
      expect(
        await accessControl.hasRole(await accessControl.COORDINATOR_ROLE(), coordinator2.address)
      ).to.be.true;
      expect(
        await accessControl.hasRole(await accessControl.COORDINATOR_ROLE(), coordinator3.address)
      ).to.be.true;
    });

    it("should deploy with the correct students", async function () {
      const { student1, student2, student3 } = accounts;
      expect(await accessControl.hasRole(await accessControl.STUDENT_ROLE(), student1.address)).to
        .be.true;
      expect(await accessControl.hasRole(await accessControl.STUDENT_ROLE(), student2.address)).to
        .be.true;
      expect(await accessControl.hasRole(await accessControl.STUDENT_ROLE(), student3.address)).to
        .be.true;
    });

    it("should deploy unpaused", async function () {
      expect(await accessControl.paused()).to.be.false;
    });
  });

  describe("Role Management", function () {
    it("should allow admin to add coordinator", async function () {
      const { admin, coordinator1 } = accounts;
      await accessControl.connect(admin).addCoordinator(coordinator1.address);
      expect(
        await accessControl.hasRole(await accessControl.COORDINATOR_ROLE(), coordinator1.address)
      ).to.be.true;
    });

    it("should allow admin to remove coordinator", async function () {
      const { admin, coordinator1 } = accounts;
      await accessControl.connect(admin).removeCoordinator(coordinator1.address);
      expect(
        await accessControl.hasRole(await accessControl.COORDINATOR_ROLE(), coordinator1.address)
      ).to.be.false;
    });

    it("should allow admin to add student", async function () {
      const { admin, student1 } = accounts;
      await accessControl.connect(admin).addStudent(student1.address);
      expect(await accessControl.hasRole(await accessControl.STUDENT_ROLE(), student1.address)).to
        .be.true;
    });

    it("should allow admin to remove student", async function () {
      const { admin, student1 } = accounts;
      await accessControl.connect(admin).removeStudent(student1.address);
      expect(await accessControl.hasRole(await accessControl.STUDENT_ROLE(), student1.address)).to
        .be.false;
    });

    it("should not allow non-admin to add coordinator", async function () {
      const { coordinator1 } = accounts;
      await expect(
        accessControl.connect(coordinator1).addCoordinator(coordinator1.address)
      ).to.be.revertedWithCustomError(accessControl, "InsufficientPermissions");
    });

    it("should not allow non-admin to remove coordinator", async function () {
      const { coordinator1 } = accounts;
      await expect(
        accessControl.connect(coordinator1).removeCoordinator(coordinator1.address)
      ).to.be.revertedWithCustomError(accessControl, "InsufficientPermissions");
    });

    it("should not allow non-admin to add student", async function () {
      const { coordinator1 } = accounts;
      await expect(
        accessControl.connect(coordinator1).addStudent(coordinator1.address)
      ).to.be.revertedWithCustomError(accessControl, "InsufficientPermissions");
    });

    it("should not allow non-admin to remove student", async function () {
      const { coordinator1 } = accounts;
      await expect(
        accessControl.connect(coordinator1).removeStudent(coordinator1.address)
      ).to.be.revertedWithCustomError(accessControl, "InsufficientPermissions");
    });

    it("should not allow adding coordinator when the system is paused", async function () {
      const { admin, coordinator1 } = accounts;
      await accessControl.connect(admin).pause();
      await expect(
        accessControl.connect(admin).addCoordinator(coordinator1.address)
      ).to.be.revertedWithCustomError(accessControl, "SystemIsPaused");
    });

    it("should not allow removing coordinator when the system is paused", async function () {
      const { admin, coordinator1 } = accounts;
      await accessControl.connect(admin).pause();
      await expect(
        accessControl.connect(admin).removeCoordinator(coordinator1.address)
      ).to.be.revertedWithCustomError(accessControl, "SystemIsPaused");
    });

    it("should not allow adding student when the system is paused", async function () {
      const { admin, student1 } = accounts;
      await accessControl.connect(admin).pause();
      await expect(
        accessControl.connect(admin).addStudent(student1.address)
      ).to.be.revertedWithCustomError(accessControl, "SystemIsPaused");
    });

    it("should not allow removing student when the system is paused", async function () {
      const { admin, student1 } = accounts;
      await accessControl.connect(admin).pause();
      await expect(
        accessControl.connect(admin).removeStudent(student1.address)
      ).to.be.revertedWithCustomError(accessControl, "SystemIsPaused");
    });

    it("should not allow adding coordinator with zero address", async function () {
      const { admin } = accounts;

      await expect(
        accessControl.connect(admin).addCoordinator(testHelpers.ADDRESS_ZERO)
      ).to.be.revertedWithCustomError(accessControl, "InvalidAddress");
    });

    it("should not allow removing coordinator with zero address", async function () {
      const { admin } = accounts;
      await expect(
        accessControl.connect(admin).removeCoordinator(testHelpers.ADDRESS_ZERO)
      ).to.be.revertedWithCustomError(accessControl, "InvalidAddress");
    });

    it("should not allow adding student with zero address", async function () {
      const { admin } = accounts;
      await expect(
        accessControl.connect(admin).addStudent(testHelpers.ADDRESS_ZERO)
      ).to.be.revertedWithCustomError(accessControl, "InvalidAddress");
    });

    it("should not allow removing student with zero address", async function () {
      const { admin } = accounts;
      await expect(
        accessControl.connect(admin).removeStudent(testHelpers.ADDRESS_ZERO)
      ).to.be.revertedWithCustomError(accessControl, "InvalidAddress");
    });
  });

  describe("Emergency Pausing", function () {
    it("should allow admin to pause the system", async function () {
      const { admin } = accounts;
      await accessControl.connect(admin).pause();
      expect(await accessControl.paused()).to.be.true;
    });

    it("should allow admin to unpause the system", async function () {
      const { admin } = accounts;
      await accessControl.connect(admin).pause();
      await accessControl.connect(admin).unpause();
      expect(await accessControl.paused()).to.be.false;
    });

    it("should not allow non-admin to pause the system", async function () {
      const { coordinator1 } = accounts;
      await expect(accessControl.connect(coordinator1).pause()).to.be.revertedWithCustomError(
        accessControl,
        "InsufficientPermissions"
      );
    });

    it("should not allow non-admin to unpause the system", async function () {
      const { coordinator1 } = accounts;
      await expect(accessControl.connect(coordinator1).unpause()).to.be.revertedWithCustomError(
        accessControl,
        "InsufficientPermissions"
      );
    });

    it("should not allow pause when already paused", async function () {
      const { admin } = accounts;
      await accessControl.connect(admin).pause();
      await expect(accessControl.connect(admin).pause()).to.be.revertedWithCustomError(
        accessControl,
        "SystemIsPaused"
      );
    });

    it("should gracefully handle unpause when already unpaused", async function () {
      const { admin } = accounts;
      await accessControl.connect(admin).unpause();
      await expect(accessControl.connect(admin).unpause()).to.not.be.reverted;
      expect(await accessControl.paused()).to.be.false;
    });
  });
});
