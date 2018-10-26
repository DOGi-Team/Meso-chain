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
if (config.external.HttpProvider !== undefined) {
    var externalWeb3 = new Web3(new Web3.providers.HttpProvider(config.external.HttpProvider));
}
let internalPrivateKey = fs.readFileSync(__dirname + '/../privatekey/internal_private.key').toString();
let internalAccount = internalWeb3.eth.accounts.wallet.add(internalPrivateKey);
let externalPrivateKey = fs.readFileSync(__dirname + '/../privatekey/external_private.key').toString();
let externalAccount = externalWeb3.eth.accounts.wallet.add(externalPrivateKey);
let externalHubContract = new externalWeb3.eth.Contract(config.hubAbi, config.external.hubAddress);
let internalHubContract = new internalWeb3.eth.Contract(config.hubAbi, config.internal.hubAddress, {
    from: internalAccount.address,
    gas: 10000000
});
process.on('unhandledRejection', error => {
    console.error('unhandledRejection', error);
    process.exit(1) // To exit with a 'failure' code
});
/****************class begin****************/
function Erc20Transfer(fromChainHub, toChainHub, fromErc20, toErc20) {
    this.fromChainHub = fromChainHub;
    this.toChainHub = toChainHub;
    this.fromErc20 = fromErc20;
    this.toErc20 = toErc20;
    this.pre = {};
}
Erc20Transfer.prototype.checkAddress = async function() {
    if (this.fromErc20) {
        this.toErc20 = await this.fromChainHub.methods.contractMap(this.fromErc20).call();
        let confirmFromErc20 = await this.toChainHub.methods.contractMap(this.toErc20).call();
        if (confirmFromErc20 != this.fromErc20) {
            throw new Error('Non-correspondence erc20 address.');
        }
    } else if (this.toErc20) {
        this.fromErc20 = await this.toChainHub.methods.contractMap(this.toErc20).call();
        let confirmToErc20 = await this.fromChainHub.methods.contractMap(this.fromErc20).call();
        if (confirmToErc20 != this.toErc20) {
            throw new Error('Non-correspondence erc20 address.');
        }
    } else {
        throw new Error('No erc20 address.');
    }
};
Erc20Transfer.prototype.run = async function() {
    await this.checkAddress();
    // let fromId = await this.fromChainHub.methods.transferOutId(this.fromErc20).call();
    let toId = await this.toChainHub.methods.transferIn(toErc20).call();
    let startEvents = await this.fromChainHub.getPastEvents('TransferOut', {
        filter: {
            id: toId,
            erc20Address: this.fromErc20
        },
        fromBlock: 0
    });
    if (startEvents.length == 0) {
        throw new Error('Error log.');
    }
    let fromBlock = startEvents.pop().blockNumber;
    this.fromChainHub.events.TransferOut({
        fromBlock: fromBlock,
        filter: {
            erc20Address: this.fromErc20
        }
    }).on('data', function(event) {
        let data = event.returnValues;
        if (data.id > toId) {
            this.pre[data.id] = data;
        }
    }).on('error', console.error);
    return this.transferIn();
};
Erc20Transfer.prototype.transferIn = async function() {
    let data = {
        id: [],
        erc20Address: [],
        from: [],
        to: [],
        value: []
    };
    let i = await this.toChainHub.methods.transferIn(this.toErc20).call();
    for (i++; typeof this.pre[i] !== 'undefined'; i++) {
        data.id.push(i);
        data.erc20Address.push(this.pre[i].outErc20);
        data.from.push(this.pre[i].from);
        data.to.push(this.pre[i].to);
        data.value.push(this.pre[i].value);
    }
    if (data.id.length == 0) {
        return new Promise((resolve, reject) => setTimeout(() => resolve(this.transferIn()), 15000));
    } else {
        await this.toChainHub.methods.transferIn(data.id, data.erc20Address, data.from, data.to, data.value).send().on('error', function(error) {
            console.error(error);
        });
        return new Promise((resolve, reject) => {
            setTimeout(() => resolve(this.transferIn()), 1000);
        });
    }
};
/****************class end****************/
for (let i = 0; i < config.external.erc20Address.length; i++) {
    let externalErc20 = config.external.erc20Address[i];
    new Erc20Transfer(externalHubContract, internalHubContract, externalErc20).run();
    new Erc20Transfer(internalHubContract, externalHubContract, null, externalErc20).run();
}