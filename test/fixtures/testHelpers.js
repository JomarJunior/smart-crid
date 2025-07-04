const { ethers } = require("hardhat");

// Common test utilities
const testHelpers = {
  // Deploy access control contract
  async deployAccessControl() {
    const AccessControl = await ethers.getContractFactory("CRIDAccessControl");
    const accessControl = await AccessControl.deploy();
    await accessControl.waitForDeployment();
    return accessControl;
  },

  // Deploy student registry contract
  async deployStudentRegistry(accessControlAddress) {
    const StudentRegistry = await ethers.getContractFactory("StudentRegistry");
    const studentRegistry = await StudentRegistry.deploy(accessControlAddress);
    await studentRegistry.waitForDeployment();
    return studentRegistry;
  },

  // Deploy mock course manager contract
  async deployMockCourseManager() {
    const MockCourseManager = await ethers.getContractFactory("MockCourseManager");
    const courseManager = await MockCourseManager.deploy();
    await courseManager.waitForDeployment();
    return courseManager;
  },

  // Deploy enrollment request contract
  async deployEnrollmentRequest(studentRegistryAddress, courseManagerAddress) {
    const EnrollmentRequest = await ethers.getContractFactory("EnrollmentRequest");
    const enrollmentRequest = await EnrollmentRequest.deploy(studentRegistryAddress, courseManagerAddress);
    await enrollmentRequest.waitForDeployment();
    return enrollmentRequest;
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

  // Setup basic system with roles (AccessControl only)
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

  // Setup complete system with StudentRegistry
  async setupStudentRegistrySystem() {
    const accounts = await this.getTestAccounts();
    const accessControl = await this.deployAccessControl();
    const studentRegistry = await this.deployStudentRegistry(accessControl.target);

    // Add coordinators
    await accessControl.connect(accounts.admin).addCoordinator(accounts.coordinator1.address);
    await accessControl.connect(accounts.admin).addCoordinator(accounts.coordinator2.address);

    // Add students
    await accessControl.connect(accounts.admin).addStudent(accounts.student1.address);
    await accessControl.connect(accounts.admin).addStudent(accounts.student2.address);
    await accessControl.connect(accounts.admin).addStudent(accounts.student3.address);

    return { accessControl, studentRegistry, accounts };
  },

  // Setup StudentRegistry with test data
  async setupStudentRegistryWithData() {
    const setup = await this.setupStudentRegistrySystem();
    const { accessControl, studentRegistry, accounts } = setup;

    // Register some test students
    await studentRegistry
      .connect(accounts.student1)
      .registerStudent(
        "118210898",
        "Pablo Vegetti",
        "pablo.vegetti@poli.ufrj.br",
        "Goal Engineering",
        2018
      );

    await studentRegistry
      .connect(accounts.student2)
      .registerStudent(
        "119980821",
        "Leo Jardim",
        "leo.jardim@poli.ufrj.br",
        "Goal Reverse-engineering",
        2019
      );

    return { accessControl, studentRegistry, accounts };
  },

  // Test student data helpers
  getValidStudentData() {
    return {
      student1: {
        id: "118210898",
        name: "Pablo Vegetti",
        email: "pablo.vegetti@poli.ufrj.br",
        program: "Goal Engineering",
        year: 2018,
      },
      student2: {
        id: "119980821",
        name: "Leo Jardim",
        email: "leo.jardim@poli.ufrj.br",
        program: "Goal Reverse-engineering",
        year: 2019,
      },
      student3: {
        id: "120055443",
        name: "Filipe Luis",
        email: "filipe.luis@poli.ufrj.br",
        program: "Defensive Engineering",
        year: 2020,
      },
    };
  },

  getInvalidStudentData() {
    return {
      emptyId: {
        id: "",
        name: "Test Student",
        email: "test@poli.ufrj.br",
        program: "Test Program",
        year: 2024,
      },
      emptyName: {
        id: "999999999",
        name: "",
        email: "test@poli.ufrj.br",
        program: "Test Program",
        year: 2024,
      },
      emptyEmail: {
        id: "999999999",
        name: "Test Student",
        email: "",
        program: "Test Program",
        year: 2024,
      },
      emptyProgram: {
        id: "999999999",
        name: "Test Student",
        email: "test@poli.ufrj.br",
        program: "",
        year: 2024,
      },
      invalidYear: {
        id: "999999999",
        name: "Test Student",
        email: "test@poli.ufrj.br",
        program: "Test Program",
        year: 1900, // Too old
      },
    };
  },

  // Course test data helpers
  getValidCourseData() {
    return {
      course1: {
        id: "ENG101",
        name: "Introduction to Engineering",
        description: "Fundamental concepts of engineering design and methodology",
        credits: 4,
        maxStudents: 30,
        isActive: true,
      },
      course2: {
        id: "MAT201", 
        name: "Advanced Mathematics",
        description: "Advanced calculus and linear algebra for engineers",
        credits: 6,
        maxStudents: 25,
        isActive: true,
      },
      course3: {
        id: "PHY301",
        name: "Physics Laboratory",
        description: "Hands-on experiments in classical and modern physics",
        credits: 3,
        maxStudents: 20,
        isActive: true,
      },
    };
  },

  getInvalidCourseData() {
    return {
      emptyCourseId: {
        id: "",
        name: "Valid Course",
        description: "A valid course with empty ID",
        maxStudents: 30,
        isActive: true,
      },
      emptyCourseName: {
        id: "TST999",
        name: "",
        description: "A course with empty name",
        credits: 3,
        maxStudents: 30,
        isActive: true,
      },
      invalidCredits: {
        id: "TST999",
        name: "Valid Course",
        description: "A course with invalid credits",
        credits: 0,
        maxStudents: 30,
        isActive: true,
      },
    };
  },

  // Setup complete EnrollmentRequest system
  async setupEnrollmentRequestSystem() {
    const accounts = await this.getTestAccounts();
    const accessControl = await this.deployAccessControl();
    const studentRegistry = await this.deployStudentRegistry(accessControl.target);
    const courseManager = await this.deployMockCourseManager();
    const enrollmentRequest = await this.deployEnrollmentRequest(
      studentRegistry.target,
      courseManager.target
    );

    // Add coordinators
    await accessControl.connect(accounts.admin).addCoordinator(accounts.coordinator1.address);
    await accessControl.connect(accounts.admin).addCoordinator(accounts.coordinator2.address);

    // Add students
    await accessControl.connect(accounts.admin).addStudent(accounts.student1.address);
    await accessControl.connect(accounts.admin).addStudent(accounts.student2.address);
    await accessControl.connect(accounts.admin).addStudent(accounts.student3.address);

    return {
      accessControl,
      studentRegistry,
      courseManager,
      enrollmentRequest,
      accounts,
    };
  },

  // Helper to add a course to mock course manager
  async addCourseToManager(courseManager, signer, courseData) {
    return await courseManager
      .connect(signer)
      .addCourse(courseData.id, courseData.name, courseData.description, courseData.credits, courseData.maxStudents);
  },

  // Helper to register a student with given data
  async registerStudentWithData(studentRegistry, signer, data) {
    return await studentRegistry
      .connect(signer)
      .registerStudent(data.id, data.name, data.email, data.program, data.year);
  },

  // Constants for roles
  ROLES: {
    ADMIN: ethers.keccak256(ethers.toUtf8Bytes("ADMIN_ROLE")),
    COORDINATOR: ethers.keccak256(ethers.toUtf8Bytes("COORDINATOR_ROLE")),
    STUDENT: ethers.keccak256(ethers.toUtf8Bytes("STUDENT_ROLE")),
  },

  // Enrollment request status constants
  ENROLLMENT_STATUS: {
    PENDING: 0,
    APPROVED: 1,
    REJECTED: 2,
    CANCELLED: 3,
  },

  // Deploy test security contract
  async deployTestSecurityContract(accessControlAddress) {
    const TestSecurityContract = await ethers.getContractFactory("TestSecurityContract");
    const testContract = await TestSecurityContract.deploy(accessControlAddress);
    await testContract.waitForDeployment();
    return testContract;
  },

  // Setup system with security modifiers test contract
  async setupSecurityModifiersSystem() {
    const setup = await this.setupBasicSystem();
    const testContract = await this.deployTestSecurityContract(setup.accessControl.target);
    
    return {
      ...setup,
      testContract,
    };
  },

  // Additional course data for comprehensive testing
  getExtendedCourseData() {
    return {
      ...this.getValidCourseData(),
      specialCharsCourse: {
        id: "SPECIAL-123_ÁÉÍ",
        name: "Курс with Émojis 🎓",
        description: "Course with special characters and unicode",
        credits: 3,
        maxStudents: 15,
        isActive: true,
      },
      maxValuesCourse: {
        id: "MAX_COURSE",
        name: "Maximum Values Course",
        description: "Course testing maximum uint16 values",
        credits: 65535,
        maxStudents: 65535,
        isActive: true,
      },
    };
  },
};

module.exports = testHelpers;
