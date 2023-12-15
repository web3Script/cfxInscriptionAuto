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


task("cfx", "cfx auto inscription").addParam("gasprice", "gasprice")
    .setAction(async (taskArgs, hre) => {
        const {gasprice} = taskArgs;
        const signers = await hre.conflux.getSigners();
        const defaultAccount = signers[0];
        let gasPrice = BigInt(gasprice);
        for (let i = 0; i < 10000; i++) {
            try {
                let balance = await hre.conflux.getBalance(defaultAccount.address)
                let nonce = await hre.conflux.getNextNonce(defaultAccount.address)
                console.log(`send idx:${i},gasPrice:${gasPrice},balance:${parseFloat(balance / 10000000000000n) / 100000},nonce:${nonce}`)
                let contract = await hre.conflux.getContractAt('CrossSpaceCall', "cfx:aaejuaaaaaaaaaaaaaaaaaaaaaaaaaaaa2sn102vjv");
                let ret = await contract.transferEVM("0xc6e865c213c89ca42a622c5572d19f00d84d7a16").sendTransaction(
                    {from: defaultAccount.address, gasPrice: gasPrice * 1000000000n}
                ).executed({
                    timeout: 120 * 1000
                });
                // let response = await ret.executed();
                console.log(`send succ idx:${i},hash:${ret.transactionHash},balance:${parseFloat(balance / 10000000000000n) / 100000}`)
            } catch (e) {
                console.error(e)
            }
        }
    });