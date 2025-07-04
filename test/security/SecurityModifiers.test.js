const { expect } = require("chai");
const testHelpers = require("../fixtures/testHelpers");

describe("🔐 Security Context - SecurityModifiers", function () {
  let testContract;
  let accessControl;
  let accounts;

  // We need to create a test contract that inherits from SecurityModifiers to test it
  before(async function () {
    // Deploy the TestSecurityContract that inherits from SecurityModifiers
    const TestSecurityContract = await ethers.getContractFactory("TestSecurityContract");
    const setup = await testHelpers.setupBasicSystem();
    accessControl = setup.accessControl;
    accounts = setup.accounts;
    
    testContract = await TestSecurityContract.deploy(accessControl.target);
    await testContract.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should initialize with correct access control reference", async function () {
      expect(await testContract.accessControl()).to.equal(accessControl.target);
    });

    it("Should reject deployment with zero address", async function () {
      const TestSecurityContract = await ethers.getContractFactory("TestSecurityContract");
      await expect(
        TestSecurityContract.deploy(ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(testContract, "InvalidAccessControlAddress");
    });

    it("Should initialize reentrancy status correctly", async function () {
      // We can test this by checking that non-reentrant functions work
      await expect(testContract.connect(accounts.admin).testNonReentrant()).to.not.be.reverted;
    });
  });

  describe("Role-based Modifiers", function () {
    it("Should allow admin to call onlyAdmin functions", async function () {
      await expect(testContract.connect(accounts.admin).testOnlyAdmin()).to.not.be.reverted;
    });

    it("Should reject non-admin from calling onlyAdmin functions", async function () {
      await expect(
        testContract.connect(accounts.student1).testOnlyAdmin()
      ).to.be.revertedWithCustomError(testContract, "NotAdmin");
    });

    it("Should allow coordinator to call onlyCoordinator functions", async function () {
      await expect(testContract.connect(accounts.coordinator1).testOnlyCoordinator()).to.not.be.reverted;
    });

    it("Should reject non-coordinator from calling onlyCoordinator functions", async function () {
      await expect(
        testContract.connect(accounts.student1).testOnlyCoordinator()
      ).to.be.revertedWithCustomError(testContract, "NotCoordinator");
    });

    it("Should allow student to call onlyStudent functions", async function () {
      await expect(testContract.connect(accounts.student1).testOnlyStudent()).to.not.be.reverted;
    });

    it("Should reject non-student from calling onlyStudent functions", async function () {
      await expect(
        testContract.connect(accounts.other).testOnlyStudent()
      ).to.be.revertedWithCustomError(testContract, "NotStudent");
    });

    it("Should allow valid users to call onlyValidUser functions", async function () {
      await expect(testContract.connect(accounts.admin).testOnlyValidUser()).to.not.be.reverted;
      await expect(testContract.connect(accounts.coordinator1).testOnlyValidUser()).to.not.be.reverted;
      await expect(testContract.connect(accounts.student1).testOnlyValidUser()).to.not.be.reverted;
    });

    it("Should reject invalid users from calling onlyValidUser functions", async function () {
      await expect(
        testContract.connect(accounts.other).testOnlyValidUser()
      ).to.be.revertedWithCustomError(testContract, "InvalidUser");
    });
  });

  describe("System State Modifiers", function () {
    it("Should allow functions when system is not paused", async function () {
      await expect(testContract.connect(accounts.admin).testWhenNotPaused()).to.not.be.reverted;
    });

    it("Should reject functions when system is paused", async function () {
      await accessControl.connect(accounts.admin).pause();
      
      await expect(
        testContract.connect(accounts.admin).testWhenNotPaused()
      ).to.be.revertedWithCustomError(testContract, "SystemPaused");
      
      // Unpause for other tests
      await accessControl.connect(accounts.admin).unpause();
    });
  });

  describe("Reentrancy Protection", function () {
    it("Should prevent reentrancy attacks", async function () {
      await expect(
        testContract.connect(accounts.admin).testReentrancy()
      ).to.be.revertedWithCustomError(testContract, "ReentrantCall");
    });

    it("Should allow sequential calls after completion", async function () {
      await expect(testContract.connect(accounts.admin).testNonReentrant()).to.not.be.reverted;
      await expect(testContract.connect(accounts.admin).testNonReentrant()).to.not.be.reverted;
    });
  });

  describe("Input Validation", function () {
    it("Should accept valid addresses", async function () {
      await expect(
        testContract.connect(accounts.admin).testValidAddress(accounts.student1.address)
      ).to.not.be.reverted;
    });

    it("Should reject zero address", async function () {
      await expect(
        testContract.connect(accounts.admin).testValidAddress(ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(testContract, "InvalidAddress");
    });
  });

  describe("Combined Modifiers", function () {
    it("Should work with multiple modifiers", async function () {
      await expect(
        testContract.connect(accounts.admin).testCombinedModifiers(accounts.student1.address)
      ).to.not.be.reverted;
    });

    it("Should fail when any modifier condition is not met", async function () {
      // Test with non-admin (should fail on onlyAdmin)
      await expect(
        testContract.connect(accounts.student1).testCombinedModifiers(accounts.student1.address)
      ).to.be.revertedWithCustomError(testContract, "NotAdmin");

      // Test with invalid address (should fail on validAddress)
      await expect(
        testContract.connect(accounts.admin).testCombinedModifiers(ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(testContract, "InvalidAddress");
    });
  });
});
