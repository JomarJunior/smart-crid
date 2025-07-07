// Store for managing blockchain-related state in the Vue.js application
import { defineStore } from "pinia";
import { markRaw } from "vue";
import { ethers } from "ethers";

export const useBlockchainStore = defineStore("blockchain", {
  state: () => ({
    provider: null, // Allows read-only access to the blockchain ex: provider.getBalance(), provider.getBlockNumber()
    signers: null, // Users' accounts that can sign transactions and messages
    accounts: null, // The users' account addresses that generated the signers above
    network: null, // Information about the connected network (hardhat)
  }),

  actions: {
    async connect() {
      try {
        if (this.accounts && this.accounts.length > 0) {
          return;
        }

        // Uses the endpoint from the hardhat container
        const rpcUrl = import.meta.env.VITE_RPC_URL || "http://localhost:8545";
        // Create a new provider
        this.provider = markRaw(new ethers.JsonRpcProvider(rpcUrl));

        this.accounts = await this.provider.send("eth_accounts");
        if (this.accounts.length === 0) {
          throw new Error(
            "No accounts found. Please ensure your Hardhat node is running and has accounts available.",
          );
        }

        // Create signers for each account
        this.signers = this.accounts.reduce((acc, account) => {
          acc[account] = markRaw(this.provider.getSigner(account));
          return acc;
        }, {});

        // Get network information
        this.network = markRaw(await this.provider.getNetwork());

        // Connection successful
        this.isConnected = true;
      } catch {
        // Connection failed
        this.isConnected = false;
      }
    },
  },

  getters: {
    isConnected: (state) => !!state.accounts && state.accounts.length > 0,
    getAccounts: (state) => {
      if (!state.accounts || state.accounts.length === 0) {
        throw new Error("No accounts available. Please connect to the blockchain first.");
      }
      return state.accounts;
    },
    getAdminAccount: (state) => {
      if (!state.accounts || state.accounts.length === 0) {
        throw new Error("No accounts available. Please connect to the blockchain first.");
      }
      // Assuming the first account is the admin
      return state.accounts[0];
    },
    getCoordinatorsAccounts: (state) => {
      if (!state.accounts || state.accounts.length === 0) {
        throw new Error("No accounts available. Please connect to the blockchain first.");
      }
      // Assuming the first three accounts are coordinators
      return state.accounts.slice(1, 4);
    },
    getStudentsAccounts: (state) => {
      if (!state.accounts || state.accounts.length === 0) {
        throw new Error("No accounts available. Please connect to the blockchain first.");
      }
      // Assuming the remaining accounts are students
      return state.accounts.slice(4);
    },
  },
});
