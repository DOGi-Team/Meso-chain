const Web3 = require('web3');
const fs = require('fs');
const net = require('net');
let config = JSON.parse(fs.readFileSync(__dirname + '/../json/config.json').toString());
if (config.WebsocketProvider !== undefined) {
    var web3 = new Web3(new Web3.providers.WebsocketProvider(config.WebsocketProvider));
}
if (config.mainnet.HttpProvider !== undefined) {
    var mainnetWeb3 = new Web3(new Web3.providers.HttpProvider(config.mainnet.HttpProvider));
}
let privateKey = fs.readFileSync(__dirname + '/../privatekey/private.key').toString();
let account = web3.eth.accounts.wallet.add(privateKey);
let mainnetAddress = '0xB8c77482e45F1F44dE1745F52C74426C631bDD52';
let mainnetPrivateKey = fs.readFileSync(__dirname + '/../privatekey/mainnet_private.key').toString();
let mainnetAccount = mainnetWeb3.eth.accounts.wallet.add(mainnetPrivateKey);
let hubAddress;
async function copyERC20() {
    let mainnetContract = new mainnetWeb3.eth.Contract(config.erc20Abi, mainnetAddress);
    let name = await mainnetContract.methods.name().call();
    let symbol = await mainnetContract.methods.symbol().call();
    let decimals = await mainnetContract.methods.decimals().call();
    let totalSupply = await mainnetContract.methods.totalSupply().call();
    let contract = new web3.eth.Contract(config.erc20Abi, null, {
        from: account.address,
        gas: 10000000
    });
    contract.deploy({
        data: config.erc20Code,
        arguments: [name, symbol, decimals, totalSupply]
    }).send().on('error', function(error) {
        console.log(error)
    }).on('transactionHash', function(transactionHash) {
        console.log(transactionHash);
    }).on('receipt', function(receipt) {
        console.log(receipt.contractAddress) // contains the new contract address
    }).then(function(erc20) {
        erc20.methods.transfer(hubAddress, totalSupply).send({
            from: account.address,
            gas: 10000000
        });
        let mainnetHub = new mainnetWeb3.eth.Contract(config.mainnet.hubAbi, config.mainnet.hubAddress);
        mainnetHub.methods.addContract(mainnetAddress, erc20.options.address).send({
            from: mainnetAccount.address
        });
        console.log(erc20.options.address) // instance with the new contract address
    });
}
copyERC20();