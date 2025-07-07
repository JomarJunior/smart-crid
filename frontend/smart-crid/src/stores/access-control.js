// Store for dealing with access control-related contracts
import { defineStore } from "pinia";
import { ethers } from "ethers";
import { useBlockchainStore } from "@/stores/blockchain"; // Import the blockchain store
import { markRaw } from "vue"; // Import markRaw to prevent reactivity issues with ethers.js objects
import CRID from "@/artifacts/CRID.json"; // Import the CRID contract ABI
import deployments from "@/artifacts/deployed_addresses.json"; // Import the deployed address
import { keccak256, toUtf8Bytes } from "ethers";

function adminRole() {
  return keccak256(toUtf8Bytes("ADMIN_ROLE"));
}

function coordinatorRole() {
  return keccak256(toUtf8Bytes("COORDINATOR_ROLE"));
}

function studentRole() {
  return keccak256(toUtf8Bytes("STUDENT_ROLE"));
}

export const useAccessControlStore = defineStore("accessControl", {
  state: () => ({
    contract: null, // The CRID contract instance
    adminsAddresses: [], // List of admin addresses
    coordinatorsAddresses: [], // List of coordinator addresses
    studentsAddresses: [], // List of student addresses
  }),
  actions: {
    async connect() {
      // Connect to the blockchain
      const blockchain = useBlockchainStore();
      await blockchain.connect();
      if (!blockchain.isConnected) {
        throw new Error("Blockchain connection failed. Please check your configuration.");
      }

      const contractAddress =
        deployments["CRIDModule#CRID"] || process.env.VUE_APP_CRID_CONTRACT_ADDRESS;
      if (!contractAddress) {
        throw new Error(
          "CRID contract address is not set. Please check your environment variables.",
        );
      }

      // Create a new contract instance
      const signer = await blockchain.signers[0];
      this.contract = markRaw(new ethers.Contract(contractAddress, CRID.abi, signer));

      const provider = await blockchain.provider;
      const accounts = await blockchain.getAccounts;
      const readOnlyContract = new ethers.Contract(contractAddress, CRID.abi, provider);
      accounts.forEach(async (account) => {
        const isAdmin = await readOnlyContract.hasRole(adminRole(), account);
        const isCoordinator = await readOnlyContract.hasRole(coordinatorRole(), account);
        const isStudent = await readOnlyContract.hasRole(studentRole(), account);

        if (isAdmin) {
          this.adminsAddresses.push(account);
        }
        if (isCoordinator) {
          this.coordinatorsAddresses.push(account);
        }
        if (isStudent) {
          this.studentsAddresses.push(account);
        }
      });
    },
    async addCoordinator(coordinatorAddress) {
      // Add a new coordinator to the CRID contract
      if (!this.contract) {
        throw new Error("Contract is not connected. Please call connect() first.");
      }
      try {
        const blockchain = useBlockchainStore();

        if (!blockchain.isConnected) {
          throw new Error("Blockchain connection is not established. Please connect first.");
        }

        const provider = new ethers.JsonRpcProvider(blockchain.rpcUrl);
        if (!provider) {
          throw new Error("Provider is not available. Please check your blockchain connection.");
        }

        const signer = await provider.getSigner(blockchain.accounts[0]);
        if (!signer) {
          throw new Error(
            "Signer is not available. Please ensure you are connected to the blockchain.",
          );
        }

        const contractAddress =
          deployments["CRIDModule#CRID"] || process.env.VUE_APP_CRID_CONTRACT_ADDRESS;
        if (!contractAddress) {
          throw new Error(
            "CRID contract address is not set. Please check your environment variables.",
          );
        }

        // Create a new contract instance with the signer
        const contract = new ethers.Contract(contractAddress, CRID.abi, signer);

        const tx = await contract.addCoordinator(coordinatorAddress);
        await tx.wait();
        // Update the coordinatorsAddresses state
        if (!this.coordinatorsAddresses.includes(coordinatorAddress)) {
          this.coordinatorsAddresses.push(coordinatorAddress);
        }
      } catch (error) {
        throw new Error(`Failed to add coordinator: ${error.message}`);
      }
    },
    async removeCoordinator(coordinatorAddress) {
      // Remove a coordinator from the CRID contract
      if (!this.contract) {
        throw new Error("Contract is not connected. Please call connect() first.");
      }
      try {
        const tx = await this.contract.removeCoordinator(coordinatorAddress);
        await tx.wait();
        // Update the coordinatorsAddresses state
        const index = this.coordinatorsAddresses.indexOf(coordinatorAddress);
        if (index !== -1) {
          this.coordinatorsAddresses.splice(index, 1);
        }
      } catch (error) {
        throw new Error(`Failed to remove coordinator: ${error.message}`);
      }
    },
    async addStudent(studentAddress) {
      // Add a new student to the CRID contract
      if (!this.contract) {
        throw new Error("Contract is not connected. Please call connect() first.");
      }
      try {
        const blockchain = useBlockchainStore();

        if (!blockchain.isConnected) {
          throw new Error("Blockchain connection is not established. Please connect first.");
        }

        const provider = new ethers.JsonRpcProvider(blockchain.rpcUrl);
        if (!provider) {
          throw new Error("Provider is not available. Please check your blockchain connection.");
        }

        const signer = await provider.getSigner(blockchain.accounts[0]);
        if (!signer) {
          throw new Error(
            "Signer is not available. Please ensure you are connected to the blockchain.",
          );
        }

        const contractAddress =
          deployments["CRIDModule#CRID"] || process.env.VUE_APP_CRID_CONTRACT_ADDRESS;
        if (!contractAddress) {
          throw new Error(
            "CRID contract address is not set. Please check your environment variables.",
          );
        }

        // Create a new contract instance with the signer
        const contract = new ethers.Contract(contractAddress, CRID.abi, signer);

        const tx = await contract.addStudent(studentAddress);
        await tx.wait();
        // Update the studentsAddresses state
        if (!this.studentsAddresses.includes(studentAddress)) {
          this.studentsAddresses.push(studentAddress);
        }
      } catch (error) {
        throw new Error(`Failed to add student: ${error.message}`);
      }
    },
    async removeStudent(studentAddress) {
      // Remove a student from the CRID contract
      if (!this.contract) {
        throw new Error("Contract is not connected. Please call connect() first.");
      }
      try {
        const tx = await this.contract.removeStudent(studentAddress);
        await tx.wait();
        // Update the studentsAddresses state
        const index = this.studentsAddresses.indexOf(studentAddress);
        if (index !== -1) {
          this.studentsAddresses.splice(index, 1);
        }
      } catch (error) {
        throw new Error(`Failed to remove student: ${error.message}`);
      }
    },
  },
  getters: {
    isAdmin: (state) => (address) => {
      return state.adminsAddresses.includes(address);
    },
    isCoordinator: (state) => (address) => {
      return state.coordinatorsAddresses.includes(address);
    },
    isStudent: (state) => (address) => {
      return state.studentsAddresses.includes(address);
    },
    getAdmins: (state) => state.adminsAddresses,
    getCoordinators: (state) => state.coordinatorsAddresses,
    getStudents: (state) => state.studentsAddresses,
  },
});
