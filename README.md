# cfxInscriptionAuto

简单的cfx 自动打铭文
- 通过一层跨链，控制代理账户，发送交易到二层合约，达到低手续费打铭文的效果
- 代理账户可以在`cfx 交易` 中找到
细节可以了解`[CrossSpaceCall.sol](contracts%2FCrossSpaceCall.sol)`


添加私钥到.env
```shell
npm i 
npm run compile 
hardhat cfx --gasprice 10
```

- 不提供并发打的原因是cfx链的tps很低