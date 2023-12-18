require("@nomiclabs/hardhat-waffle");
require('hardhat-conflux');
require('dotenv').config();

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html


// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
    solidity: {
        compilers: [
            {version: "0.5.11"}
        ]

    },

    networks: {
        confluxMainnet: {
            url: "https://main.confluxrpc.com",
            accounts: [process.env.PRIVATE_KEY1],
            chainId: 1029,
        }
    },
    defaultNetwork: "confluxMainnet",
};



async function getMinGasPrice(conflux, maxGasPrice) {
    let hash = await hre.conflux.getBestBlockHash()
    let block = await hre.conflux.getBlockByHash(hash, true)
    let gasPrices = block.transactions.map(tx => tx.gasPrice)
    let minGasPrice = gasPrices.reduce((min, price) => price < min ? price : min, gasPrices[0]);
    if (minGasPrice > maxGasPrice) {
        throw new Error(` min gas too big:${minGasPrice}> ${maxGasPrice}`)
    }
    return minGasPrice + 10000n;
}

task("cfx", "cfx auto inscription").addParam("maxgasprice", "gasprice")
    .setAction(async (taskArgs, hre) => {
        let {maxgasprice} = taskArgs;
        const signers = await hre.conflux.getSigners();
        const batch = 5;
        const defaultAccountAddresses = signers.map(signer => signer.address);
        maxgasprice = BigInt(maxgasprice);
        for (let i = 0; i < 1000000000; i++) {
            let txs = []
            let gaspPrice = 0n;
            for (let j = 0; j < defaultAccountAddresses.length; j++) {
                try {
                    gaspPrice = await getMinGasPrice(hre.conflux, maxgasprice * 1000000000n)
                } catch (e) {
                    console.error(e)
                    await asyncSleep(1000 * 10)
                    continue
                }
                console.log("current gas:", gaspPrice)
                try {
                    let defaultAccountAddress = defaultAccountAddresses[j]
                    let balance = await hre.conflux.getBalance(defaultAccountAddress);
                    let nonce = await hre.conflux.getNextNonce(defaultAccountAddress);
                    console.log(`Address: ${defaultAccountAddress},  gas: ${gaspPrice}, balance: ${parseFloat(balance / 10000000000000n) / 100000}, nonce: ${nonce}`);
                    let contract = await hre.conflux.getContractAt('CrossSpaceCall', "cfx:aaejuaaaaaaaaaaaaaaaaaaaaaaaaaaaa2sn102vjv");
                    for (let k = 0; k < batch; k++) {
                        let tx = contract.transferEVM("0xc6e865c213c89ca42a622c5572d19f00d84d7a16").sendTransaction({
                            from: defaultAccountAddress,
                            gasPrice: gaspPrice,
                            nonce: nonce + BigInt(k)
                        })
                        txs.push({"address": defaultAccountAddress, "tx": tx})
                    }
                } catch (e) {
                    console.error(`Address: ${defaultAccountAddresses[j]}, Error: ${e}`);
                }
            }
            await Promise.all(txs.map(async (tx) => {
                try {

                    let ret = await tx.tx.executed({
                        delta: 6000,
                        timeout: 80 * 1000
                    })
                    console.log(`Address: ${tx.address}, send succ, hash: ${ret.transactionHash}`);
                } catch (e) {
                    console.error(`Address: ${tx.address}, Error: ${e}`);
                }
            }))
        }
    });


function asyncSleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
