const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("CRIDAccessControlModule", (module) => {
  // Deploy the main access control contract
  const accessControl = module.contract("CRIDAccessControl", []);

  // Optional: Add initial coordinators and students if specified
  // const initialCoordinators = module.getParameter("initialCoordinators", []);
  // const initialStudents = module.getParameter("initialStudents", []);

  // You can add post-deployment setup here if needed
  // Note: Ignition doesn't directly support function calls after deployment
  // but you can use afterDeploy hooks to separate scripts

  return {
    accessControl,
    // Export for use in other modules
    accessControlAddress: accessControl,
  };
});
