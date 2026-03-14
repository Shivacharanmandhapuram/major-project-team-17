// =============================================
// Blockchain Client Configuration
// =============================================
// Connects to Ganache local blockchain using ethers.js
// Provides helper functions to interact with the
// EMRHashRegistry smart contract.
// =============================================

const { ethers } = require('ethers');

// ABI for the EMRHashRegistry smart contract
// This gets updated after we deploy the contract in Phase 10
const CONTRACT_ABI = [
    "function storeHash(string memory recordId, string memory hash) public",
    "function getHash(string memory recordId) public view returns (string memory)",
    "event HashStored(string recordId, string hash, uint256 timestamp)"
];

function getBlockchainProvider() {
    const rpcUrl = process.env.GANACHE_RPC_URL || 'http://127.0.0.1:7545';
    return new ethers.JsonRpcProvider(rpcUrl);
}

function getWallet() {
    const provider = getBlockchainProvider();
    const privateKey = process.env.GANACHE_PRIVATE_KEY;

    if (!privateKey || privateKey.includes('your_')) {
        throw new Error('Ganache private key not configured. Set GANACHE_PRIVATE_KEY in .env');
    }

    return new ethers.Wallet(privateKey, provider);
}

function getContract() {
    const contractAddress = process.env.CONTRACT_ADDRESS;

    if (!contractAddress || contractAddress.includes('your_')) {
        throw new Error('Contract address not configured. Deploy the smart contract and set CONTRACT_ADDRESS in .env');
    }

    const wallet = getWallet();
    return new ethers.Contract(contractAddress, CONTRACT_ABI, wallet);
}

module.exports = {
    getBlockchainProvider,
    getWallet,
    getContract,
    CONTRACT_ABI,
};
