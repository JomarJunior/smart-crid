#!/usr/bin/env node

/**
 * CRID Project Structure Setup Script
 * 
 * This script creates the complete directory structure for the CRID smart contract project
 * based on the bounded contexts defined in the Technical Design Document.
 * 
 * Usage: node scripts/setup-project-structure.js
 */

const fs = require('fs');
const path = require('path');

// Project root directory
const PROJECT_ROOT = path.resolve(__dirname, '..');

// Directory structure based on bounded contexts from TDD
const DIRECTORY_STRUCTURE = [
  // Smart Contracts - Blockchain Context organized by bounded contexts
  'contracts/student',
  'contracts/coordination', 
  'contracts/security',
  'contracts/core',
  'contracts/interfaces',
  'contracts/libraries',

  // Test Suite - Organized by bounded contexts
  'test/student',
  'test/coordination',
  'test/security',
  'test/integration',
  'test/fixtures',

  // Frontend - Interface Context with bounded context separation
  'frontend/src/contexts/student/components',
  'frontend/src/contexts/student/pages',
  'frontend/src/contexts/student/services',
  'frontend/src/contexts/coordination/components',
  'frontend/src/contexts/coordination/pages',
  'frontend/src/contexts/coordination/services',
  'frontend/src/contexts/security/components',
  'frontend/src/contexts/security/guards',
  'frontend/src/contexts/security/services',
  'frontend/src/contexts/shared/components',
  'frontend/src/contexts/shared/hooks',
  'frontend/src/contexts/shared/utils',
  'frontend/src/blockchain',
  'frontend/public',

  // Scripts - Deployment and utilities
  'scripts/deployment',
  'scripts/utilities',

  // Documentation - Context-specific docs
  'docs/contexts',
  'docs/diagrams',

  // GitHub Actions workflows
  '.github/workflows'
];

// Files that need .gitkeep to ensure empty directories are tracked
const GITKEEP_DIRECTORIES = [
  'contracts/student',
  'contracts/coordination',
  'contracts/security',
  'contracts/core',
  'contracts/interfaces',
  'contracts/libraries',
  'test/student',
  'test/coordination', 
  'test/security',
  'test/integration',
  'test/fixtures',
  'frontend/src/contexts/student/components',
  'frontend/src/contexts/student/pages',
  'frontend/src/contexts/student/services',
  'frontend/src/contexts/coordination/components',
  'frontend/src/contexts/coordination/pages',
  'frontend/src/contexts/coordination/services',
  'frontend/src/contexts/security/components',
  'frontend/src/contexts/security/guards',
  'frontend/src/contexts/security/services',
  'frontend/src/contexts/shared/components',
  'frontend/src/contexts/shared/hooks',
  'frontend/src/contexts/shared/utils',
  'frontend/src/blockchain',
  'frontend/public',
  'scripts/deployment',
  'scripts/utilities',
  'docs/contexts',
  'docs/diagrams',
  '.github/workflows'
];

/**
 * Creates a directory if it doesn't exist
 * @param {string} dirPath - The directory path to create
 */
function createDirectory(dirPath) {
  const fullPath = path.join(PROJECT_ROOT, dirPath);
  
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
    console.log(`✅ Created directory: ${dirPath}`);
  } else {
    console.log(`ℹ️  Directory already exists: ${dirPath}`);
  }
}

/**
 * Creates a .gitkeep file in the specified directory
 * @param {string} dirPath - The directory path where .gitkeep should be created
 */
function createGitkeep(dirPath) {
  const fullPath = path.join(PROJECT_ROOT, dirPath, '.gitkeep');
  
  if (!fs.existsSync(fullPath)) {
    fs.writeFileSync(fullPath, '# This file ensures the directory is tracked by Git\n');
    console.log(`📝 Created .gitkeep in: ${dirPath}`);
  } else {
    console.log(`ℹ️  .gitkeep already exists in: ${dirPath}`);
  }
}

/**
 * Main function to set up the project structure
 */
function setupProjectStructure() {
  console.log('🚀 Setting up CRID project structure based on bounded contexts...\n');
  
  try {
    // Create all directories
    console.log('📁 Creating directories...');
    DIRECTORY_STRUCTURE.forEach(createDirectory);
    
    console.log('\n📝 Creating .gitkeep files for empty directories...');
    // Create .gitkeep files for directories that need them
    GITKEEP_DIRECTORIES.forEach(createGitkeep);
    
    console.log('\n🎉 Project structure setup completed successfully!');
    console.log('\n📋 Summary of created structure:');
    console.log('├── contracts/ (Smart contracts organized by bounded contexts)');
    console.log('│   ├── student/ (Student Context)');
    console.log('│   ├── coordination/ (Coordination Context)');
    console.log('│   ├── security/ (Security Context)');
    console.log('│   ├── core/ (Core blockchain functionality)');
    console.log('│   ├── interfaces/ (Contract interfaces)');
    console.log('│   └── libraries/ (Shared libraries)');
    console.log('├── test/ (Test suite organized by contexts)');
    console.log('├── frontend/ (Interface Context with bounded context separation)');
    console.log('├── scripts/ (Deployment and utility scripts)');
    console.log('├── docs/ (Documentation with context-specific docs)');
    console.log('└── .github/ (GitHub Actions workflows)');
    
    console.log('\n🔧 Next steps:');
    console.log('1. Initialize npm: npm init -y');
    console.log('2. Install Hardhat: npm install --save-dev hardhat');
    console.log('3. Initialize Hardhat: npx hardhat');
    console.log('4. Install OpenZeppelin contracts: npm install @openzeppelin/contracts');
    console.log('5. Set up your development environment');
    
  } catch (error) {
    console.error('❌ Error setting up project structure:', error.message);
    process.exit(1);
  }
}

// Run the setup if this script is executed directly
if (require.main === module) {
  setupProjectStructure();
}

module.exports = { setupProjectStructure };
