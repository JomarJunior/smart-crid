const { ethers } = require("hardhat");
const { expects } = require("chai");

// Common test utilities
const testHelpers = {
  // Deploy access control contract
  async deployAccessControl() {
    const AccessControl = await ethers.getContractFactory("CRIDAccessControl");
    const accessControl = await AccessControl.deploy();
    await accessControl.waitForDeployment();
    return accessControl;
  },

  // Get test accounts with roles
  async getTestAccounts() {
    const [admin, coordinator1, coordinator2, student1, student2, student3, other] =
      await ethers.getSigners();

    return {
      admin,
      coordinator1,
      coordinator2,
      student1,
      student2,
      student3,
      other,
    };
  },

  // Setup basic system with roles
  async setupBasicSystem() {
    const accounts = await this.getTestAccounts();
    const accessControl = await this.deployAccessControl();

    // Add coordinators
    await accessControl.connect(accounts.admin).addCoordinator(accounts.coordinator1.address);
    await accessControl.connect(accounts.admin).addCoordinator(accounts.coordinator2.address);

    // Add students
    await accessControl.connect(accounts.admin).addStudent(accounts.student1.address);
    await accessControl.connect(accounts.admin).addStudent(accounts.student2.address);
    await accessControl.connect(accounts.admin).addStudent(accounts.student3.address);

    return { accessControl, accounts };
  },

  // Constants for roles
  ROLES: {
    ADMIN: ethers.keccak256(ethers.toUtf8Bytes("ADMIN_ROLE")),
    COORDINATOR: ethers.keccak256(ethers.toUtf8Bytes("COORDINATOR_ROLE")),
    STUDENT: ethers.keccak256(ethers.toUtf8Bytes("STUDENT_ROLE")),
  },
};

module.exports = testHelpers;
