const Web3 = require('web3');
const fs = require('fs');
const net = require('net');
const config = require('../json/config.json');
if (config.external.WebsocketProvider !== undefined) {
    var externalWeb3 = new Web3(new Web3.providers.WebsocketProvider(config.external.WebsocketProvider));
}
let externalPrivateKey = '0x' + fs.readFileSync(__dirname + '/../privatekey/external_private.key').toString();
let externalAccount = externalWeb3.eth.accounts.privateKeyToAccount(externalPrivateKey);
process.on('unhandledRejection', error => {
    console.error('unhandledRejection', error);
    process.exit(1) // To exit with a 'failure' code
});
(async () => {
    try {
        let externalErc20 = new externalWeb3.eth.Contract(config.erc20Abi, null, {
            from: externalAccount.address,
            gas: 1000000
        });
        externalErc20 = await externalErc20.deploy({
            data: config.erc20Code,
            arguments: ['Sample', 'SSS', 6, 1000000000000]
        }).send({
            from: externalAccount.address,
            gas: 3000000
        }).on('error', error => {
            console.log('Deploy erc20 error: ' + error);
        });
        console.log("Erc20 deploy success: " + externalErc20.options.address);
        process.exit(0);
    } catch (e) {
        console.log(e);
    }
})();