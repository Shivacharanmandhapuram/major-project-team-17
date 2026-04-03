const fs = require('fs');
const path = require('path');
const solc = require('solc');
const { ethers } = require('ethers');
require('dotenv').config();

async function main() {
    console.log('--- Compiling Smart Contract ---');
    const contractPath = path.resolve(__dirname, '..', 'contracts', 'EMRHashRegistry.sol');
    const source = fs.readFileSync(contractPath, 'utf8');

    const input = {
        language: 'Solidity',
        sources: {
            'EMRHashRegistry.sol': {
                content: source,
            },
        },
        settings: {
            evmVersion: 'paris',
            outputSelection: {
                '*': {
                    '*': ['*'],
                },
            },
        },
    };

    const output = JSON.parse(solc.compile(JSON.stringify(input)));

    if (output.errors) {
        output.errors.forEach(err => {
            console.error(err.formattedMessage);
        });
        if (output.errors.some(e => e.severity === 'error')) {
            console.error('Compilation failed. Exiting.');
            process.exit(1);
        }
    }

    const contract = output.contracts['EMRHashRegistry.sol']['EMRHashRegistry'];
    const abi = contract.abi;
    const bytecode = contract.evm.bytecode.object;

    console.log('✅ Compilation successful!');
    console.log('--- Deploying to Ganache ---');

    const provider = new ethers.JsonRpcProvider(process.env.GANACHE_RPC_URL);
    const wallet = new ethers.Wallet(process.env.GANACHE_PRIVATE_KEY, provider);

    console.log(`Deploying from account: ${wallet.address}`);

    const factory = new ethers.ContractFactory(abi, bytecode, wallet);
    
    try {
        const deployedContract = await factory.deploy();
        await deployedContract.waitForDeployment();
        const address = await deployedContract.getAddress();
        
        console.log(`✅ Deployment successful!`);
        console.log(`📝 CONTRACT_ADDRESS=${address}`);
        
        // Save the ABI for the backend to use later
        fs.writeFileSync(
            path.resolve(__dirname, 'EMRHashRegistry.json'),
            JSON.stringify(abi, null, 2)
        );
        console.log(`Saved ABI to backend/EMRHashRegistry.json`);

    } catch (e) {
        console.error('Deployment failed:', e);
    }
}

main();
