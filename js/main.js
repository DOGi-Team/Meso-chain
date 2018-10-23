const Web3 = require('web3');
const fs = require('fs');
const net = require('net');
let config = JSON.parse(fs.readFileSync(__dirname + '/../json/config.json').toString());
if (config.WebsocketProvider !== undefined) {
    var web3 = new Web3(new Web3.providers.WebsocketProvider(config.WebsocketProvider));
}
if (config.external.HttpProvider !== undefined) {
    var externalWeb3 = new Web3(new Web3.providers.HttpProvider(config.external.HttpProvider));
}
let internalPrivateKey = fs.readFileSync(__dirname + '/../privatekey/internal_private.key').toString();
let internalAccount = web3.eth.accounts.wallet.add(internalPrivateKey);
let externalPrivateKey = fs.readFileSync(__dirname + '/../privatekey/external_private.key').toString();
let externalAccount = externalWeb3.eth.accounts.wallet.add(externalPrivateKey);
let externalHubContract = new externalWeb3.eth.Contract(config.hubAbi, config.external.hubAddress);
let internalHubContract = new web3.eth.Contract(config.hubAbi, config.internal.hubAddress, {
    from: internalAccount.address,
    gas: 10000000
});
let externalPreList = {};
let internalPreList = {};
let internalSendList = {};
//TODO get fromBlock1
let fromBlock1 = 0;
externalHubContract.events.transferOut({
    fromBlock: fromBlock1
}).on('data', function(event) {
    let data = event.returnValues;
    internalPreList[data.id] = data;
}).on('error', console.error);
async function internalTransferIn() {
    if (Object.getOwnPropertyNames(internalPreList).length == 0) {
        setTimeout(internalTransferIn, 15000);
    } else {
        internalSendList = {};
        for (let key in internalPreList) {
            internalSendList[key] = internalPreList[key];
        }
        internalHubContract.methods.transferIn().send().on('receipt', function(receipt) {
            let events = receipt.events.TransferIn;
            for (let i in events) {
                delete internalPreList[events[i].returnValues.id];
            }
            internalTransferIn();
        }).on('error', function(error) {
            console.error(error);
            internalTransferIn();
        });
    }
}