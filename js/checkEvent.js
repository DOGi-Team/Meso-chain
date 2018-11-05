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
let internalPrivateKey = '0x' + fs.readFileSync(__dirname + '/../privatekey/internal_private.key').toString();
let internalAccount = internalWeb3.eth.accounts.privateKeyToAccount(internalPrivateKey);
let externalPrivateKey = '0x' + fs.readFileSync(__dirname + '/../privatekey/external_private.key').toString();
let externalAccount = externalWeb3.eth.accounts.wallet.add(externalPrivateKey);
let externalHubContract = new externalWeb3.eth.Contract(config.hubAbi, config.external.hubAddress, {
    from: externalAccount.address,
    gas: 300000
});
let internalHubContract = new internalWeb3.eth.Contract(config.hubAbi, config.internal.hubAddress, {
    from: internalAccount.address,
    gas: 300000
});
let internalErc20 = new internalWeb3.eth.Contract(config.erc20Abi, '0x7A780e0e4455a429928d3c44b76A0fd34972ec10');
process.on('unhandledRejection', error => {
    console.error('unhandledRejection', error);
    process.exit(1) // To exit with a 'failure' code
});

async function main(){
	// let erc20Address = await externalHubContract.methods.contractMap(config.external.erc20Address[0]).call();
	// console.log(erc20Address);
	let balance = await internalErc20.methods.balanceOf(config.internal.hubAddress).call();
	console.log(balance);
	console.log(await internalHubContract.methods.isOwner().call());
}
main();