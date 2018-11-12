const Web3 = require('web3');
const fs = require('fs');
const net = require('net');
const config = require('../json/config.json');
if (config.external.WebsocketProvider !== undefined) {
    var web3_1 = new Web3(new Web3.providers.WebsocketProvider(config.external.WebsocketProvider));
}
if (config.external.HttpProvider !== undefined) {
    var web3_2 = new Web3(new Web3.providers.HttpProvider(config.external.HttpProvider));
}
process.on('unhandledRejection', error => {
    console.error('unhandledRejection', error);
    process.exit(1) // To exit with a 'failure' code
});
(async () => {
    let block = await web3_1.eth.getBlock(4229999)
    console.log(block);
    block = await web3_2.eth.getBlock(4229999)
    console.log(block);
    process.exit();
})();