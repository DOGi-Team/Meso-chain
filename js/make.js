const Web3 = require('web3');
const fs = require('fs');
const net = require('net');
const config = require('../json/config.json');
if (config.internal.WebsocketProvider !== undefined) {
    var internalWeb3 = new Web3(new Web3.providers.WebsocketProvider(config.internal.WebsocketProvider));
}
if (config.external.WebsocketProvider !== undefined) {
    var externalWeb3 = new Web3(new Web3.providers.WebsocketProvider(config.external.WebsocketProvider));
}
let internalPrivateKey = '0x' + fs.readFileSync(__dirname + '/../privatekey/internal_private.key').toString();
let internalAccount = internalWeb3.eth.accounts.privateKeyToAccount(internalPrivateKey);
let externalPrivateKey = '0x' + fs.readFileSync(__dirname + '/../privatekey/external_private.key').toString();
let externalAccount = externalWeb3.eth.accounts.privateKeyToAccount(externalPrivateKey);
let externalHubContract = new externalWeb3.eth.Contract(config.hubAbi, null, {
    from: externalAccount.address,
    data: config.hubCode,
    gas: 3000000
});
let internalHubContract = new internalWeb3.eth.Contract(config.hubAbi, null, {
    from: internalAccount.address,
    data: config.hubCode,
    gas: 3000000
});
async function deploy(hubContract) {
    hub = await hubContract.deploy().send();
    return hub.options.address;
}
deploy(internalHubContract).then(function(address){
	console.log('Internal hub address: ' + address);
});
deploy(externalHubContract).then(function(address){
	console.log('External hub address: ' + address);
});