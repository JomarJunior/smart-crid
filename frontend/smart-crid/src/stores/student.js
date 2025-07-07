// Store for dealing with student-related contracts
import { defineStore } from 'pinia';
import { ethers } from 'ethers';
import { useBlockchainStore } from '@/stores/blockchain'; // Import the blockchain store
import { markRaw } from 'vue'; // Import markRaw to prevent reactivity issues with ethers.js objects
import CRID from '@/artifacts/CRID.json'; // Import the CRID contract ABI
import deployments from '@/artifacts/deployed_addresses.json'; // Import the deployed address for the CRID contract

export const useStudentStore = defineStore('student', {
    state: () => ({
        contract: null, // The CRID contract instance
        students: [],
        studentsByAddress: {}, // Map of student addresses to their IDs
        selectedStudent: null,
    }),

    actions: {
        async connect() {
            // Connect to the blockchain
            const blockchain = useBlockchainStore();
            await blockchain.connect();
            if (!blockchain.isConnected) {
                throw new Error('Blockchain connection failed. Please check your configuration.');
            }

            const contractAddress = deployments['CRIDModule#CRID'] || process.env.VUE_APP_CRID_CONTRACT_ADDRESS;
            if (!contractAddress) {
                throw new Error('CRID contract address is not set. Please check your environment variables.');
            }

            // Create a new contract instance
            const signer = await blockchain.signers[blockchain.accounts[0]];
            if (!signer) {
                throw new Error('Signer not found. Please ensure you are connected to the blockchain.');
            }
            this.contract = markRaw(new ethers.Contract(contractAddress, CRID.abi, signer));
        },
        async fetchStudents() {
            // Fetch the list of students from the blockchain
            if (!this.contract) {
                throw new Error('Contract is not connected. Please call connect() first.');
            }
            try {
                const students = await this.contract.listAllStudents();
                console.log('Fetched students:', students);
                this.students = students.map(student => ({
                    id: student.id,
                    fullName: student.fullName,
                    email: student.email,
                    program: student.program,
                    enrollmentYear: student.enrollmentYear,
                    isActive: student.isActive,
                }));
            } catch (error) {
                throw new Error('Failed to fetch students from the blockchain.');
            }
        },

        async addStudent(studentData) {
            // Add a new student to the blockchain
            // For this method, we need to stabilsh another connection to the blockchain
            // We should use the address provided by the user in the form
            try {
                // Validate studentData
                if (!studentData.id || !studentData.fullName || !studentData.email || !studentData.program || !studentData.enrollmentYear) {
                    throw new Error('Invalid student data. Please ensure all fields are filled out correctly.');
                }

                const contractAddress = deployments['CRIDModule#CRID'] || process.env.VUE_APP_CRID_CONTRACT_ADDRESS;
                if (!contractAddress) {
                    throw new Error('CRID contract address is not set. Please check your environment variables.');
                }

                // Create a new contract instance with the current signer
                const blockchain = useBlockchainStore();
                const signer = await blockchain.signers[studentData.address];
                if (!signer) {
                    throw new Error('Signer not found for the provided address. Please ensure the address is correct.');
                }

                const newContract = markRaw(new ethers.Contract(contractAddress, CRID.abi, signer));

                console.log('Adding student with data:', studentData);
                const tx = await newContract.registerStudent(
                    studentData.id,
                    studentData.fullName,
                    studentData.email,
                    studentData.program,
                    studentData.enrollmentYear
                );
                await tx.wait(); // Wait for the transaction to be mined
                console.log('Student added:', studentData);
                this.fetchStudents(); // Refresh the list of students
                this.fetchStudentByAddress(studentData.address); // Fetch the student by address to update the mapping
            } catch (error) {
                throw error; // Propagate the error to be handled by the caller
            }
        },

        async fetchStudentByAddress(address) {
            // Fetch a student by their address
            try {
                const provider = useBlockchainStore().provider;
                if (!provider) {
                    throw new Error('Blockchain provider is not connected. Please check your connection.');
                }

                const contractAddress = deployments['CRIDModule#CRID'] || process.env.VUE_APP_CRID_CONTRACT_ADDRESS;
                if (!contractAddress) {
                    throw new Error('CRID contract address is not set. Please check your environment variables.');
                }

                // Create a new contract instance with the current provider
                const contract = markRaw(new ethers.Contract(contractAddress, CRID.abi, provider));
                try {
                    const student = await contract.getStudentByAddress(address);
                    this.studentsByAddress[address] = student.id;
                } catch (error) {
                    this.studentsByAddress[address] = undefined; // If the student is not found, set to undefined
                }
            } catch (error) {
                throw error;
            }
        },

        async updateStudent(studentId, studentData) {
            // Update an existing student on the blockchain
        },
    },

    getters: {
        getStudentById: (state) => (id) => {
            return state.students.find(student => student.id === id);
        },
        studentsLoaded: (state) => {
            return state.students.length > 0;
        },
        isConnected: (state) => {
            return !!state.contract;
        },
        isRegistered: (state) => (address) => {
            // Check if the student is registered by their address
            return state.studentsByAddress[address] !== undefined;
        },
        getFullNameByAddress: (state) => (address) => {
            // Get the full name of the student based on their address
            const studentId = state.studentsByAddress[address];
            console.log(studentId);
            if (studentId !== undefined) {
                const student = state.getStudentById(studentId);
                return student ? student.fullName : '';
            }
            return '';
        }
    },
})