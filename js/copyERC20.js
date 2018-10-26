let externalErc20Address = '0xB8c77482e45F1F44dE1745F52C74426C631bDD52';
const Web3 = require('web3');
const fs = require('fs');
const net = require('net');
let config = JSON.parse(fs.readFileSync(__dirname + '/../json/config.json').toString());
if (config.internal.WebsocketProvider !== undefined) {
    var internalWeb3 = new Web3(new Web3.providers.WebsocketProvider(config.internal.WebsocketProvider));
}
if (config.external.HttpProvider !== undefined) {
    var externalWeb3 = new Web3(new Web3.providers.HttpProvider(config.external.HttpProvider));
}
let internalPrivateKey = fs.readFileSync(__dirname + '/../privatekey/internal_private.key').toString();
let internalAccount = internalWeb3.eth.accounts.wallet.add(internalPrivateKey);
let externalPrivateKey = fs.readFileSync(__dirname + '/../privatekey/external_private.key').toString();
let externalAccount = externalWeb3.eth.accounts.wallet.add(externalPrivateKey);
async function copyERC20(externalErc20Address) {
    let externalErc20 = new externalWeb3.eth.Contract(config.erc20Abi, externalErc20Address);
    let name = await externalErc20.methods.name().call();
    let symbol = await externalErc20.methods.symbol().call();
    let decimals = await externalErc20.methods.decimals().call();
    let totalSupply = await externalErc20.methods.totalSupply().call();
    let internalErc20 = new internalWeb3.eth.Contract(config.erc20Abi, null, {
        from: internalAccount.address,
        gas: 10000000
    });
    internalErc20 = await internalErc20.deploy({
        data: config.erc20Code,
        arguments: [name, symbol, decimals, totalSupply]
    }).send();
    await internalErc20.methods.transfer(config.internal.hubAddress, totalSupply).send();
    let externalHub = new externalWeb3.eth.Contract(config.hubAbi, config.external.hubAddress);
    await externalHub.methods.addContract(externalErc20Address, internalErc20.options.address).send({
        from: externalAccount.address
    });
    let internalHub = new internalWeb3.eth.Contract(config.hubAbi, config.internal.hubAddress);
    await internalHub.methods.addContract(internalErc20.options.address, externalErc20Address).send({
        from: internalAccount.address,
        gas: 10000000
    });
    console.log(internalErc20.options.address) // instance with the new contract address
}
copyERC20(externalErc20Address);