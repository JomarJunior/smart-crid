const { expect } = require("chai");
const testHelpers = require("../fixtures/testHelpers");

describe("🔐 Security Context - Access Control", function () {
  let accessControl;
  let accounts;

  this.beforeEach(async function () {
    const setup = await testHelpers.setupBasicSystem();
    accessControl = setup.accessControl;
    accounts = setup.accounts;
  });

  describe("Deployment", function () {
    it("Should set the correct admin", async function () {
      expect(await accessControl.systemAdmin()).to.equal(accounts.admin.address);
    });

    it("Should grant admin role to deployer", async function () {
      expect(await accessControl.hasRole(testHelpers.ROLES.ADMIN, accounts.admin.address)).to.be
        .true;
    });

    it("Should not be paused initially", async function () {
      expect(await accessControl.paused()).to.be.false;
    });
  });

  describe("Role Management", function () {
    it("Should allow admin to add coordinators", async function () {
      await expect(accessControl.connect(accounts.admin).addCoordinator(accounts.other.address))
        .to.emit(accessControl, "RoleGranted")
        .withArgs(testHelpers.ROLES.COORDINATOR, accounts.other.address, accounts.admin.address);

      expect(await accessControl.hasRole(testHelpers.ROLES.COORDINATOR, accounts.other.address)).to
        .be.true;
    });

    it("Should allow admin and coordinators to add students", async function () {
      // Admin adds student
      await expect(
        accessControl.connect(accounts.admin).addStudent(accounts.other.address)
      ).to.emit(accessControl, "RoleGranted");

      expect(await accessControl.hasRole(testHelpers.ROLES.STUDENT, accounts.other.address)).to.be
        .true;
    });

    it("Should reject unauthorized adding coordinators", async function () {
      await expect(
        accessControl.connect(accounts.student1).addCoordinator(accounts.other.address)
      ).to.be.revertedWithCustomError(accessControl, "InsufficientPermissions");

      await expect(
        accessControl.connect(accounts.coordinator1).addCoordinator(accounts.other.address)
      ).to.be.revertedWithCustomError(accessControl, "InsufficientPermissions");

      await expect(
        accessControl.connect(accounts.other).addCoordinator(accounts.other.address)
      ).to.be.revertedWithCustomError(accessControl, "InsufficientPermissions");
    });

    it("Should reject unauthorized adding students", async function () {
      await expect(
        accessControl.connect(accounts.student1).addStudent(accounts.other.address)
      ).to.be.revertedWithCustomError(accessControl, "InsufficientPermissions");

      await expect(
        accessControl.connect(accounts.other).addStudent(accounts.other.address)
      ).to.be.revertedWithCustomError(accessControl, "InsufficientPermissions");
    });
  });

  describe("Emergency Controls", function () {
    it("Should allow admin to pause system", async function () {
      await expect(accessControl.connect(accounts.admin).pause())
        .to.emit(accessControl, "EmergencyPause")
        .withArgs(true, accounts.admin.address);

      expect(await accessControl.paused()).to.be.true;
    });

    it("Should reject operations when paused", async function () {
      await accessControl.connect(accounts.admin).pause();

      await expect(
        accessControl.connect(accounts.admin).addCoordinator(accounts.other.address)
      ).to.be.revertedWithCustomError(accessControl, "SystemIsPaused");
    });

    it("Should allow admin to unpause", async function () {
      await accessControl.connect(accounts.admin).pause();
      await accessControl.connect(accounts.admin).unpause();

      expect(await accessControl.paused()).to.be.false;
    });

    it("Should reject non-admin from pausing", async function () {
      await expect(
        accessControl.connect(accounts.coordinator1).pause()
      ).to.be.revertedWithCustomError(accessControl, "InsufficientPermissions");

      await expect(accessControl.connect(accounts.student1).pause()).to.be.revertedWithCustomError(
        accessControl,
        "InsufficientPermissions"
      );

      await expect(accessControl.connect(accounts.other).pause()).to.be.revertedWithCustomError(
        accessControl,
        "InsufficientPermissions"
      );
    });

    it("Should reject non-admin from unpausing", async function () {
      await expect(
        accessControl.connect(accounts.coordinator1).unpause()
      ).to.be.revertedWithCustomError(accessControl, "InsufficientPermissions");

      await expect(
        accessControl.connect(accounts.student1).unpause()
      ).to.be.revertedWithCustomError(accessControl, "InsufficientPermissions");

      await expect(accessControl.connect(accounts.other).unpause()).to.be.revertedWithCustomError(
        accessControl,
        "InsufficientPermissions"
      );
    });
  });

  describe("User Validation", function () {
    it("Should correctly identify valid users", async function () {
      expect(await accessControl.isValidUser(accounts.admin.address)).to.be.true;
      expect(await accessControl.isValidUser(accounts.coordinator1.address)).to.be.true;
      expect(await accessControl.isValidUser(accounts.student1.address)).to.be.true;
      expect(await accessControl.isValidUser(accounts.other.address)).to.be.false;
    });
  });
});
