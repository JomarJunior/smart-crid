// Store for dealing with coordinator-related contracts
import { defineStore } from "pinia";
import { ethers } from "ethers";
import { useBlockchainStore } from "@/stores/blockchain"; // Import the blockchain store
import { markRaw } from "vue"; // Import markRaw to prevent reactivity issues with ethers.js objects
import CRID from "@/artifacts/CRID.json"; // Import the CRID contract ABI
import deployments from "@/artifacts/deployed_addresses.json"; // Import the deployed address for the CR
import { useSmartCridStore } from "./smart-crid";

export const useCoordinatorStore = defineStore("coordinator", {
  state: () => ({
    contract: null, // The CRID contract instance
    courses: [],
    selectedCourse: null,
    enrollments: [],
    selectedEnrollment: null,
    grades: {},
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
      const signer = await blockchain.signers[blockchain.accounts[0]];
      if (!signer) {
        throw new Error("Signer not found. Please ensure you are connected to the blockchain.");
      }
      this.contract = markRaw(new ethers.Contract(contractAddress, CRID.abi, signer));
    },
    async fetchCourses() {
      // Fetch the list of courses from the blockchain
      if (!this.contract) {
        throw new Error("Contract is not connected. Please call connect() first.");
      }
      try {
        const courses = await this.contract.listAllCourses();
        console.log("Fetched courses:", courses);
        this.courses = courses.map((course) => ({
          id: course.id,
          name: course.name,
          description: course.description,
          credits: course.credits,
          maxStudents: course.maxStudents,
        }));
      } catch (error) {
        throw new Error(error);
      }
    },
    async fetchEnrollments() {
      // Fetch the list of enrollments from the blockchain
      if (!this.contract) {
        throw new Error("Contract is not connected. Please call connect() first.");
      }
      try {
        const enrollments = await this.contract.listAllEnrollmentRequests();
        console.log("Fetched enrollments:", enrollments);
        this.enrollments = enrollments.map((enrollment) => ({
          id: enrollment.id,
          student: enrollment.student,
          requestDate: enrollment.requestDate,
          courseId: enrollment.courseId,
          status: enrollment.status,
        }));
      } catch (error) {
        throw new Error(error);
      }
    },
    async fetchGradesByCourseId(courseId) {
      // Fetch grades for a specific course by course ID
      if (!this.contract) {
        throw new Error("Contract is not connected. Please call connect() first.");
      }
      try {
        const grades = await this.contract.getGradesByCourse(courseId);
        console.log("Fetched grades:", grades);

        if (this.grades[courseId] === undefined) {
          this.grades[courseId] = {};
        }

        for (let i = 0; i < grades[0].length; i++) {
          const studentAddress = grades[0][i];
          const grade = grades[1][i];
          this.grades[courseId][studentAddress] = {
            student: studentAddress,
            grade: Number(grade),
          };
        }
      } catch (error) {
        throw new Error(error);
      }
    },
    async addCourse(courseData) {
      // Add a new course to the blockchain
      if (!this.contract) {
        throw new Error("Contract is not connected. Please call connect() first.");
      }
      try {
        // Validate courseData
        if (
          !courseData.name ||
          !courseData.description ||
          !courseData.credits ||
          !courseData.maxStudents
        ) {
          throw new Error("Invalid course data. Please ensure all fields are filled out correctly.");
        }

        const tx = await this.contract.addCourse(
          this.courses.length + 1, // Generate a new course ID based on the current length. (ewww very ugly indeed)
          courseData.name,
          courseData.description,
          courseData.credits,
          courseData.maxStudents,
        );
        await tx.wait();
        console.log("Course added successfully:", tx);
        await this.fetchCourses(); // Refresh the list of courses
      } catch (error) {
        throw new Error("Failed to add course to the blockchain.");
      }
    },
    async requestEnrollment(enrollmentData) {
      // Request enrollment in a course
      try {
        console.log("Requesting enrollment with data:", enrollmentData);
        if (!enrollmentData.courseId) {
          throw new Error(
            "Invalid enrollment data. Please ensure all fields are filled out correctly.",
          );
        }

        const blockchain = useBlockchainStore();
        const smartCridStore = useSmartCridStore();
        const signer = await blockchain.signers[smartCridStore.loggedAccount];
        if (!signer) {
          throw new Error(
            "Signer not found for the provided address. Please ensure the address is correct.",
          );
        }

        const contractAddress =
          deployments["CRIDModule#CRID"] || process.env.VUE_APP_CRID_CONTRACT_ADDRESS;
        if (!contractAddress) {
          throw new Error(
            "CRID contract address is not set. Please check your environment variables.",
          );
        }

        // Create a new contract instance with the current signer
        const newContract = markRaw(new ethers.Contract(contractAddress, CRID.abi, signer));
        console.log("Requesting enrollment with data:", enrollmentData);
        const tx = await newContract.requestEnrollment(enrollmentData.courseId);
        await tx.wait(); // Wait for the transaction to be mined
        console.log("Enrollment requested successfully:", tx);
        await this.fetchEnrollments(); // Refresh the list of enrollments
      } catch (error) {
        throw new Error(error);
      }
    },
    async cancelEnrollment(enrollmentData) {
      try {
        if (!enrollmentData.id) {
          throw new Error(
            "Invalid enrollment data. Please ensure all fields are filled out correctly.",
          );
        }

        const blockchain = useBlockchainStore();
        const smartCridStore = useSmartCridStore();
        const signer = await blockchain.signers[smartCridStore.loggedAccount];
        if (!signer) {
          throw new Error(
            "Signer not found for the provided address. Please ensure the address is correct.",
          );
        }

        const contractAddress =
          deployments["CRIDModule#CRID"] || process.env.VUE_APP_CRID_CONTRACT_ADDRESS;
        if (!contractAddress) {
          throw new Error(
            "CRID contract address is not set. Please check your environment variables.",
          );
        }

        // Create a new contract instance with the current signer
        const newContract = markRaw(new ethers.Contract(contractAddress, CRID.abi, signer));
        console.log("Cancelling enrollment with data:", enrollmentData);
        const tx = await newContract.cancelEnrollmentRequest(enrollmentData.id);
        await tx.wait(); // Wait for the transaction to be mined
        console.log("Enrollment cancelled successfully:", tx);
        await this.fetchEnrollments(); // Refresh the list of enrollments
      } catch (error) {
        throw error;
      }
    },
    async approveEnrollment(enrollmentData) {
      try {
        if (!enrollmentData.id) {
          throw new Error(
            "Invalid enrollment data. Please ensure all fields are filled out correctly.",
          );
        }

        const blockchain = useBlockchainStore();
        const smartCridStore = useSmartCridStore();
        const signer = await blockchain.signers[smartCridStore.loggedAccount];
        if (!signer) {
          throw new Error(
            "Signer not found for the provided address. Please ensure the address is correct.",
          );
        }

        const contractAddress =
          deployments["CRIDModule#CRID"] || process.env.VUE_APP_CRID_CONTRACT_ADDRESS;
        if (!contractAddress) {
          throw new Error(
            "CRID contract address is not set. Please check your environment variables.",
          );
        }

        // Create a new contract instance with the current signer
        const newContract = markRaw(new ethers.Contract(contractAddress, CRID.abi, signer));
        console.log("Approving enrollment with data:", enrollmentData);
        const tx = await newContract.approveEnrollmentRequest(enrollmentData.id);
        await tx.wait(); // Wait for the transaction to be mined
        console.log("Enrollment approved successfully:", tx);
        await this.fetchEnrollments(); // Refresh the list of enrollments
      } catch (error) {
        throw error;
      }
    },
    async rejectEnrollment(enrollmentData) {
      try {
        if (!enrollmentData.id) {
          throw new Error(
            "Invalid enrollment data. Please ensure all fields are filled out correctly.",
          );
        }

        const blockchain = useBlockchainStore();
        const smartCridStore = useSmartCridStore();
        const signer = await blockchain.signers[smartCridStore.loggedAccount];
        if (!signer) {
          throw new Error(
            "Signer not found for the provided address. Please ensure the address is correct.",
          );
        }

        const contractAddress =
          deployments["CRIDModule#CRID"] || process.env.VUE_APP_CRID_CONTRACT_ADDRESS;
        if (!contractAddress) {
          throw new Error(
            "CRID contract address is not set. Please check your environment variables.",
          );
        }

        // Create a new contract instance with the current signer
        const newContract = markRaw(new ethers.Contract(contractAddress, CRID.abi, signer));
        console.log("Rejecting enrollment with data:", enrollmentData);
        const tx = await newContract.rejectEnrollmentRequest(enrollmentData.id);
        await tx.wait(); // Wait for the transaction to be mined
        console.log("Enrollment rejected successfully:", tx);
        await this.fetchEnrollments(); // Refresh the list of enrollments
      } catch (error) {
        throw error;
      }
    },
    async addGrade(gradeData) {
      try {
        // Validate gradeData
        if (!gradeData.student || !gradeData.course || gradeData.grade === undefined) {
          throw new Error("Invalid grade data. Please ensure all fields are filled out correctly.");
        }

        const blockchain = useBlockchainStore();
        const smartCridStore = useSmartCridStore();
        const signer = await blockchain.signers[smartCridStore.loggedAccount];
        if (!signer) {
          throw new Error(
            "Signer not found for the provided address. Please ensure the address is correct.",
          );
        }

        const contractAddress =
          deployments["CRIDModule#CRID"] || process.env.VUE_APP_CRID_CONTRACT_ADDRESS;
        if (!contractAddress) {
          throw new Error(
            "CRID contract address is not set. Please check your environment variables.",
          );
        }

        // Create a new contract instance with the current signer
        const newContract = markRaw(new ethers.Contract(contractAddress, CRID.abi, signer));
        console.log("Adding grade with data:", gradeData);
        const tx = await newContract.addGrade(
          gradeData.studentAddress,
          gradeData.course,
          gradeData.grade,
        );
        await tx.wait(); // Wait for the transaction to be mined
        console.log("Grade added successfully:", tx);
        await this.fetchEnrollments(); // Refresh the list of enrollments
        await this.fetchGradesByCourseId(gradeData.course); // Refresh the grades for the course
      } catch (error) {
        throw error;
      }
    },
  },
  getters: {
    isConnected: (state) => {
      // Check if the contract is connected
      return state.contract !== null;
    },
    getCourseEnrollmentsByCourseId: (state) => (courseId) => {
      // Get enrollments for a specific course by course ID
      return state.enrollments.filter((enrollment) => enrollment.courseId === courseId);
    },
    getStudentGradeByCourseId: (state) => (studentAddress, courseId) => {
      // Get the grade of a student for a specific course by course ID
      if (state.grades[courseId] && state.grades[courseId][studentAddress]) {
        return state.grades[courseId][studentAddress].grade;
      }
      return null;
    },
  },
});
