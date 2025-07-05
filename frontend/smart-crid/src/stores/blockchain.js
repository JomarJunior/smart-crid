// Store for managing blockchain-related state in the Vue.js application
import { defineStore } from 'pinia';
import { markRaw } from 'vue';
import { ethers } from 'ethers';

export const useBlockchainStore = defineStore('blockchain', {
    state: () => ({
        provider: null,             // Allows read-only access to the blockchain ex: provider.getBalance(), provider.getBlockNumber()
        signers: null,               // Users' accounts that can sign transactions and messages
        accounts: null,              // The users' account addresses that generated the signers above
        network: null,              // Information about the connected network (hardhat)
    }),

    actions: {
        async connect() {
            try {
                if (this.provider) {
                    return;
                }

                // Uses the endpoint from the hardhat container
                const rpcUrl = import.meta.env.VITE_RPC_URL || 'http://localhost:8545';
                // Create a new provider
                this.provider = markRaw(new ethers.JsonRpcProvider(rpcUrl));

                this.accounts = await this.provider.send('eth_accounts');
                if (this.accounts.length === 0) {
                    throw new Error('No accounts found. Please ensure your Hardhat node is running and has accounts available.');
                }

                // Create signers for each account
                this.signers = this.accounts.map(account => this.provider.getSigner(account));

                // Get network information
                this.network = markRaw(await this.provider.getNetwork());
                console.log('Connected to blockchain:', {
                    rpcUrl,
                    accounts: this.accounts,
                    network: this.network,
                });
            } catch (error) {
                console.error('Error connecting to blockchain:', error);
            }
        }
    },

    getters: {
        isConnected: (state) => !!state.accounts && state.accounts.length > 0,
    },
})