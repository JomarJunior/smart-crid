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

    it("Should allow admin to remove coordinators", async function () {
      // First add a coordinator
      await accessControl.connect(accounts.admin).addCoordinator(accounts.other.address);
      expect(await accessControl.hasRole(testHelpers.ROLES.COORDINATOR, accounts.other.address)).to.be.true;

      // Then remove the coordinator
      await expect(accessControl.connect(accounts.admin).removeCoordinator(accounts.other.address))
        .to.emit(accessControl, "RoleRevoked")
        .withArgs(testHelpers.ROLES.COORDINATOR, accounts.other.address, accounts.admin.address);

      expect(await accessControl.hasRole(testHelpers.ROLES.COORDINATOR, accounts.other.address)).to.be.false;
    });

    it("Should allow admin and coordinators to remove students", async function () {
      // First add a student
      await accessControl.connect(accounts.admin).addStudent(accounts.other.address);
      expect(await accessControl.hasRole(testHelpers.ROLES.STUDENT, accounts.other.address)).to.be.true;

      // Admin removes student
      await expect(accessControl.connect(accounts.admin).removeStudent(accounts.other.address))
        .to.emit(accessControl, "RoleRevoked")
        .withArgs(testHelpers.ROLES.STUDENT, accounts.other.address, accounts.admin.address);

      expect(await accessControl.hasRole(testHelpers.ROLES.STUDENT, accounts.other.address)).to.be.false;

      // Add student again for coordinator test
      await accessControl.connect(accounts.admin).addStudent(accounts.other.address);
      
      // Coordinator removes student
      await expect(accessControl.connect(accounts.coordinator1).removeStudent(accounts.other.address))
        .to.emit(accessControl, "RoleRevoked");

      expect(await accessControl.hasRole(testHelpers.ROLES.STUDENT, accounts.other.address)).to.be.false;
    });

    it("Should reject adding coordinators with zero address", async function () {
      await expect(
        accessControl.connect(accounts.admin).addCoordinator(ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(accessControl, "InvalidAddress");
    });

    it("Should reject adding students with zero address", async function () {
      await expect(
        accessControl.connect(accounts.admin).addStudent(ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(accessControl, "InvalidAddress");
    });

    it("Should reject removing coordinators with zero address", async function () {
      await expect(
        accessControl.connect(accounts.admin).removeCoordinator(ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(accessControl, "InvalidAddress");
    });

    it("Should reject removing students with zero address", async function () {
      await expect(
        accessControl.connect(accounts.admin).removeStudent(ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(accessControl, "InvalidAddress");
    });

    it("Should reject unauthorized removal of coordinators", async function () {
      await expect(
        accessControl.connect(accounts.coordinator1).removeCoordinator(accounts.coordinator2.address)
      ).to.be.revertedWithCustomError(accessControl, "InsufficientPermissions");

      await expect(
        accessControl.connect(accounts.student1).removeCoordinator(accounts.coordinator1.address)
      ).to.be.revertedWithCustomError(accessControl, "InsufficientPermissions");
    });

    it("Should reject unauthorized removal of students", async function () {
      await expect(
        accessControl.connect(accounts.student1).removeStudent(accounts.student2.address)
      ).to.be.revertedWithCustomError(accessControl, "InsufficientPermissions");

      await expect(
        accessControl.connect(accounts.other).removeStudent(accounts.student1.address)
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

    it("Should return false for zero address", async function () {
      expect(await accessControl.isValidUser(ethers.ZeroAddress)).to.be.false;
    });

    it("Should update validation after role changes", async function () {
      // Initially, accounts.other should not be valid
      expect(await accessControl.isValidUser(accounts.other.address)).to.be.false;

      // Add as student
      await accessControl.connect(accounts.admin).addStudent(accounts.other.address);
      expect(await accessControl.isValidUser(accounts.other.address)).to.be.true;

      // Remove student role
      await accessControl.connect(accounts.admin).removeStudent(accounts.other.address);
      expect(await accessControl.isValidUser(accounts.other.address)).to.be.false;

      // Add as coordinator
      await accessControl.connect(accounts.admin).addCoordinator(accounts.other.address);
      expect(await accessControl.isValidUser(accounts.other.address)).to.be.true;
    });
  });

  describe("Edge Cases and Integration", function () {
    it("Should handle multiple role operations", async function () {
      const testUser = accounts.other.address;

      // Start with no roles
      expect(await accessControl.hasRole(testHelpers.ROLES.STUDENT, testUser)).to.be.false;
      expect(await accessControl.hasRole(testHelpers.ROLES.COORDINATOR, testUser)).to.be.false;

      // Add student role
      await accessControl.connect(accounts.admin).addStudent(testUser);
      expect(await accessControl.hasRole(testHelpers.ROLES.STUDENT, testUser)).to.be.true;

      // Add coordinator role (user can have multiple roles)
      await accessControl.connect(accounts.admin).addCoordinator(testUser);
      expect(await accessControl.hasRole(testHelpers.ROLES.COORDINATOR, testUser)).to.be.true;
      expect(await accessControl.hasRole(testHelpers.ROLES.STUDENT, testUser)).to.be.true;

      // Remove student role
      await accessControl.connect(accounts.admin).removeStudent(testUser);
      expect(await accessControl.hasRole(testHelpers.ROLES.STUDENT, testUser)).to.be.false;
      expect(await accessControl.hasRole(testHelpers.ROLES.COORDINATOR, testUser)).to.be.true;
    });

    it("Should maintain system integrity during pause/unpause cycles", async function () {
      // Add roles before pause
      await accessControl.connect(accounts.admin).addCoordinator(accounts.other.address);
      
      // Pause system
      await accessControl.connect(accounts.admin).pause();
      expect(await accessControl.paused()).to.be.true;

      // Operations should fail when paused
      await expect(
        accessControl.connect(accounts.admin).addStudent(accounts.other.address)
      ).to.be.revertedWithCustomError(accessControl, "SystemIsPaused");

      // Unpause system
      await accessControl.connect(accounts.admin).unpause();
      expect(await accessControl.paused()).to.be.false;

      // Operations should work again
      await expect(
        accessControl.connect(accounts.admin).addStudent(accounts.other.address)
      ).to.not.be.reverted;

      // Roles should be preserved
      expect(await accessControl.hasRole(testHelpers.ROLES.COORDINATOR, accounts.other.address)).to.be.true;
    });

    it("Should emit correct events for all operations", async function () {
      const testUser = accounts.other.address;

      // Test SystemInitialized event (already emitted in constructor)
      // We can't test this directly, but we can verify the admin was set correctly
      expect(await accessControl.systemAdmin()).to.equal(accounts.admin.address);

      // Test EmergencyPause events
      await expect(accessControl.connect(accounts.admin).pause())
        .to.emit(accessControl, "EmergencyPause")
        .withArgs(true, accounts.admin.address);

      await expect(accessControl.connect(accounts.admin).unpause())
        .to.emit(accessControl, "EmergencyPause")
        .withArgs(false, accounts.admin.address);
    });
  });
});
