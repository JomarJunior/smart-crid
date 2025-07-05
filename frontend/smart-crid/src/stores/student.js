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
            const signer = await blockchain.signers[0];
            this.contract = markRaw(new ethers.Contract(contractAddress, CRID.abi, signer));
        },
        async fetchStudents() {
            // Fetch the list of students from the blockchain
            if (!this.contract) {
                throw new Error('Contract is not connected. Please call connect() first.');
            }

            const studentCount = await this.contract.getStudentCount();
            this.students = [];
            for (let i = 0; i < studentCount; i++) {
                const student = await this.contract.getStudent(i);
                console.log(`Fetched student ${i}:`, student);
                this.students.push({ ...student });
            }
        },

        async addStudent(studentData) {
            // Add a new student to the blockchain
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
    },
})