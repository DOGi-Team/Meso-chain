let fs = require("fs");
let contract = fs.readFileSync('../contract/DogiHub.sol');

let from = web3.eth.accounts[0];

let Web3 = require('web3.min');
let web3;

if (typeof web3 !== 'undefined') {
    web3 = new Web3(web3.currentProvider);
} else {
    // set the provider you want from Web3.providers
    web3 = new Web3(new Web3.providers.HttpProvider("ws://127.0.0.1:8546"));
}

//编译合约
let source = contract.toString();
let calcCompiled = web3.eth.compile.solidity(source);

console.log(calcCompiled);
console.log("ABI definition:");
console.log(calcCompiled["info"]["abiDefinition"]);

//得到合约对象
let abiDefinition = calcCompiled["info"]["abiDefinition"];
let calcContract = web3.eth.contract(abiDefinition);

//2. 部署合约

//2.1 获取合约的代码，部署时传递的就是合约编译后的二进制码
let deployCode = calcCompiled["code"];

//2.2 部署者的地址，当前取默认账户的第一个地址。
let deployeAddr = web3.eth.accounts[0];

//2.3 异步方式，部署合约
let myContractReturned = calcContract.new({
    data: deployCode,
    from: deployeAddr
}, function(err, myContract) {
    if (!err) {
        // 注意：这个回调会触发两次
        //一次是合约的交易哈希属性完成
        //另一次是在某个地址上完成部署

        // 通过判断是否有地址，来确认是第一次调用，还是第二次调用。
        if (!myContract.address) {
            console.log("contract deploy transaction hash: " + myContract.transactionHash) //部署合约的交易哈希值

            // 合约发布成功后，才能调用后续的方法
        } else {
            console.log("contract deploy address: " + myContract.address) // 合约的部署地址

            //使用transaction方式调用，写入到区块链上
            // myContract.add.sendTransaction(1, 2,{
            //     from: deployeAddr
            // });

            // console.log("after contract deploy, call:" + myContract.getCount.call());
        }

        // 函数返回对象`myContractReturned`和回调函数对象`myContract`是 "myContractReturned" === "myContract",
        // 所以最终`myContractReturned`这个对象里面的合约地址属性也会被设置。
        // `myContractReturned`一开始返回的结果是没有设置的。
    }
});
