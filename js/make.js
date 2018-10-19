const Web3 = require('web3');
const fs = require('fs');
const net = require('net');
let config = JSON.parse(fs.readFileSync(__dirname + '/../json/config.json').toString());
if (config.WebsocketProvider !== undefined) {
    var web3 = new Web3(new Web3.providers.WebsocketProvider(config.WebsocketProvider));
}
// web3 = new Web3(new Web3.providers.HttpProvider("http://127.0.0.1:8545"));
// web3 = new Web3(new Web3.providers.IpcProvider("\\\\.\\pipe\\geth.ipc",net));
let privateKey = fs.readFileSync(__dirname + '/../privatekey/private.key').toString();
let account = web3.eth.accounts.wallet.add(privateKey);
let contract = new web3.eth.Contract(config.hubAbi, null, {
    from: account.address,
    data: config.hubCode,
    gas: 10000000
});
contract.deploy().send().on('error', function(error) {
    console.log(error)
}).on('transactionHash', function(transactionHash) {
    console.log(transactionHash);
}).on('receipt', function(receipt) {
    console.log(receipt.contractAddress) // contains the new contract address
}).then(function(newContractInstance) {
    console.log(newContractInstance) // instance with the new contract address
});