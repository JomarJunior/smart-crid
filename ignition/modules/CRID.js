const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("CRIDModule", (m) => {
  const accessControl = m.contract("CRIDAccessControl", []);
  const crid = m.contract("CRID", [accessControl]);

  const studentRegistry = m.contract("StudentRegistry", [crid]);
  const courseManager = m.contract("CourseManager", [crid]);
  const gradeManager = m.contract("GradeManager", [crid]);
  const enrollmentRequest = m.contract("EnrollmentRequest", [crid]);

  m.call(accessControl, "initialize", [crid]);
  m.call(crid, "initializeSystem", [
    studentRegistry,
    courseManager,
    enrollmentRequest,
    gradeManager,
  ]);

  return {
    accessControl,
    crid,
    studentRegistry,
    courseManager,
    gradeManager,
    enrollmentRequest,
  };
});
