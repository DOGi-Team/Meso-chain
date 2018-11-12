function sleep(time = 0) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve();
        }, time);
    })
}
const Web3 = require('web3');
const fs = require('fs');
const net = require('net');
let config = JSON.parse(fs.readFileSync(__dirname + '/../json/config.json').toString());
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
let externalHubContract = new externalWeb3.eth.Contract(config.hubAbi, config.external.hubAddress);
let internalHubContract = new internalWeb3.eth.Contract(config.hubAbi, config.internal.hubAddress);
process.on('unhandledRejection', error => {
    console.error('unhandledRejection', error);
    process.exit(1) // To exit with a 'failure' code
});
/****************class begin****************/
function Chain(web3, hub, erc20Address, privateKey) {
    this.web3 = web3;
    if (erc20Address) {
        this.erc20 = new web3.eth.Contract(config.erc20Abi, erc20Address);
    }
    this.hub = hub;
    if (privateKey) {
        this.account = web3.eth.accounts.wallet.add(privateKey);
    } else {
        this.account = web3.eth.accounts.wallet.add(web3.eth.accounts.create());
    }
}
Chain.prototype.setErc20 = function(erc20Address) {
    this.erc20 = new this.web3.eth.Contract(config.erc20Abi, erc20Address);
}

function Robot(chain1, chain2, fromIndex) {
    this.chain1 = chain1;
    this.chain2 = chain2;
    this.fromIndex = 0;
}
Robot.prototype.checkAddress = async function() {
    if (this.chain1.erc20 && this.chain2.erc20) {
        let confirmErc20Address1 = await this.chain2.hub.methods.contractMap(this.chain2.erc20.options.address).call();
        let confirmErc20Address2 = await this.chain1.hub.methods.contractMap(this.chain1.erc20.options.address).call();
        if (confirmErc20Address1 != this.chain1.erc20.options.address && confirmErc20Address2 != this.chain2.erc20.options.address) {
            throw new Error('Non-correspondence erc20 address.');
        }
    } else if (this.chain1.erc20) {
        let erc20Address2 = await this.chain1.hub.methods.contractMap(this.chain1.erc20.options.address).call();
        let confirmErc20Address1 = await this.chain2.hub.methods.contractMap(erc20Address2).call();
        if (confirmErc20Address1 != this.chain1.erc20.options.address) {
            throw new Error('Non-correspondence erc20 address.');
        } else {
            this.chain2.setErc20(erc20Address2);
        }
    } else if (this.chain2.erc20) {
        let erc20Address1 = await this.chain2.hub.methods.contractMap(this.chain2.erc20.options.address).call();
        let confirmErc20Address2 = await this.chain1.hub.methods.contractMap(erc20Address1).call();
        if (confirmErc20Address2 != this.chain2.erc20.options.address) {
            throw new Error('Non-correspondence erc20 address.');
        } else {
            this.chain1.setErc20(erc20Address1);
        }
    } else {
        throw new Error('No erc20 address.');
    }
};
Robot.prototype.takeErc20 = async function(fromPrivateKey, index, value) {
    let fromAccount = this['chain' + index].web3.eth.accounts.privateKeyToAccount(fromPrivateKey);
    let gasPrice = await this['chain' + index].web3.eth.getGasPrice();
    this.fromIndex = index;
    await this['chain' + index].erc20.methods.transfer(this['chain' + index].account.address, value).send({
        from: fromAccount.address,
        gas: 60000,
        gasPrice: gasPrice
    }).on('error', (error) => {
        console.log('Transfer erc20 error: ' + error);
    });
    // console.log('Transfer erc20 success.');
    await this['chain' + index].web3.eth.sendTransaction({
        from: fromAccount.address,
        to: this['chain' + index].account.address,
        value: 1e16,
        gas: 30000,
        gasPrice: gasPrice
    }).on('error', (error) => {
        console.log('Transfer eth error: ' + error);
    });
    // console.log('Transfer eth success.');
    await this.transfer(0.5);
}
Robot.prototype.transfer = async function(factor = 0.01 * Math.random()) {
    let chain1, chain2;
    if (this.fromIndex == 1) {
        chain1 = this.chain1;
        chain2 = this.chain2;
        this.fromIndex = 2;
    } else if (this.fromIndex == 2) {
        chain1 = this.chain2;
        chain2 = this.chain1;
        this.fromIndex = 1;
    } else {
        return;
    }
    let gasPrice = await chain1.web3.eth.getGasPrice();
    let erc20Amount = await chain1.erc20.methods.balanceOf(chain1.account.address).call();
    let transferAmount = parseInt(erc20Amount * factor);
    await chain1.erc20.methods.approve(chain1.hub.options.address, transferAmount).send({
        from: chain1.account.address,
        gas: 50000,
        gasPrice: gasPrice
    });
    await chain1.hub.methods.transferOut(chain1.erc20.options.address, chain2.account.address, transferAmount).send({
        from: chain1.account.address,
        gas: 100000,
        gasPrice: gasPrice
    });
    console.log('Transfer erc20 success: ' + chain1.account.address + ' to ' + chain2.account.address + ' value ' + transferAmount);
}
Robot.prototype.pre = async function() {
    await this.checkAddress();
    await this.takeErc20(externalPrivateKey, 1, 10000000);
    console.log('prepare success.');
}
Robot.prototype.run = async function() {
    await this.checkAddress();
    this.fromIndex = 2;
    while (this.fromIndex != 0) {
        await this.transfer();
        await sleep(1000);
    }
};
/****************class end****************/
let testInternalPrivateKey = fs.readFileSync(__dirname + '/../privatekey/test_internal_private.key').toString().split('\n');
let testExternalPrivateKey = fs.readFileSync(__dirname + '/../privatekey/test_external_private.key').toString().split('\n');

for (let i = 0; i < 3; i++) {
    new Robot(new Chain(externalWeb3, externalHubContract, config.external.erc20Address[0], '0x' + testExternalPrivateKey[i]), new Chain(internalWeb3, internalHubContract, undefined, '0x' + testInternalPrivateKey[i])).run();
}