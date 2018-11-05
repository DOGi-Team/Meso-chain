const Web3 = require('web3');
const fs = require('fs');
const net = require('net');
const config = require('../json/config.json');
if (config.internal.WebsocketProvider !== undefined) {
    var internalWeb3 = new Web3(new Web3.providers.WebsocketProvider(config.internal.WebsocketProvider));
}
if (config.external.HttpProvider !== undefined) {
    var externalWeb3 = new Web3(new Web3.providers.HttpProvider(config.external.HttpProvider));
}
let internalHubContract = new internalWeb3.eth.Contract(config.hubAbi, config.internal.hubAddress);
let externalHubContract = new externalWeb3.eth.Contract(config.hubAbi, config.external.hubAddress);
externalHubContract.events.allEvents({
    fromBlock: 0
    // filter: {
    //     erc20Address: config.external.erc20Address[0]
    // }
}).on('data', function(event) {
    let data = event.returnValues;
    console.log(data);
}).on('error', console.error);