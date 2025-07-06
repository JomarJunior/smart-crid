import { keccak256, toUtf8Bytes } from "ethers";

// Get error selector from command line arguments
const errorSelector = process.argv[2];

if (!errorSelector) {
  console.error(
    "❌ Please provide an error selector as a command-line argument."
  );
  process.exit(1);
}

console.log(`🔍 Searching for error with selector: ${errorSelector}`);

// Lista de possíveis assinaturas de erros
const errorSignatures = [
  "UnauthorizedCaller()",
  "InvalidInput(string)",
  "CourseNotFound(uint256)",
  "CourseAlreadyExists(uint256)",
  "CourseAlreadyActive(uint256)",
  "CourseInactive(uint256)",
  "UnauthorizedAccess()",
  "InvalidGrade()",
  "StudentNotFound()",
  "GradeNotFound()",
  "SystemNotInitialized()",
  "InvalidContract()",
  "SystemAlreadyInitialized()",
  "NotAdmin()",
  "NotCoordinator()",
  "NotStudent()",
  "InvalidUser()",
  "SystemPaused()",
  "ReentrantCall()",
  "InvalidAddress()",
  "InvalidAccessControlAddress()",
  "OnlyCRIDContract()",
  "RequestDoesNotExist()",
  "RequestNotPending()",
  "AlreadyRequested()",
  "CourseNotActive()",
  "StudentNotActive()",
  "StudentNotRegistered()",
  "Unauthorized()",
  "NotRequestOwner()",
  "InsufficientPermissions()",
  "InvalidUserRole()",
  "AlreadyInitialized()",
  "DuplicateStudentId()",
  "AlreadyRegistered()",
  "NotRegistered()",
  "NotActive()",
  "AlreadyActive()",
];

// Função que compara os selectors
function findMatchingErrorSelector(errorSelector, signatures) {
  for (const sig of signatures) {
    const selector = keccak256(toUtf8Bytes(sig)).slice(0, 10); // 4-byte selector
    if (selector === errorSelector) {
      return sig;
    }
  }
  return null;
}

const matched = findMatchingErrorSelector(errorSelector, errorSignatures);

if (matched) {
  console.log(`✅ Found matching error: ${matched}`);
} else {
  console.log("❌ No matching error found.");
}
