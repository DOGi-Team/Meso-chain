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
let internalAccount = internalWeb3.eth.accounts.wallet.add(internalPrivateKey);
let externalPrivateKey = '0x' + fs.readFileSync(__dirname + '/../privatekey/external_private.key').toString();
let externalAccount = externalWeb3.eth.accounts.wallet.add(externalPrivateKey);
process.on('unhandledRejection', error => {
    console.error('unhandledRejection', error);
    process.exit(1) // To exit with a 'failure' code
});
async function copyERC20(externalErc20Address) {
    try {
    	//get info
        let externalErc20 = new externalWeb3.eth.Contract(config.erc20Abi, externalErc20Address);
        let name = await externalErc20.methods.name().call();
        let symbol = await externalErc20.methods.symbol().call();
        let decimals = await externalErc20.methods.decimals().call();
        let totalSupply = await externalErc20.methods.totalSupply().call();
        //deploy erc20
        let internalErc20 = new internalWeb3.eth.Contract(config.erc20Abi, null, {
            from: internalAccount.address,
            gas: 1000000
        });
        internalErc20 = await internalErc20.deploy({
            data: config.erc20Code,
            arguments: [name, symbol, decimals, totalSupply]
        }).send({
            from: internalAccount.address,
            gas: 3000000
        }).on('error', error => {
            console.log('Deploy erc20 error: ' + error);
        });
        console.log("Erc20 deploy success: " + internalErc20.options.address);
        //transfer totalSupply
        await internalErc20.methods.transfer(config.internal.hubAddress, totalSupply).send({
            from: internalAccount.address,
            gas: 60000
        }).on('error', error => {
            console.log('Transfer totalSupply error: ' + error);
        });
        console.log("Transfer totalSupply success: " + totalSupply);
        //InternalHub addContract
        let internalHub = new internalWeb3.eth.Contract(config.hubAbi, config.internal.hubAddress);
        await internalHub.methods.addContract(internalErc20.options.address, externalErc20Address).send({
            from: internalAccount.address,
            gas: 60000
        }).on('error', error => {
            console.log('InternalHub addContract error: ' + error);
        });
        console.log("InternalHub addContract success.");
        //ExternalHub addContract
        let gasPrice = await externalWeb3.eth.getGasPrice();
        if (externalWeb3.utils.toBN(gasPrice).gt(externalWeb3.utils.toBN('5000000000'))) {
            gasPrice = '5000000000';
        }
        let externalHub = new externalWeb3.eth.Contract(config.hubAbi, config.external.hubAddress);
        await externalHub.methods.addContract(externalErc20Address, internalErc20.options.address).send({
            from: externalAccount.address,
            gas: 60000,
            gasPrice: gasPrice
        }).on('error', error => {
            console.log('ExternalHub addContract error: ' + error);
        });
        console.log("ExternalHub addContract success.");
        console.log(internalErc20.options.address) // instance with the new contract address
    } catch (e) {
        console.log(e);
    }
}
for (let i = 0; i < config.external.erc20Address.length; i++) {
    let externalErc20 = config.external.erc20Address[i];
    copyERC20(externalErc20);
}