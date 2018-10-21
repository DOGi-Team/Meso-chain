const Web3 = require('web3');
const fs = require('fs');
const net = require('net');
let config = JSON.parse(fs.readFileSync(__dirname + '/../json/config.json').toString());
if (config.WebsocketProvider !== undefined) {
    var web3 = new Web3(new Web3.providers.WebsocketProvider(config.WebsocketProvider));
}
if (config.mainnet.HttpProvider !== undefined) {
    var mWeb3 = new Web3(new Web3.providers.HttpProvider(config.mainnet.HttpProvider));
}
let privateKey = fs.readFileSync(__dirname + '/../privatekey/private.key').toString();
let account = web3.eth.accounts.wallet.add(privateKey);
let mainnetPrivateKey = fs.readFileSync(__dirname + '/../privatekey/mainnet_private.key').toString();
let mainnetAccount = mWeb3.eth.accounts.wallet.add(mainnetPrivateKey);
let hubAddress;


let mHubContract = new mWeb3.eth.Contract(config.mainnet.hubAbi, config.mainnet.hubAddress);
let bHubContract = new web3.eth.Contract(config.hubAbi, hubAddress);

let mPreList = [];
let bPreList = [];

//TODO get fromBlock1
let fromBlock1 = 0;
mHubContract.events.transferOut({fromBlock:fromBlock1})
.on('data', function(event){
	let data = event.returnValues;

	//bPreList add data;
})
.on('changed', function(event){
    // remove event from local database
})
.on('error', console.error);

//send bPreList and clear bPreList