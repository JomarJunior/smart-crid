const hre = require("hardhat");
const { ethers } = hre;

const testHelpers = {
  // ==============================
  // Access Control Helpers
  // ==============================
  async deployAccessControl() {
    const [admin] = await ethers.getSigners();

    const AccessControl = await ethers.getContractFactory("CRIDAccessControl");
    const accessControl = await AccessControl.connect(admin).deploy(admin.address);
    await accessControl.waitForDeployment();
    return accessControl;
  },

  async setupAccessControl() {
    const accessControl = await this.deployAccessControl();
    const [admin, coordinator1, coordinator2, coordinator3, student1, student2, student3, guest] =
      await ethers.getSigners();

    // Set up roles
    await accessControl.connect(admin).addCoordinator(coordinator1.address);
    await accessControl.connect(admin).addCoordinator(coordinator2.address);
    await accessControl.connect(admin).addCoordinator(coordinator3.address);
    await accessControl.connect(admin).addStudent(student1.address);
    await accessControl.connect(admin).addStudent(student2.address);
    await accessControl.connect(admin).addStudent(student3.address);

    return {
      accessControl,
      accounts: {
        admin,
        coordinator1,
        coordinator2,
        coordinator3,
        student1,
        student2,
        student3,
        guest,
      },
    };
  },
  // ==============================
  // Student Registry Helpers
  // ==============================
  async deployStudentRegistry() {
    const [admin] = await ethers.getSigners();

    const StudentRegistry = await ethers.getContractFactory("StudentRegistry");
    const studentRegistry = await StudentRegistry.connect(admin).deploy(admin.address);
    await studentRegistry.waitForDeployment();
    return studentRegistry;
  },

  async deployStudentRegistryWithCRID(cridAddress) {
    const [admin] = await ethers.getSigners();

    const StudentRegistry = await ethers.getContractFactory("StudentRegistry");
    const studentRegistry = await StudentRegistry.connect(admin).deploy(cridAddress);
    await studentRegistry.waitForDeployment();
    return studentRegistry;
  },
  async setupStudentRegistry() {
    const studentRegistry = await this.deployStudentRegistry();
    const [admin, student1, student2, student3, other] = await ethers.getSigners();

    return {
      studentRegistry,
      accounts: {
        admin,
        student1,
        student2,
        student3,
        other,
      },
    };
  },
  async validStudentData() {
    const [admin, student1, student2, student3] = await ethers.getSigners();
    return {
      student1: {
        studentAddress: student1.address,
        id: "118210898",
        fullName: "Pablo Vegetti",
        email: "pablo.vegetti@poli.ufrj.br",
        program: "Goal Engineering",
        enrollmentYear: 2018,
      },
      student2: {
        studentAddress: student2.address,
        id: "119210899",
        fullName: "Leo Jardim",
        email: "leo.jardim@poli.ufrj.br",
        program: "Goal Reverse-engineering",
        enrollmentYear: 2019,
      },
      student3: {
        studentAddress: student3.address,
        id: "117210900",
        fullName: "Fhilipe Couthinh",
        email: "phelipe.coutinho@poli.ufrj.br",
        program: "Goal Architecture",
        enrollmentYear: 2017,
      },
    };
  },
  async invalidStudentData() {
    const [admin, invalidStudent1] = await ethers.getSigners();
    return {
      emptyAddress: {
        studentAddress: "",
        id: "106456789",
        fullName: "Alex Teixeira",
        email: "alex.teixeira@poli.ufrj.br",
        program: "Goal Engineering",
        enrollmentYear: 2006,
      },
      zeroAddress: {
        studentAddress: this.ADDRESS_ZERO,
        id: "106456790",
        fullName: "Josef de Souza",
        email: "josef.de.souza@poli.ufrj.br",
        program: "Goal Reverse-engineering",
        enrollmentYear: 2006,
      },
      emptyId: {
        studentAddress: invalidStudent1.address,
        id: "",
        fullName: "Emerson Rodrigues",
        email: "emerson.rodrigues@poli.ufrj.br",
        program: "Goal Engineering",
        enrollmentYear: 2023,
      },
      emptyFullName: {
        studentAddress: invalidStudent1.address,
        id: "106456791",
        fullName: "",
        email: "clayton.silva@poli.ufrj.br",
        program: "Goal Engineering",
        enrollmentYear: 2023,
      },
      emptyEmail: {
        studentAddress: invalidStudent1.address,
        id: "106456792",
        fullName: "Rossicley Pereira",
        email: "",
        program: "Goal Engineering",
        enrollmentYear: 2023,
      },
      emptyProgram: {
        studentAddress: invalidStudent1.address,
        id: "106456793",
        fullName: "Toko Filipe",
        email: "toko.filipe@poli.ufrj.br",
        program: "",
        enrollmentYear: 2023,
      },
    };
  },
  async edgeCasesStudentData() {
    const [admin, student1] = await ethers.getSigners();
    return {
      accentedFullName: {
        studentAddress: student1.address,
        id: "106456794",
        fullName: "Léo Pelé",
        email: "leo.pele@poli.ufrj.br",
        program: "Goal Reverse-engineering",
        enrollmentYear: 2023,
      },
      accentedProgram: {
        studentAddress: student1.address,
        id: "106456795",
        fullName: "Dimitri Payet",
        email: "dimitri.payet@poli.ufrj.br",
        program: "But Ingénierie",
        enrollmentYear: 2023,
      },
    };
  },
  // ==============================
  // CRID Helpers
  // ==============================
  async deployCRID(accessControlAddress) {
    const [admin] = await ethers.getSigners();

    const CRID = await ethers.getContractFactory("CRID");
    const crid = await CRID.connect(admin).deploy(accessControlAddress);
    await crid.waitForDeployment();
    return crid;
  },

  async deployMockCourseManager() {
    const [admin] = await ethers.getSigners();

    const MockCourseManager = await ethers.getContractFactory("MockCourseManager");
    const courseManager = await MockCourseManager.connect(admin).deploy();
    await courseManager.waitForDeployment();
    return courseManager;
  },

  async deployMockStudentRegistry() {
    const [admin] = await ethers.getSigners();
    const MockStudentRegistry = await ethers.getContractFactory("MockStudentRegistry");
    const studentRegistry = await MockStudentRegistry.connect(admin).deploy();
    await studentRegistry.waitForDeployment();
    return studentRegistry;
  },

  async deployMockEnrollmentRequest() {
    const [admin] = await ethers.getSigners();
    const MockEnrollmentRequest = await ethers.getContractFactory("MockEnrollmentRequest");
    const enrollmentRequest = await MockEnrollmentRequest.connect(admin).deploy();
    await enrollmentRequest.waitForDeployment();
    return enrollmentRequest;
  },

  async deployMockAccessControl() {
    const [admin] = await ethers.getSigners();
    const MockAccessControl = await ethers.getContractFactory("MockCRIDAccessControl");
    const accessControl = await MockAccessControl.connect(admin).deploy();
    await accessControl.waitForDeployment();
    return accessControl;
  },

  async setupCRID() {
    const accessControl = await this.deployMockAccessControl();
    const crid = await this.deployCRID(accessControl.target);
    
    // Deploy contracts with correct CRID address
    const studentRegistry = await this.deployMockStudentRegistry();
    const courseManager = await this.deployMockCourseManager();
    const enrollmentRequest = await this.deployMockEnrollmentRequest();

    const [admin, coordinator1, coordinator2, student1, student2, student3, guest] =
      await ethers.getSigners();

    // Set up roles
    await accessControl.connect(admin).addCoordinator(coordinator1.address);
    await accessControl.connect(admin).addCoordinator(coordinator2.address);
    await accessControl.connect(admin).addStudent(student1.address);
    await accessControl.connect(admin).addStudent(student2.address);
    await accessControl.connect(admin).addStudent(student3.address);

    // Initialize the CRID system
    await crid.connect(admin).initializeSystem(
      studentRegistry.target,
      courseManager.target,
      enrollmentRequest.target
    );

    return {
      crid,
      accessControl,
      studentRegistry,
      courseManager,
      enrollmentRequest,
      accounts: {
        admin,
        coordinator1,
        coordinator2,
        student1,
        student2,
        student3,
        guest,
      },
    };
  },

  async validCourseData() {
    return {
      course1: {
        id: 1,
        name: "Introduction to Programming",
        description: "Basic programming concepts and practices",
        credits: 4,
        maxStudents: 30,
      },
      course2: {
        id: 2,
        name: "Data Structures",
        description: "Fundamental data structures and algorithms",
        credits: 3,
        maxStudents: 25,
      },
      course3: {
        id: 3,
        name: "Advanced Programming",
        description: "Advanced programming techniques and patterns",
        credits: 5,
        maxStudents: 20,
      },
    };
  },

  // ==============================
  // Enrollment Request Helpers
  // ==============================
  async deployEnrollmentRequest() {
    const [admin] = await ethers.getSigners();

    const EnrollmentRequest = await ethers.getContractFactory("EnrollmentRequest");
    const enrollmentRequest = await EnrollmentRequest.connect(admin).deploy(admin.address);
    await enrollmentRequest.waitForDeployment();
    return enrollmentRequest;
  },

  async deployEnrollmentRequestWithCRID() {
    const [admin] = await ethers.getSigners();

    const EnrollmentRequest = await ethers.getContractFactory("EnrollmentRequest");
    const enrollmentRequest = await EnrollmentRequest.connect(admin).deploy(cridAddress);
    await enrollmentRequest.waitForDeployment();
    return enrollmentRequest;
  },
  async setupEnrollmentRequest() {
    const enrollmentRequest = await this.deployEnrollmentRequest();
    const [admin, agent] = await ethers.getSigners();
    return {
      enrollmentRequest,
      accounts: {
        admin,
        agent,
      },
    };
  },
  async validEnrollmentRequestData() {
    const [admin, agent1, agent2, agent3] = await ethers.getSigners();
    return {
      pending: {
        id: 1,
        courseId: 1,
        studentAddress: agent1.address,
      },
      approved: {
        id: 2,
        courseId: 1,
        studentAddress: agent2.address,
      },
      rejected: {
        id: 3,
        courseId: 1,
        studentAddress: agent3.address,
      },
      canceled: {
        id: 4,
        courseId: 2,
        studentAddress: agent1.address,
      },
      otherCourse: {
        id: 5,
        courseId: 2,
        studentAddress: agent2.address,
      },
    };
  },
  // ==============================
  // Course Manager Helpers
  // ==============================
  async deployCourseManager() {
    const [admin] = await ethers.getSigners();

    const CourseManager = await ethers.getContractFactory("CourseManager");
    const courseManager = await CourseManager.connect(admin).deploy(admin.address);
    await courseManager.waitForDeployment();
    return courseManager;
  },

  async setupCourseManager() {
    const courseManager = await this.deployCourseManager();
    const [admin, other] = await ethers.getSigners();

    return {
      courseManager,
      accounts: {
        admin,
        other,
      },
    };
  },

  // ==============================
  // General Constants
  // ==============================
  ADDRESS_ZERO: ethers.ZeroAddress,
};

module.exports = { testHelpers };
