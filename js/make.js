const Web3 = require('web3');
const fs = require('fs');
const net = require('net');
let config = JSON.parse(fs.readFileSync(__dirname + '/../json/config.json').toString());
if (config.internal.WebsocketProvider !== undefined) {
    var internalWeb3 = new Web3(new Web3.providers.WebsocketProvider(config.internal.WebsocketProvider));
}
// web3 = new Web3(new Web3.providers.HttpProvider("http://127.0.0.1:8545"));
// web3 = new Web3(new Web3.providers.IpcProvider("\\\\.\\pipe\\geth.ipc",net));
let privateKey = fs.readFileSync(__dirname + '/../privatekey/internal_private.key').toString();
let account = internalWeb3.eth.accounts.wallet.add(privateKey);
let hub = new internalWeb3.eth.Contract(config.hubAbi, null, {
    from: account.address,
    data: config.hubCode,
    gas: 3000000
});
async function deploy() {
    hub = await hub.deploy().send();
    console.log(hub.options.address);
}
deploy();